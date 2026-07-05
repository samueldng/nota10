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

  // Already a valid UUID
  if (UUID_REGEX.test(rawId)) {
    const check = await runQuery(`SELECT id FROM turmas WHERE id = $1 LIMIT 1`, [rawId]);
    return check.rows.length > 0 ? check.rows[0].id : null;
  }

  // Mock ID (e.g. "T005") → mapped name → DB lookup
  const mappedName = MOCK_TO_NAME_MAP[rawId];
  if (mappedName) {
    const res = await runQuery(`SELECT id FROM turmas WHERE nome = $1 LIMIT 1`, [mappedName]);
    return res.rows.length > 0 ? res.rows[0].id : null;
  }

  // Treat as turma name directly
  const res = await runQuery(`SELECT id FROM turmas WHERE nome = $1 LIMIT 1`, [rawId]);
  return res.rows.length > 0 ? res.rows[0].id : null;
}

/**
 * Map a DB row (snake_case) to a camelCase JSON response object.
 */
function formatRow(row: any) {
  return {
    id: row.id,
    turmaId: row.turma_id,
    semanaNumero: row.semana_numero,
    datasSemana: row.datas_semana,
    ordem: row.ordem,
    tipo: row.tipo,
    disciplina: row.disciplina || null,
    bloco: row.bloco || null,
    titulo: row.titulo,
    xpTotal: row.xp_total,
    subtarefas: typeof row.subtarefas === 'string'
      ? JSON.parse(row.subtarefas)
      : (row.subtarefas || []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── GET ────────────────────────────────────────────────────────────────────────
// Query params: turmaId (required), semana (optional — week number as integer)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawTurmaId = searchParams.get('turmaId');
    const semanaParam = searchParams.get('semana');

    if (!rawTurmaId) {
      return NextResponse.json(
        { error: 'Parâmetro turmaId é obrigatório.' },
        { status: 400 }
      );
    }

    // Resolve mock/name to real UUID
    const resolvedTurmaId = await resolveSingleTurmaId(rawTurmaId, query);

    if (!resolvedTurmaId) {
      return NextResponse.json(
        { error: `Turma não encontrada para identificador: ${rawTurmaId}` },
        { status: 404 }
      );
    }

    let sql = `
      SELECT * FROM cronograma_atividades
      WHERE turma_id = $1
    `;
    const params: any[] = [resolvedTurmaId];

    if (semanaParam) {
      const semanaNum = parseInt(semanaParam, 10);
      if (!isNaN(semanaNum)) {
        sql += ` AND semana_numero = $2`;
        params.push(semanaNum);
      }
    }

    sql += ` ORDER BY ordem ASC`;

    const result = await query(sql, params);

    return NextResponse.json(result.rows.map(formatRow));
  } catch (err: any) {
    console.error('Erro no GET /api/cronograma:', err);
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
      semanaNumero,
      datasSemana,
      ordem,
      tipo,
      disciplina,
      bloco,
      titulo,
      xpTotal,
      subtarefas,
    } = body;

    if (!turmaId || !semanaNumero || !datasSemana || !tipo || !titulo) {
      client.release();
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes (turmaId, semanaNumero, datasSemana, tipo, titulo).' },
        { status: 400 }
      );
    }

    // Resolve turma ID before the transaction
    const resolvedTurmaId = await resolveSingleTurmaId(
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

    // Compute auto-order if not provided: next position in that turma+week
    let resolvedOrdem = ordem;
    if (resolvedOrdem == null) {
      const maxRes = await client.query(
        `SELECT COALESCE(MAX(ordem), 0) + 1 as next_ordem
         FROM cronograma_atividades
         WHERE turma_id = $1 AND semana_numero = $2`,
        [resolvedTurmaId, semanaNumero]
      );
      resolvedOrdem = maxRes.rows[0].next_ordem;
    }

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO cronograma_atividades
        (turma_id, semana_numero, datas_semana, ordem, tipo, disciplina, bloco, titulo, xp_total, subtarefas)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        resolvedTurmaId,
        semanaNumero,
        datasSemana,
        resolvedOrdem,
        tipo,
        disciplina || null,
        bloco || null,
        titulo,
        xpTotal || 0,
        JSON.stringify(subtarefas || []),
      ]
    );

    await client.query('COMMIT');

    return NextResponse.json(formatRow(result.rows[0]), { status: 201 });
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erro no POST /api/cronograma:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao salvar a atividade no banco de dados.' },
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
      semanaNumero,
      datasSemana,
      ordem,
      tipo,
      disciplina,
      bloco,
      titulo,
      xpTotal,
      subtarefas,
    } = body;

    if (!id) {
      client.release();
      return NextResponse.json(
        { error: 'Identificador da atividade ausente.' },
        { status: 400 }
      );
    }

    // If turmaId is being changed, resolve it
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
      `UPDATE cronograma_atividades SET
        turma_id = COALESCE($1, turma_id),
        semana_numero = COALESCE($2, semana_numero),
        datas_semana = COALESCE($3, datas_semana),
        ordem = COALESCE($4, ordem),
        tipo = COALESCE($5, tipo),
        disciplina = $6,
        bloco = $7,
        titulo = COALESCE($8, titulo),
        xp_total = COALESCE($9, xp_total),
        subtarefas = COALESCE($10, subtarefas),
        updated_at = NOW()
      WHERE id = $11
      RETURNING *`,
      [
        resolvedTurmaId,
        semanaNumero ?? null,
        datasSemana ?? null,
        ordem ?? null,
        tipo ?? null,
        disciplina !== undefined ? (disciplina || null) : null,
        bloco !== undefined ? (bloco || null) : null,
        titulo ?? null,
        xpTotal ?? null,
        subtarefas !== undefined ? JSON.stringify(subtarefas) : null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return NextResponse.json(
        { error: 'Atividade não encontrada.' },
        { status: 404 }
      );
    }

    await client.query('COMMIT');

    return NextResponse.json(formatRow(result.rows[0]));
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erro no PUT /api/cronograma:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao atualizar a atividade no banco de dados.' },
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
        { error: 'Identificador da atividade ausente.' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    const result = await client.query(
      `DELETE FROM cronograma_atividades WHERE id = $1 RETURNING id, turma_id, semana_numero, ordem`,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return NextResponse.json(
        { error: 'Atividade não encontrada.' },
        { status: 404 }
      );
    }

    // Re-sequence remaining activities in the same turma+week to close gaps
    const deleted = result.rows[0];
    await client.query(
      `UPDATE cronograma_atividades
       SET ordem = ordem - 1, updated_at = NOW()
       WHERE turma_id = $1
         AND semana_numero = $2
         AND ordem > $3`,
      [deleted.turma_id, deleted.semana_numero, deleted.ordem]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Atividade excluída com sucesso.',
    });
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erro no DELETE /api/cronograma:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao excluir a atividade no banco de dados.' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
