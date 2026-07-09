import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const turmaId = searchParams.get('turmaId');
    
    // We get students and their total XP, plus aggregated stats from registro_alunos
    let sql = `
      SELECT 
        a.id, 
        a.nome, 
        COALESCE(a.xp_total, 0) as "pontuacaoTotal",
        t.nome as turma_nome,
        COALESCE(ra.presenca_total, 0) as presenca,
        COALESCE(ra.videoaula_total, 0) as videoaula,
        COALESCE(ra.palavra_total, 0) as palavra_chave,
        COALESCE(ra.fixacao_total, 0) as fixacao,
        COALESCE(ra.comportamento_total, 0) as comportamento,
        COALESCE(ra.atencao_total, 0) as atencao,
        COALESCE(ra.participacao_total, 0) as participacao
      FROM alunos a
      LEFT JOIN matriculas m ON m.aluno_id = a.id AND m.status = 'ativo'
      LEFT JOIN turmas t ON m.turma_id = t.id
      LEFT JOIN (
        SELECT 
          aluno_id,
          SUM(CASE WHEN presenca = 'presente' THEN 2 ELSE 0 END) as presenca_total,
          SUM(CASE WHEN video = 'fez' THEN 2 ELSE 0 END) as videoaula_total,
          SUM(CASE WHEN palavra_chave = 'fez' THEN 2 ELSE 0 END) as palavra_total,
          SUM(CASE WHEN fixacao = 'fez' THEN 2 ELSE 0 END) as fixacao_total,
          SUM(COALESCE(comportamento::numeric, 0)) as comportamento_total,
          SUM(CASE WHEN atencao = 'atento' THEN 2 ELSE 0 END) as atencao_total,
          SUM(COALESCE(participacao::numeric, 0)) as participacao_total
        FROM registro_alunos
        GROUP BY aluno_id
      ) ra ON ra.aluno_id = a.id
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
      presenca: Number(row.presenca),
      videoaula: Number(row.videoaula),
      palavraChave: Number(row.palavra_chave),
      fixacao: Number(row.fixacao),
      comportamento: Number(row.comportamento),
      atencao: Number(row.atencao),
      participacao: Number(row.participacao),
      selos: [], // Mocked for now, can be computed later
      evolucao: 'manteve',
    }));

    // Deduplicate students (since a student can have multiple active enrollments, left join could duplicate them)
    // If no turma filter was passed, we might have dupes. We can filter them out:
    const uniqueRanking: any[] = [];
    const seen = new Set<string>();
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
