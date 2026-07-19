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

async function ensureTable(runQuery: (text: string, params?: any[]) => Promise<any>) {
  await runQuery(`
    CREATE TABLE IF NOT EXISTS comunicado_turmas (
      comunicado_id UUID NOT NULL REFERENCES comunicados(id) ON DELETE CASCADE,
      turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
      PRIMARY KEY (comunicado_id, turma_id)
    );
  `);
}

async function resolveSingleTurmaId(
  rawId: string,
  runQuery: (text: string, params?: any[]) => Promise<any>
): Promise<string | null> {
  if (!rawId || rawId === 'todas') return null;

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

function formatRow(row: any) {
  return {
    id: row.id,
    turmaId: row.turma_id || null,
    turmasAlvo: row.turmas_alvo ? row.turmas_alvo.filter(Boolean) : (row.turma_id ? [row.turma_id] : ['todas']),
    titulo: row.titulo,
    tipoCriticidade: row.tipo_criticidade,
    descricao: row.descricao,
    dataPublicacao: row.data_publicacao,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawTurmaId = searchParams.get('turmaId');

    await ensureTable(query);

    if (rawTurmaId) {
      const resolvedTurmaId = await resolveSingleTurmaId(rawTurmaId, query);

      if (!resolvedTurmaId) {
        return NextResponse.json(
          { error: `Turma não encontrada para identificador: ${rawTurmaId}` },
          { status: 404 }
        );
      }

      const result = await query(
        `SELECT c.*, array_agg(ct.turma_id) as turmas_alvo
         FROM comunicados c
         LEFT JOIN comunicado_turmas ct ON c.id = ct.comunicado_id
         WHERE c.turma_id = $1 
            OR c.turma_id IS NULL AND NOT EXISTS (SELECT 1 FROM comunicado_turmas ct2 WHERE ct2.comunicado_id = c.id)
            OR c.id IN (SELECT comunicado_id FROM comunicado_turmas WHERE turma_id = $1)
         GROUP BY c.id
         ORDER BY c.data_publicacao DESC, c.created_at DESC`,
        [resolvedTurmaId]
      );

      return NextResponse.json(result.rows.map(formatRow));
    }

    const result = await query(
      `SELECT c.*, array_agg(ct.turma_id) as turmas_alvo
       FROM comunicados c
       LEFT JOIN comunicado_turmas ct ON c.id = ct.comunicado_id
       GROUP BY c.id
       ORDER BY c.data_publicacao DESC, c.created_at DESC`
    );

    return NextResponse.json(result.rows.map(formatRow));
  } catch (err: any) {
    console.error('Erro no GET /api/comunicados:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const client = await getClient();

  try {
    const body = await request.json();
    const {
      turmaId,
      turmasAlvo = [],
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

    await ensureTable((text, params) => client.query(text, params));
    await client.query('BEGIN');

    // Identificar se é global ou direcionado
    let isGlobal = Array.isArray(turmasAlvo) && (turmasAlvo.includes('todas') || turmasAlvo.length === 0);
    if (!isGlobal && !Array.isArray(turmasAlvo) && (turmaId === null || turmaId === 'todas')) {
      isGlobal = true;
    }

    const result = await client.query(
      `INSERT INTO comunicados
        (turma_id, titulo, tipo_criticidade, descricao, data_publicacao, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        null, // Mantemos turma_id como null em comunicados e usamos comunicado_turmas para relacionamento multi-turma
        titulo,
        tipoCriticidade,
        descricao,
        dataPublicacao,
        statusValue !== undefined ? statusValue : true,
      ]
    );

    const novoId = result.rows[0].id;
    const resolvedIds: string[] = [];

    if (!isGlobal) {
      const listaAlvo = Array.isArray(turmasAlvo) && turmasAlvo.length > 0 ? turmasAlvo : (turmaId ? [turmaId] : []);
      for (const tId of listaAlvo) {
        if (tId && tId !== 'todas') {
          const resId = await resolveSingleTurmaId(tId, (text, params) => client.query(text, params));
          if (resId) {
            await client.query(
              `INSERT INTO comunicado_turmas (comunicado_id, turma_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [novoId, resId]
            );
            resolvedIds.push(resId);
          }
        }
      }
    }

    await client.query('COMMIT');

    const responseRow = {
      ...result.rows[0],
      turmas_alvo: isGlobal ? ['todas'] : resolvedIds
    };

    return NextResponse.json(formatRow(responseRow), { status: 201 });
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

export async function PUT(request: Request) {
  const client = await getClient();

  try {
    const body = await request.json();
    const {
      id,
      turmasAlvo,
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

    await ensureTable((text, params) => client.query(text, params));
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE comunicados SET
        titulo = COALESCE($1, titulo),
        tipo_criticidade = COALESCE($2, tipo_criticidade),
        descricao = COALESCE($3, descricao),
        data_publicacao = COALESCE($4::date, data_publicacao),
        status = COALESCE($5, status),
        updated_at = NOW()
      WHERE id = $6
      RETURNING *`,
      [
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
      return NextResponse.json({ error: 'Comunicado não encontrado.' }, { status: 404 });
    }

    // Se turmasAlvo foi fornecido no PUT, atualizar relacionamentos
    if (Array.isArray(turmasAlvo)) {
      await client.query(`DELETE FROM comunicado_turmas WHERE comunicado_id = $1`, [id]);
      
      const isGlobal = turmasAlvo.includes('todas') || turmasAlvo.length === 0;
      if (!isGlobal) {
        for (const tId of turmasAlvo) {
          if (tId && tId !== 'todas') {
            const resId = await resolveSingleTurmaId(tId, (text, params) => client.query(text, params));
            if (resId) {
              await client.query(
                `INSERT INTO comunicado_turmas (comunicado_id, turma_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [id, resId]
              );
            }
          }
        }
      }
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
      return NextResponse.json({ error: 'Comunicado não encontrado.' }, { status: 404 });
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
