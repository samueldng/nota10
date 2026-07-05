import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MOCK_TO_NAME_MAP: Record<string, string> = {
  'T001': '5A Manhã',
  'T002': '5B Tarde',
  'T003': '5C Manhã',
  'T004': '4A Manhã',
  'T005': '4B Tarde',
  'T006': 'Reforço Geral',
  'T007': '5A Manhã 2025',
};

/**
 * Resolve an array of turma identifiers (UUIDs, mock IDs like "T005", or names)
 * into real UUIDs from the `turmas` table.
 * Returns only successfully resolved UUIDs; silently drops unresolvable entries.
 */
async function resolveTurmaIds(
  turmaIds: string[],
  clientQuery: (text: string, params?: any[]) => Promise<any>
): Promise<string[]> {
  const resolved: string[] = [];

  for (const rawId of turmaIds) {
    // Already a valid UUID — verify it exists
    if (UUID_REGEX.test(rawId)) {
      const check = await clientQuery(`SELECT id FROM turmas WHERE id = $1 LIMIT 1`, [rawId]);
      if (check.rows.length > 0) {
        resolved.push(check.rows[0].id);
      } else {
        console.warn(`resolveTurmaIds: UUID ${rawId} not found in turmas table, skipping.`);
      }
      continue;
    }

    // Mock ID (e.g. "T005") — map to a name, then look up
    const mappedName = MOCK_TO_NAME_MAP[rawId];
    if (mappedName) {
      const res = await clientQuery(`SELECT id FROM turmas WHERE nome = $1 LIMIT 1`, [mappedName]);
      if (res.rows.length > 0) {
        resolved.push(res.rows[0].id);
      } else {
        console.warn(`resolveTurmaIds: Mock ID ${rawId} mapped to name "${mappedName}" but no matching turma found.`);
      }
      continue;
    }

    // Treat as a turma name directly
    const res = await clientQuery(`SELECT id FROM turmas WHERE nome = $1 LIMIT 1`, [rawId]);
    if (res.rows.length > 0) {
      resolved.push(res.rows[0].id);
    } else {
      console.warn(`resolveTurmaIds: Could not resolve "${rawId}" to any turma.`);
    }
  }

  return resolved;
}

// ─── GET ────────────────────────────────────────────────────────────────────────

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

// ─── POST ───────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const client = await getClient();

  try {
    const body = await request.json();
    const { nome, email, status, turmas: linkedTurmas } = body;

    if (!nome || !email) {
      client.release();
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    // Resolve turma IDs BEFORE starting the transaction
    let resolvedTurmaIds: string[] = [];
    if (linkedTurmas && Array.isArray(linkedTurmas) && linkedTurmas.length > 0) {
      resolvedTurmaIds = await resolveTurmaIds(
        linkedTurmas,
        (text, params) => client.query(text, params)
      );
    }

    // ── Begin transaction ──
    await client.query('BEGIN');

    // 1. Insert professor
    const result = await client.query(
      `INSERT INTO professores (nome, email, status) VALUES ($1, $2, $3) RETURNING *`,
      [nome, email, status || 'ativo']
    );
    const row = result.rows[0];

    // 2. Insert links to turmas (using resolved UUIDs)
    for (const turmaUuid of resolvedTurmaIds) {
      await client.query(
        `INSERT INTO turma_professores (turma_id, professor_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [turmaUuid, row.id]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({
      id: row.id,
      nome: row.nome,
      email: row.email,
      status: row.status,
      turmas: resolvedTurmaIds,
    }, { status: 201 });
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {}); // best-effort rollback
    console.error('Erro no POST /api/professores:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao salvar o registro no banco de dados.' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// ─── PUT ────────────────────────────────────────────────────────────────────────

export async function PUT(request: Request) {
  const client = await getClient();

  try {
    const body = await request.json();
    const { id, nome, email, status, turmas: linkedTurmas } = body;

    if (!id) {
      client.release();
      return NextResponse.json({ error: 'Identificador do professor ausente.' }, { status: 400 });
    }

    // Resolve turma IDs BEFORE starting the transaction
    let resolvedTurmaIds: string[] = [];
    if (linkedTurmas && Array.isArray(linkedTurmas) && linkedTurmas.length > 0) {
      resolvedTurmaIds = await resolveTurmaIds(
        linkedTurmas,
        (text, params) => client.query(text, params)
      );
    }

    // ── Begin transaction ──
    await client.query('BEGIN');

    // 1. Update professor
    const result = await client.query(
      `UPDATE professores SET nome = $1, email = $2, status = $3 WHERE id = $4 RETURNING *`,
      [nome, email, status, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return NextResponse.json({ error: 'Professor não encontrado.' }, { status: 404 });
    }

    const row = result.rows[0];

    // 2. Delete old turma links, then insert new ones
    await client.query(`DELETE FROM turma_professores WHERE professor_id = $1`, [row.id]);

    for (const turmaUuid of resolvedTurmaIds) {
      await client.query(
        `INSERT INTO turma_professores (turma_id, professor_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [turmaUuid, row.id]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({
      id: row.id,
      nome: row.nome,
      email: row.email,
      status: row.status,
      turmas: resolvedTurmaIds,
    });
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {}); // best-effort rollback
    console.error('Erro no PUT /api/professores:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao atualizar o registro no banco de dados.' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// ─── DELETE ─────────────────────────────────────────────────────────────────────

export async function DELETE(request: Request) {
  const client = await getClient();

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      client.release();
      return NextResponse.json({ error: 'Identificador do professor ausente.' }, { status: 400 });
    }

    await client.query('BEGIN');

    // Step A: Remove all turma links (child rows in junction table)
    await client.query(`DELETE FROM turma_professores WHERE professor_id = $1`, [id]);

    // Step B: Remove the professor record itself
    const result = await client.query(`DELETE FROM professores WHERE id = $1 RETURNING id`, [id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return NextResponse.json({ error: 'Professor não encontrado.' }, { status: 404 });
    }

    await client.query('COMMIT');

    return NextResponse.json({ success: true, message: 'Professor excluído com sucesso.' });
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erro no DELETE /api/professores:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao excluir o registro no banco de dados.' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
