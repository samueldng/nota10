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
    turmaId: row.turma_id,
    turmaNome: row.turma_nome || null,
    tipoConteudo: row.tipo_conteudo,
    titulo: row.titulo,
    descricao: row.descricao || null,
    urlAcesso: row.url_acesso,
    disciplina: row.disciplina || null,
    dataDisponibilizacao: row.data_disponibilizacao,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── GET ────────────────────────────────────────────────────────────────────────
// Query params: turmaId (required), tipoConteudo (optional — 'videoaula', 'pdf', 'simulado')

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawTurmaId = searchParams.get('turmaId');
    const alunoId = searchParams.get('alunoId');
    const tipoConteudo = searchParams.get('tipoConteudo');

    // 1. Se alunoId for fornecido, retornar todos os conteúdos de todas as turmas que o aluno está matriculado
    if (alunoId) {
      let sql = `
        SELECT c.*, t.nome as turma_nome 
        FROM conteudos_midia c
        JOIN turmas t ON c.turma_id = t.id
        WHERE c.status = true 
          AND c.turma_id IN (SELECT turma_id FROM matriculas WHERE aluno_id = $1 AND status = 'ativo')
      `;
      const params: any[] = [alunoId];

      if (tipoConteudo) {
        sql += ` AND c.tipo_conteudo = $2`;
        params.push(tipoConteudo);
      }

      sql += ` ORDER BY c.data_disponibilizacao DESC NULLS LAST, c.created_at DESC`;
      const result = await query(sql, params);
      return NextResponse.json(result.rows.map(formatRow));
    }

    // Admin view: no turmaId filter — return all
    if (!rawTurmaId) {
      let sql = `
        SELECT c.*, t.nome as turma_nome 
        FROM conteudos_midia c
        LEFT JOIN turmas t ON c.turma_id = t.id
      `;
      const params: any[] = [];

      if (tipoConteudo) {
        sql += ` WHERE c.tipo_conteudo = $1`;
        params.push(tipoConteudo);
      }

      sql += ` ORDER BY c.created_at DESC`;

      const result = await query(sql, params);
      return NextResponse.json(result.rows.map(formatRow));
    }

    // Portal view: filter strictly by turma
    const resolvedTurmaId = await resolveSingleTurmaId(rawTurmaId, query);

    if (!resolvedTurmaId) {
      return NextResponse.json(
        { error: `Turma não encontrada para identificador: ${rawTurmaId}` },
        { status: 404 }
      );
    }

    let sql = `
      SELECT c.*, t.nome as turma_nome 
      FROM conteudos_midia c
      LEFT JOIN turmas t ON c.turma_id = t.id
      WHERE c.turma_id = $1
    `;
    const params: any[] = [resolvedTurmaId];

    if (tipoConteudo) {
      sql += ` AND c.tipo_conteudo = $2`;
      params.push(tipoConteudo);
    }

    sql += ` ORDER BY c.data_disponibilizacao DESC NULLS LAST, c.created_at DESC`;

    const result = await query(sql, params);

    return NextResponse.json(result.rows.map(formatRow));
  } catch (err: any) {
    console.error('Erro no GET /api/conteudos:', err);
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
      tipoConteudo,
      titulo,
      descricao,
      urlAcesso,
      disciplina,
      dataDisponibilizacao,
      status: statusValue,
    } = body;

    if (!turmaId || !tipoConteudo || !titulo || !urlAcesso) {
      client.release();
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes (turmaId, tipoConteudo, titulo, urlAcesso).' },
        { status: 400 }
      );
    }

    // Validate tipo_conteudo
    const VALID_TIPOS = ['videoaula', 'pdf', 'simulado'];
    if (!VALID_TIPOS.includes(tipoConteudo)) {
      client.release();
      return NextResponse.json(
        { error: `tipoConteudo inválido. Valores aceitos: ${VALID_TIPOS.join(', ')}` },
        { status: 400 }
      );
    }

    // Resolve turma ID
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

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO conteudos_midia
        (turma_id, tipo_conteudo, titulo, descricao, url_acesso, disciplina, data_disponibilizacao, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        resolvedTurmaId,
        tipoConteudo,
        titulo,
        descricao || null,
        urlAcesso,
        disciplina || null,
        dataDisponibilizacao || null,
        statusValue !== undefined ? statusValue : true,
      ]
    );

    await client.query('COMMIT');

    return NextResponse.json(formatRow(result.rows[0]), { status: 201 });
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erro no POST /api/conteudos:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao salvar o conteúdo no banco de dados.' },
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
      tipoConteudo,
      titulo,
      descricao,
      urlAcesso,
      disciplina,
      dataDisponibilizacao,
      status: statusValue,
    } = body;

    if (!id) {
      client.release();
      return NextResponse.json(
        { error: 'Identificador do conteúdo ausente.' },
        { status: 400 }
      );
    }

    // Validate tipo_conteudo if provided
    if (tipoConteudo) {
      const VALID_TIPOS = ['videoaula', 'pdf', 'simulado'];
      if (!VALID_TIPOS.includes(tipoConteudo)) {
        client.release();
        return NextResponse.json(
          { error: `tipoConteudo inválido. Valores aceitos: ${VALID_TIPOS.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Resolve turma ID if being changed
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
      `UPDATE conteudos_midia SET
        turma_id = COALESCE($1, turma_id),
        tipo_conteudo = COALESCE($2, tipo_conteudo),
        titulo = COALESCE($3, titulo),
        descricao = $4,
        url_acesso = COALESCE($5, url_acesso),
        disciplina = $6,
        data_disponibilizacao = COALESCE($7::date, data_disponibilizacao),
        status = COALESCE($8, status),
        updated_at = NOW()
      WHERE id = $9
      RETURNING *`,
      [
        resolvedTurmaId,
        tipoConteudo ?? null,
        titulo ?? null,
        descricao !== undefined ? (descricao || null) : null,
        urlAcesso ?? null,
        disciplina !== undefined ? (disciplina || null) : null,
        dataDisponibilizacao ?? null,
        statusValue ?? null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return NextResponse.json(
        { error: 'Conteúdo não encontrado.' },
        { status: 404 }
      );
    }

    await client.query('COMMIT');

    return NextResponse.json(formatRow(result.rows[0]));
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erro no PUT /api/conteudos:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao atualizar o conteúdo no banco de dados.' },
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
        { error: 'Identificador do conteúdo ausente.' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    const result = await client.query(
      `DELETE FROM conteudos_midia WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return NextResponse.json(
        { error: 'Conteúdo não encontrado.' },
        { status: 404 }
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Conteúdo excluído com sucesso.',
      deleted: formatRow(result.rows[0]),
    });
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erro no DELETE /api/conteudos:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao excluir o conteúdo no banco de dados.' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
