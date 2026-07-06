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
 * Resolve a single turma identifier (UUID, mock ID, or name) to a real UUID.
 * Returns null if unresolvable.
 */
async function resolveSingleTurmaId(
  rawId: string,
  runQuery: (text: string, params?: any[]) => Promise<any>
): Promise<string | null> {
  if (!rawId) return null;

  if (UUID_REGEX.test(rawId)) {
    const check = await runQuery(`SELECT id FROM turmas WHERE id = $1 LIMIT 1`, [rawId]);
    return check.rows.length > 0 ? check.rows[0].id : null;
  }

  const mappedName = MOCK_TO_NAME_MAP[rawId];
  if (mappedName) {
    const res = await runQuery(`SELECT id FROM turmas WHERE nome = $1 LIMIT 1`, [mappedName]);
    return res.rows.length > 0 ? res.rows[0].id : null;
  }

  const res = await runQuery(`SELECT id FROM turmas WHERE nome = $1 LIMIT 1`, [rawId]);
  return res.rows.length > 0 ? res.rows[0].id : null;
}

/**
 * Map a DB row (snake_case) to a camelCase JSON response object.
 */
function formatRow(row: any) {
  return {
    id: row.id,
    turmaId: row.turma_id || null,
    titulo: row.titulo,
    tipoCriticidade: row.tipo_criticidade,
    descricao: row.descricao,
    dataPublicacao: row.data_publicacao,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── GET ────────────────────────────────────────────────────────────────────────
// Query params: turmaId (optional — filters by turma + globals)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawTurmaId = searchParams.get('turmaId');

    // If turmaId is provided, return turma-specific + global (turma_id IS NULL)
    if (rawTurmaId) {
      const resolvedTurmaId = await resolveSingleTurmaId(rawTurmaId, query);

      if (!resolvedTurmaId) {
        return NextResponse.json(
          { error: `Turma não encontrada para identificador: ${rawTurmaId}` },
          { status: 404 }
        );
      }

      const result = await query(
        `SELECT * FROM comunicados
         WHERE (turma_id = $1 OR turma_id IS NULL)
         ORDER BY data_publicacao DESC, created_at DESC`,
        [resolvedTurmaId]
      );

      return NextResponse.json(result.rows.map(formatRow));
    }

    // No turmaId filter: return all comunicados (admin view)
    const result = await query(
      `SELECT * FROM comunicados ORDER BY data_publicacao DESC, created_at DESC`
    );

    return NextResponse.json(result.rows.map(formatRow));
  } catch (err: any) {
    console.error('Erro no GET /api/comunicados:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST ───────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const client = await getClient();

  try {
    const body = await request.json();
    const {
      turmaId,
      titulo,
      tipoCriticidade,
      descricao,
      dataPublicacao,
      status: statusValue,
    } = body;

    if (!titulo || !tipoCriticidade || !descricao || !dataPublicacao) {
      client.release();
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes (titulo, tipoCriticidade, descricao, dataPublicacao).' },
        { status: 400 }
      );
    }

    // Resolve turma ID (nullable — null means global)
    let resolvedTurmaId: string | null = null;
    if (turmaId) {
      resolvedTurmaId = await resolveSingleTurmaId(
        turmaId,
        (text, params) => client.query(text, params)
      );

      if (!resolvedTurmaId) {
        client.release();
        return NextResponse.json(
          { error: `Turma não encontrada para identificador: ${turmaId}` },
          { status: 404 }
        );
      }
    }

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO comunicados
        (turma_id, titulo, tipo_criticidade, descricao, data_publicacao, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        resolvedTurmaId,
        titulo,
        tipoCriticidade,
        descricao,
        dataPublicacao,
        statusValue !== undefined ? statusValue : true,
      ]
    );

    await client.query('COMMIT');

    return NextResponse.json(formatRow(result.rows[0]), { status: 201 });
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erro no POST /api/comunicados:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao salvar o comunicado no banco de dados.' },
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
    const {
      id,
      turmaId,
      titulo,
      tipoCriticidade,
      descricao,
      dataPublicacao,
      status: statusValue,
    } = body;

    if (!id) {
      client.release();
      return NextResponse.json(
        { error: 'Identificador do comunicado ausente.' },
        { status: 400 }
      );
    }

    // Resolve turma ID if being changed (undefined = keep current, null = set to global)
    let resolvedTurmaId: string | null | undefined = undefined;
    if (turmaId !== undefined) {
      if (turmaId === null || turmaId === '') {
        // Explicitly setting to global
        resolvedTurmaId = null;
      } else {
        resolvedTurmaId = await resolveSingleTurmaId(
          turmaId,
          (text, params) => client.query(text, params)
        );

        if (!resolvedTurmaId) {
          client.release();
          return NextResponse.json(
            { error: `Turma não encontrada para identificador: ${turmaId}` },
            { status: 404 }
          );
        }
      }
    }

    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE comunicados SET
        turma_id = CASE WHEN $1::boolean THEN $2::uuid ELSE turma_id END,
        titulo = COALESCE($3, titulo),
        tipo_criticidade = COALESCE($4, tipo_criticidade),
        descricao = COALESCE($5, descricao),
        data_publicacao = COALESCE($6::date, data_publicacao),
        status = COALESCE($7, status),
        updated_at = NOW()
      WHERE id = $8
      RETURNING *`,
      [
        resolvedTurmaId !== undefined,   // $1: should update turma_id?
        resolvedTurmaId ?? null,         // $2: new turma_id value
        titulo ?? null,
        tipoCriticidade ?? null,
        descricao ?? null,
        dataPublicacao ?? null,
        statusValue ?? null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return NextResponse.json(
        { error: 'Comunicado não encontrado.' },
        { status: 404 }
      );
    }

    await client.query('COMMIT');

    return NextResponse.json(formatRow(result.rows[0]));
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erro no PUT /api/comunicados:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao atualizar o comunicado no banco de dados.' },
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
      return NextResponse.json(
        { error: 'Identificador do comunicado ausente.' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    const result = await client.query(
      `DELETE FROM comunicados WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return NextResponse.json(
        { error: 'Comunicado não encontrado.' },
        { status: 404 }
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Comunicado excluído com sucesso.',
      deleted: formatRow(result.rows[0]),
    });
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erro no DELETE /api/comunicados:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao excluir o comunicado no banco de dados.' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
