import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Retorna o estado atual do player para retomada
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const alunoId = searchParams.get('alunoId');
  const conteudoId = searchParams.get('conteudoId');

  if (!alunoId || !conteudoId) {
    return NextResponse.json({ error: 'alunoId e conteudoId são obrigatórios' }, { status: 400 });
  }

  try {
    const res = await query(
      `SELECT current_time_seconds, status, percent_watched
       FROM player_state
       WHERE aluno_id = $1 AND conteudo_id = $2`,
      [alunoId, conteudoId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ current_time_seconds: 0, status: 'not_started', percent_watched: 0 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (error: any) {
    console.error('Erro ao buscar player state:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST: Grava posição atual (heartbeat)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { alunoId, conteudoId, currentTime, duration } = body;

    if (!alunoId || !conteudoId || typeof currentTime !== 'number' || typeof duration !== 'number') {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    const percentWatched = duration > 0 ? (currentTime / duration) * 100 : 0;
    
    // Recupera o estado atual para validação anti-skip
    const stateRes = await query(
      `SELECT current_time_seconds FROM player_state WHERE aluno_id = $1 AND conteudo_id = $2`,
      [alunoId, conteudoId]
    );
    
    let previousTime = 0;
    if (stateRes.rows.length > 0) {
      previousTime = parseFloat(stateRes.rows[0].current_time_seconds);
    }
    
    // Anti-skip validation: Não permitir avanço súbito de mais de 15 segundos
    // (A tolerância é 15s considerando um heartbeat de 5s + lag de rede)
    if (currentTime > previousTime + 15 && previousTime > 0) {
      // Ignora o heartbeat suspeito (a menos que seja rewind)
      return NextResponse.json({ error: 'Avanço de tempo inválido detectado (anti-skip)' }, { status: 400 });
    }

    // Upsert the state
    await query(
      `INSERT INTO player_state (aluno_id, conteudo_id, current_time_seconds, duration_seconds, percent_watched, status)
       VALUES ($1, $2, $3, $4, $5, 'in_progress')
       ON CONFLICT (aluno_id, conteudo_id)
       DO UPDATE SET
         current_time_seconds = EXCLUDED.current_time_seconds,
         duration_seconds = EXCLUDED.duration_seconds,
         percent_watched = EXCLUDED.percent_watched,
         status = CASE 
           WHEN player_state.status = 'completed' THEN 'completed' 
           ELSE 'in_progress' 
         END,
         updated_at = NOW()`,
      [alunoId, conteudoId, currentTime, duration, percentWatched]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro no heartbeat do player:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
