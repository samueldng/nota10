import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { alunoId } = body;

    if (!alunoId) {
      return NextResponse.json({ error: 'alunoId é obrigatório' }, { status: 400 });
    }

    // 1. Verifica plano
    const alunoRes = await query(`SELECT plano FROM alunos WHERE id = $1`, [alunoId]);
    if (alunoRes.rows.length === 0) {
      return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 });
    }

    if (alunoRes.rows[0].plano !== 'elite') {
      return NextResponse.json({ error: 'Recurso exclusivo do Plano Elite' }, { status: 403 });
    }

    // 2. Busca dados brutos para injetar no prompt
    const progRes = await query(
      `SELECT tipo_acao, COUNT(*), SUM(xp_ganho) as total_xp 
       FROM aluno_progresso 
       WHERE aluno_id = $1 
       GROUP BY tipo_acao`,
      [alunoId]
    );

    // Mock AI call since we don't have an OpenAI key setup in the example
    const dadosBrutos = progRes.rows;
    const aiSummary = `O aluno tem demonstrado excelente progresso, com base em ${dadosBrutos.length} áreas de ação. Mantém consistência no ganho de XP. (Gerado por IA - Mock)`;

    // 3. Salvar no banco o resumo gerado
    await query(
      `INSERT INTO relatorios_ia (aluno_id, resumo, gerado_em) VALUES ($1, $2, NOW())`,
      [alunoId, aiSummary]
    );

    return NextResponse.json({ success: true, summary: aiSummary });

  } catch (error: any) {
    console.error('Erro ao gerar relatório IA:', error);
    return NextResponse.json({ error: 'Erro interno ao gerar relatório com IA' }, { status: 500 });
  }
}
