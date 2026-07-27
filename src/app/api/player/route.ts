import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensureProgressTables } from '@/lib/ensureTables';

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
    await ensureProgressTables();

    // Drip Content Protection (DEFAULT DENY): verificar data_liberacao na cronograma_atividades
    const dripCheck = await query(
      `SELECT data_liberacao FROM cronograma_atividades 
       WHERE id::text = $1::text LIMIT 1`,
      [conteudoId]
    );

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (dripCheck.rows.length > 0) {
      const row = dripCheck.rows[0];
      // DEFAULT DENY: Se data_liberacao for NULL ou futura → bloqueado
      if (!row.data_liberacao) {
        return NextResponse.json(
          { error: 'Conteúdo bloqueado. Data de liberação ainda não definida.' },
          { status: 403 }
        );
      }
      const dataLiberacao = new Date(row.data_liberacao);
      dataLiberacao.setHours(0, 0, 0, 0);
      if (hoje < dataLiberacao) {
        const dataFormatada = dataLiberacao.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return NextResponse.json(
          { error: `Conteúdo bloqueado cronologicamente. Disponível a partir de ${dataFormatada}.` },
          { status: 403 }
        );
      }
    }
    // Se não encontrar no cronograma, permite prosseguir (pode ser vídeo institucional sem drip)

    const res = await query(
      `SELECT current_time_seconds, max_time_seconds, status, percent_watched
       FROM player_state
       WHERE aluno_id::text = $1::text AND conteudo_id::text = $2::text`,
      [alunoId, conteudoId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ current_time_seconds: 0, max_time_seconds: 0, status: 'not_started', percent_watched: 0 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (error: any) {
    console.error('Erro ao buscar player state:', error);
    return NextResponse.json({ error: 'Erro interno no GET do player' }, { status: 500 });
  }
}

// POST: Grava posição atual (heartbeat) — tolerante a rewind
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { alunoId, conteudoId, currentTime, duration, maxTime } = body;

    if (!alunoId || !conteudoId || typeof currentTime !== 'number' || typeof duration !== 'number') {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    await ensureProgressTables();

    const percentWatched = duration > 0 ? (currentTime / duration) * 100 : 0;
    
    // Recupera o estado atual para validação anti-skip server-side
    const stateRes = await query(
      `SELECT current_time_seconds, max_time_seconds FROM player_state WHERE aluno_id::text = $1::text AND conteudo_id::text = $2::text`,
      [alunoId, conteudoId]
    );
    
    let previousMaxTime = 0;
    if (stateRes.rows.length > 0) {
      previousMaxTime = parseFloat(stateRes.rows[0].max_time_seconds || 0);
    }

    // O client envia maxTime (ponto máximo da sessão). 
    // Server valida: maxTime do client não pode exceder o previousMaxTime + tolerância (30s para cobrir heartbeat de 10s + latência + buffering)
    const clientMaxTime = typeof maxTime === 'number' ? maxTime : currentTime;
    if (clientMaxTime > previousMaxTime + 30 && previousMaxTime > 0) {
      console.warn(`[Player Anti-Skip] maxTime suspeito: client=${clientMaxTime.toFixed(1)}, server=${previousMaxTime.toFixed(1)}, diff=${(clientMaxTime - previousMaxTime).toFixed(1)}s. Aluno=${alunoId}, Conteudo=${conteudoId}`);
      // Log warning but don't reject — client-side enforcement is the primary gate
    }

    // O max_time_seconds real é o GREATEST entre o do banco e o do client
    const newMaxTime = Math.max(previousMaxTime, clientMaxTime);

    // Upsert: currentTime pode ser < maxTime (rewind é permitido)
    await query(
      `INSERT INTO player_state (aluno_id, conteudo_id, current_time_seconds, max_time_seconds, duration_seconds, percent_watched, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'in_progress')
       ON CONFLICT (aluno_id, conteudo_id)
       DO UPDATE SET
         current_time_seconds = EXCLUDED.current_time_seconds,
         max_time_seconds = GREATEST(player_state.max_time_seconds, EXCLUDED.max_time_seconds),
         duration_seconds = EXCLUDED.duration_seconds,
         percent_watched = GREATEST(player_state.percent_watched, EXCLUDED.percent_watched),
         status = CASE 
           WHEN player_state.status = 'completed' THEN 'completed' 
           ELSE 'in_progress' 
         END,
         updated_at = NOW()`,
      [String(alunoId).trim(), String(conteudoId).trim(), currentTime, newMaxTime, duration, percentWatched]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro no heartbeat do player:', error);
    return NextResponse.json({ error: 'Erro interno no heartbeat do player' }, { status: 500 });
  }
}
