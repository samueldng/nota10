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
        COALESCE(r.presenca, 0) as presenca,
        COALESCE(r.videoaula, 0) as videoaula,
        COALESCE(r.palavra_chave, 0) as palavra_chave,
        COALESCE(r.fixacao, 0) as fixacao,
        COALESCE(r.comportamento, 0) as comportamento,
        COALESCE(r.atencao, 0) as atencao,
        COALESCE(r.participacao, 0) as participacao
      FROM alunos a
      LEFT JOIN matriculas m ON m.aluno_id = a.id AND m.status = 'ativo'
      LEFT JOIN turmas t ON m.turma_id = t.id
      LEFT JOIN (
          SELECT 
            aluno as aluno_id,
            SUM(CASE WHEN presenca = 'presente' THEN 1 ELSE 0 END)::numeric as presenca,
            SUM(CASE WHEN video = 'concluido' THEN 1 ELSE 0 END)::numeric as videoaula,
            SUM(CASE WHEN palavra_chave = 'fez' THEN 1 ELSE 0 END)::numeric as palavra_chave,
            SUM(CASE WHEN fixacao = 'fez' THEN 1 ELSE 0 END)::numeric as fixacao,
            SUM(COALESCE(comportamento, 0))::numeric as comportamento,
            SUM(CASE WHEN atencao = 'atento' THEN 1 ELSE 0 END)::numeric as atencao,
            SUM(COALESCE(participacao, 0))::numeric as participacao
          FROM registros_lancados
          GROUP BY aluno
      ) r ON a.id = r.aluno_id
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

    // Deduplicate students
    const uniqueRanking: any[] = [];
    const seen = new Set<string>();
    let pos = 1;
    for (const r of ranking) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        r.posicao = pos++;
        uniqueRanking.push(r);
      } else {
        const existing = uniqueRanking.find(x => x.id === r.id);
        if (existing && r.turma !== 'Sem turma' && !existing.turma.includes(r.turma)) {
          existing.turma += `, ${r.turma}`;
        }
      }
    }

    return NextResponse.json(uniqueRanking, { status: 200 });
  } catch (error: any) {
    console.error('[RANKING API ERROR]:', error);
    // Return empty array with 200 to avoid breaking the frontend
    return NextResponse.json([], { status: 200 });
  }
}
