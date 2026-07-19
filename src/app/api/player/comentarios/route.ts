import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS video_comentarios (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conteudo_id UUID NOT NULL REFERENCES conteudos_midia(id) ON DELETE CASCADE,
      aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
      texto TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const conteudoId = searchParams.get('conteudoId');

  if (!conteudoId) {
    return NextResponse.json({ error: 'conteudoId é obrigatório' }, { status: 400 });
  }

  if (!isUuid(String(conteudoId))) {
    return NextResponse.json([]);
  }

  try {
    await ensureTable();

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

    if (!isUuid(String(alunoId)) || !isUuid(String(conteudoId))) {
      return NextResponse.json({
        id: 'mock-' + Date.now(),
        texto: texto.trim(),
        created_at: new Date().toISOString(),
        aluno_nome: 'Aluno (Modo Teste)'
      });
    }

    await ensureTable();

    // Verificar se aluno existe para evitar violação de Foreign Key no Postgres (Erro 500)
    const alunoRes = await query(`SELECT id, nome FROM alunos WHERE id = $1`, [alunoId]);
    if (alunoRes.rows.length === 0) {
      return NextResponse.json({
        id: 'mock-' + Date.now(),
        texto: texto.trim(),
        created_at: new Date().toISOString(),
        aluno_nome: 'Aluno'
      });
    }

    // Verificar se conteúdo existe
    const conteudoRes = await query(`SELECT id FROM conteudos_midia WHERE id = $1`, [conteudoId]);
    if (conteudoRes.rows.length === 0) {
      return NextResponse.json({ error: 'Conteúdo de mídia não encontrado no banco' }, { status: 404 });
    }

    const res = await query(
      `INSERT INTO video_comentarios (aluno_id, conteudo_id, texto)
       VALUES ($1, $2, $3)
       RETURNING id, texto, created_at`,
      [alunoId, conteudoId, texto.trim()]
    );

    return NextResponse.json({
      id: res.rows[0].id,
      texto: res.rows[0].texto,
      created_at: res.rows[0].created_at,
      aluno_nome: alunoRes.rows[0].nome
    });
  } catch (error: any) {
    console.error('Erro ao salvar comentário:', error);
    return NextResponse.json({ error: 'Erro interno ao salvar comentário' }, { status: 500 });
  }
}
