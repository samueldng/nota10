import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const turmaId = searchParams.get('turmaId');
    
    // We get students and their total XP. 
    // If a turma filter is provided, we join with matriculas to filter it.
    let sql = `
      SELECT 
        a.id, 
        a.nome, 
        a.xp_total as "pontuacaoTotal",
        t.nome as turma_nome
      FROM alunos a
      LEFT JOIN matriculas m ON m.aluno_id = a.id AND m.status = 'ativo'
      LEFT JOIN turmas t ON m.turma_id = t.id
    `;
    
    const params: any[] = [];
    if (turmaId) {
      sql += ` WHERE m.turma_id = $1`;
      params.push(turmaId);
    }

    sql += ` ORDER BY a.xp_total DESC NULLS LAST, a.nome ASC`;

    const result = await query(sql, params);

    // Format for frontend
    const ranking = result.rows.map((row, index) => ({
      posicao: index + 1,
      id: row.id,
      nome: row.nome,
      turma: row.turma_nome || 'Sem turma',
      pontuacaoTotal: row.pontuacaoTotal || 0,
      presenca: 0,
      videoaula: 0,
      palavraChave: 0,
      fixacao: 0,
      comportamento: 0,
      atencao: 0,
      participacao: 0,
      selos: [], // Mocked for now, can be computed later
      evolucao: 'manteve',
    }));

    // Deduplicate students (since a student can have multiple active enrollments, left join could duplicate them)
    // If no turma filter was passed, we might have dupes. We can filter them out:
    const uniqueRanking = [];
    const seen = new Set();
    let pos = 1;
    for (const r of ranking) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        r.posicao = pos++;
        uniqueRanking.push(r);
      } else {
        // Just append the extra turma name if we want
        const existing = uniqueRanking.find(x => x.id === r.id);
        if (existing && r.turma !== 'Sem turma' && !existing.turma.includes(r.turma)) {
          existing.turma += `, ${r.turma}`;
        }
      }
    }

    return NextResponse.json(uniqueRanking);
  } catch (err: any) {
    console.error('Erro no GET /api/ranking:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
