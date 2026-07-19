import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const conteudoId = searchParams.get('conteudoId');

  if (!conteudoId) {
    return NextResponse.json({ error: 'conteudoId é obrigatório' }, { status: 400 });
  }

  try {
    const res = await query(
      `SELECT vc.id, vc.texto, vc.created_at, a.nome as aluno_nome 
       FROM video_comentarios vc
       JOIN alunos a ON vc.aluno_id = a.id
       WHERE vc.conteudo_id = $1
       ORDER BY vc.created_at DESC`,
      [conteudoId]
    );

    return NextResponse.json(res.rows);
  } catch (error: any) {
    console.error('Erro ao buscar comentários:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { alunoId, conteudoId, texto } = body;

    if (!alunoId || !conteudoId || !texto || texto.trim().length === 0) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO video_comentarios (aluno_id, conteudo_id, texto)
       VALUES ($1, $2, $3)
       RETURNING id, texto, created_at`,
      [alunoId, conteudoId, texto.trim()]
    );

    const alunoRes = await query(`SELECT nome FROM alunos WHERE id = $1`, [alunoId]);
    
    return NextResponse.json({
      id: res.rows[0].id,
      texto: res.rows[0].texto,
      created_at: res.rows[0].created_at,
      aluno_nome: alunoRes.rows.length > 0 ? alunoRes.rows[0].nome : 'Aluno'
    });
  } catch (error: any) {
    console.error('Erro ao salvar comentário:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
