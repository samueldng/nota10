import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const acompanhamento = searchParams.get('acompanhamento');
    const turmaId = searchParams.get('turmaId');
    const periodo = searchParams.get('periodo') || 'geral';

    let sql = '';
    const params: any[] = [];
    let paramIndex = 1;

    // Usamos subqueries correlacionadas para a soma de XP nos períodos semanal/mensal
    // de forma a evitar que múltiplos registros em matriculas multipliquem o XP ganho (produto cartesiano).
    if (periodo === 'semanal') {
      sql = `
        SELECT 
          a.id,
          a.nome,
          string_agg(DISTINCT t.nome, ', ') AS turma_nome,
          a.nivel AS nivel_atual,
          COALESCE(
            (SELECT SUM(ap.xp_ganho)::int 
             FROM aluno_progresso ap 
             WHERE ap.aluno_id = a.id 
               AND ap.created_at >= date_trunc('week', CURRENT_DATE)
            ), 0
          ) AS xp_periodo
        FROM alunos a
        JOIN matriculas m ON m.aluno_id = a.id AND m.status = 'ativo'
        JOIN turmas t ON m.turma_id = t.id
        WHERE 1=1
      `;
    } else if (periodo === 'mensal') {
      sql = `
        SELECT 
          a.id,
          a.nome,
          string_agg(DISTINCT t.nome, ', ') AS turma_nome,
          a.nivel AS nivel_atual,
          COALESCE(
            (SELECT SUM(ap.xp_ganho)::int 
             FROM aluno_progresso ap 
             WHERE ap.aluno_id = a.id 
               AND ap.created_at >= date_trunc('month', CURRENT_DATE)
            ), 0
          ) AS xp_periodo
        FROM alunos a
        JOIN matriculas m ON m.aluno_id = a.id AND m.status = 'ativo'
        JOIN turmas t ON m.turma_id = t.id
        WHERE 1=1
      `;
    } else {
      // geral
      sql = `
        SELECT 
          a.id,
          a.nome,
          string_agg(DISTINCT t.nome, ', ') AS turma_nome,
          a.nivel AS nivel_atual,
          COALESCE(a.xp_total, 0)::int AS xp_periodo
        FROM alunos a
        JOIN matriculas m ON m.aluno_id = a.id AND m.status = 'ativo'
        JOIN turmas t ON m.turma_id = t.id
        WHERE 1=1
      `;
    }

    if (turmaId) {
      sql += ` AND m.turma_id = $${paramIndex++}`;
      params.push(turmaId);
    }

    if (acompanhamento) {
      sql += ` AND $${paramIndex++} = ANY(a.acompanhamento)`;
      params.push(acompanhamento);
    }

    // Sempre agrupamos por aluno para ter exatamente 1 linha por estudante
    sql += ` GROUP BY a.id, a.nome, a.nivel, a.xp_total`;

    // Ordenação estrita por XP decrescente e nome alfabético como critério de desempate
    sql += ` ORDER BY xp_periodo DESC, a.nome ASC`;

    const result = await query(sql, params);

    // Mapeamento e atribuição de posições dinâmicas sequenciais
    const ranking = result.rows.map((row, index) => ({
      id: row.id,
      posicao: index + 1,
      nome: row.nome,
      turma_nome: row.turma_nome || 'Sem turma',
      xp_periodo: row.xp_periodo || 0,
      nivel_atual: row.nivel_atual || 1,
      selos: [] as string[]
    }));

    return NextResponse.json(ranking, { status: 200 });
  } catch (error: any) {
    console.error('[RANKING API ERROR]:', error);
    return NextResponse.json({ error: error.message || 'Erro interno no servidor' }, { status: 500 });
  }
}
