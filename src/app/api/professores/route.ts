import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await query(`
      SELECT p.id, p.nome, p.email, p.status, 
             COALESCE(
               array_to_json(array_remove(array_agg(tp.turma_id), NULL)),
               '[]'::json
             ) as turmas
      FROM professores p
      LEFT JOIN turma_professores tp ON p.id = tp.professor_id
      GROUP BY p.id, p.nome, p.email, p.status
      ORDER BY p.nome
    `);
    
    const formatted = result.rows.map(row => ({
      id: row.id,
      nome: row.nome,
      email: row.email,
      status: row.status,
      turmas: typeof row.turmas === 'string' ? JSON.parse(row.turmas) : (row.turmas || []),
    }));

    return NextResponse.json(formatted);
  } catch (err: any) {
    console.error('Error fetching professors:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, email, status, turmas: linkedTurmas } = body;

    if (!nome || !email) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    // 1. Insert professor
    const result = await query(
      `INSERT INTO professores (nome, email, status) VALUES ($1, $2, $3) RETURNING *`,
      [nome, email, status || 'ativo']
    );
    const row = result.rows[0];

    // 2. Insert links to turmas
    if (linkedTurmas && Array.isArray(linkedTurmas) && linkedTurmas.length > 0) {
      for (const tId of linkedTurmas) {
        await query(
          `INSERT INTO turma_professores (turma_id, professor_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [tId, row.id]
        );
      }
    }

    return NextResponse.json({
      id: row.id,
      nome: row.nome,
      email: row.email,
      status: row.status,
      turmas: linkedTurmas || [],
    }, { status: 201 });
  } catch (err: any) {
    console.error('Erro no POST /api/professores:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao salvar o registro no banco de dados.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, nome, email, status, turmas: linkedTurmas } = body;

    if (!id) {
      return NextResponse.json({ error: 'Identificador do professor ausente.' }, { status: 400 });
    }

    // 1. Update professor
    const result = await query(
      `UPDATE professores SET nome = $1, email = $2, status = $3 WHERE id = $4 RETURNING *`,
      [nome, email, status, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Professor não encontrado.' }, { status: 404 });
    }

    const row = result.rows[0];

    // 2. Update links (delete old, insert new)
    await query(`DELETE FROM turma_professores WHERE professor_id = $1`, [row.id]);

    if (linkedTurmas && Array.isArray(linkedTurmas) && linkedTurmas.length > 0) {
      for (const tId of linkedTurmas) {
        await query(
          `INSERT INTO turma_professores (turma_id, professor_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [tId, row.id]
        );
      }
    }

    return NextResponse.json({
      id: row.id,
      nome: row.nome,
      email: row.email,
      status: row.status,
      turmas: linkedTurmas || [],
    });
  } catch (err: any) {
    console.error('Erro no PUT /api/professores:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao atualizar o registro no banco de dados.' },
      { status: 500 }
    );
  }
}
