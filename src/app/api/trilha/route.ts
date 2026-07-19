import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const alunoId = searchParams.get('alunoId');
  
  if (!alunoId) {
    return NextResponse.json({ error: 'alunoId é obrigatório' }, { status: 400 });
  }

  try {
    // 1. Pega turma do aluno
    const alunoRes = await query(
      `SELECT m.turma_id, t.nome as turma_nome
       FROM matriculas m
       JOIN turmas t ON m.turma_id = t.id
       WHERE m.aluno_id = $1 LIMIT 1`,
      [alunoId]
    );

    if (alunoRes.rows.length === 0) {
      return NextResponse.json({ semanas: [] });
    }

    const turmaId = alunoRes.rows[0].turma_id;

    // 2. Busca todas as atividades do cronograma daquela turma
    // e os status de progresso do aluno (bloqueada, em_andamento, concluida)
    const trilhaRes = await query(
      `SELECT 
         c.id, c.semana_numero, c.datas_semana, c.ordem, c.tipo, c.disciplina, c.bloco, c.titulo, c.xp_total, c.data_liberacao, c.dia_semana,
         COALESCE(p.status, 'bloqueada') as status,
         p.xp_ganho
       FROM cronograma_atividades c
       LEFT JOIN atividades_progresso p ON c.id::text = p.atividade_id AND p.aluno_id = $1
       WHERE c.turma_id = $2
       ORDER BY c.semana_numero ASC, c.ordem ASC`,
      [alunoId, turmaId]
    );

    // 3. Agrupa por semana e aplica lógica de liberação (Time-Gating server-side)
    const semanasMap = new Map();
    const hoje = new Date();
    // Reset horas para comparação justa
    hoje.setHours(0,0,0,0);

    for (const row of trilhaRes.rows) {
      if (!semanasMap.has(row.semana_numero)) {
        
        let liberada = false;
        
        // Verifica se a data de liberação da semana já passou ou é hoje
        if (row.data_liberacao) {
           const dtLiberacao = new Date(row.data_liberacao);
           dtLiberacao.setHours(0,0,0,0);
           if (hoje >= dtLiberacao) liberada = true;
        } else {
           // Se não tem data_liberacao específica, consideramos semana 1 sempre liberada para mock temporário
           if (row.semana_numero === 1) liberada = true;
        }

        semanasMap.set(row.semana_numero, {
          semana_numero: row.semana_numero,
          datas_semana: row.datas_semana,
          liberada: liberada,
          atividades: []
        });
      }

      const semana = semanasMap.get(row.semana_numero);
      
      // Se a semana está bloqueada, forçamos o status das atividades para 'bloqueada' no retorno
      const statusFinal = semana.liberada ? row.status : 'bloqueada';

      semana.atividades.push({
        id: row.id,
        ordem: row.ordem,
        dia_semana: row.dia_semana,
        tipo: row.tipo,
        disciplina: row.disciplina,
        bloco: row.bloco,
        titulo: row.titulo,
        xp_total: row.xp_total,
        status: statusFinal,
        xp_ganho: row.xp_ganho || 0
      });
    }

    return NextResponse.json({ 
      semanas: Array.from(semanasMap.values()),
      turmaNome: alunoRes.rows[0].turma_nome
    });

  } catch (error: any) {
    console.error('Erro ao buscar trilha:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
