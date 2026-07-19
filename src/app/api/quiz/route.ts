import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const atividadeRef = searchParams.get('atividadeRef');
  
  if (!atividadeRef) {
    return NextResponse.json({ error: 'atividadeRef é obrigatório' }, { status: 400 });
  }

  try {
    const quizRes = await query(`SELECT * FROM quizzes WHERE atividade_ref = $1 LIMIT 1`, [atividadeRef]);
    
    if (quizRes.rows.length === 0) {
      return NextResponse.json({ error: 'Quiz não encontrado para esta atividade' }, { status: 404 });
    }
    
    const quiz = quizRes.rows[0];

    const qRes = await query(
      `SELECT q.id, q.disciplina, q.bloco, q.enunciado, q.tipo, q.alternativas, q.xp_valor, qq.ordem
       FROM quiz_questoes qq
       JOIN questoes q ON qq.questao_id = q.id
       WHERE qq.quiz_id = $1
       ORDER BY qq.ordem ASC`,
      [quiz.id]
    );

    return NextResponse.json({ quiz, questoes: qRes.rows });
  } catch (error: any) {
    console.error('Erro ao buscar quiz:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
