import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Retorna questões para uma atividade
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const atividadeRef = searchParams.get('atividadeRef');
  
  if (!atividadeRef) {
    return NextResponse.json({ error: 'atividadeRef é obrigatório' }, { status: 400 });
  }

  try {
    // Retorna questões sem a resposta correta para o frontend
    const res = await query(
      `SELECT id, disciplina, bloco, enunciado, tipo, alternativas, ordem, xp_valor
       FROM questoes 
       WHERE atividade_ref = $1
       ORDER BY ordem ASC`,
      [atividadeRef]
    );

    return NextResponse.json(res.rows);
  } catch (error: any) {
    console.error('Erro ao buscar questões:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST: (Admin) Cria questão
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { disciplina, bloco, enunciado, tipo, alternativas, resposta_correta, explicacao, xp_valor, ordem, atividade_ref } = body;

    const res = await query(
      `INSERT INTO questoes (disciplina, bloco, enunciado, tipo, alternativas, resposta_correta, explicacao, xp_valor, ordem, atividade_ref)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [disciplina, bloco, enunciado, tipo || 'multipla_escolha', alternativas, resposta_correta, explicacao, xp_valor || 10, ordem || 0, atividade_ref]
    );

    return NextResponse.json({ success: true, id: res.rows[0].id });
  } catch (error: any) {
    console.error('Erro ao criar questão:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// DELETE: (Admin) Remove questão
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });

  try {
    await query(`DELETE FROM questoes WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao remover questão:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
