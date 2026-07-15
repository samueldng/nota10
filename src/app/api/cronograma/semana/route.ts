import { NextResponse } from 'next/server';
import { getClient } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Subtarefa {
  titulo: string;
  xp: number;
}

interface TarefaInput {
  titulo: string;
  tipo: string;
  disciplina?: string | null;
  bloco?: string | null;
  xpTotal: number;
  subtarefas: Subtarefa[];
}

interface SemanaPayload {
  turmaId: string;
  semanaNumero: number;
  datasSemana: string;
  tarefas: TarefaInput[];
}

// ─── POST — Salvar semana completa (upsert: deleta existente e recria) ────────
// Body: { turmaId, semanaNumero, datasSemana, tarefas[] }

export async function POST(request: Request) {
  const client = await getClient();

  try {
    const body: SemanaPayload = await request.json();
    const { turmaId, semanaNumero, datasSemana, tarefas } = body;

    // ── Validação de campos obrigatórios ──────────────────────────────────────
    if (!turmaId || !semanaNumero || !datasSemana) {
      client.release();
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes: turmaId, semanaNumero, datasSemana.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(tarefas) || tarefas.length === 0) {
      client.release();
      return NextResponse.json(
        { error: 'O cronograma deve conter ao menos uma tarefa.' },
        { status: 400 }
      );
    }

    // ── Validação individual das tarefas ──────────────────────────────────────
    for (let i = 0; i < tarefas.length; i++) {
      const t = tarefas[i];
      if (!t.titulo?.trim()) {
        client.release();
        return NextResponse.json(
          { error: `Tarefa ${i + 1} está sem título.` },
          { status: 400 }
        );
      }
      if (!t.tipo?.trim()) {
        client.release();
        return NextResponse.json(
          { error: `Tarefa ${i + 1} está sem tipo definido.` },
          { status: 400 }
        );
      }
    }

    // ── Verificar se a turma existe no BD ─────────────────────────────────────
    const turmaCheck = await client.query(
      `SELECT id FROM turmas WHERE id = $1 LIMIT 1`,
      [turmaId]
    );
    if (turmaCheck.rows.length === 0) {
      client.release();
      return NextResponse.json(
        { error: `Turma não encontrada: ${turmaId}` },
        { status: 404 }
      );
    }

    await client.query('BEGIN');

    // ── Delete existing schedule for this turma + week ────────────────────────
    await client.query(
      `DELETE FROM cronograma_atividades
       WHERE turma_id = $1 AND semana_numero = $2`,
      [turmaId, semanaNumero]
    );

    // ── Insert all tasks ──────────────────────────────────────────────────────
    const insertedRows: any[] = [];

    for (let i = 0; i < tarefas.length; i++) {
      const t = tarefas[i];

      // Normalise subtarefas — ensure each has at minimum titulo and xp
      const normalizedSubtarefas = (t.subtarefas || []).map((s) => ({
        titulo: s.titulo?.trim() ?? '',
        xp: typeof s.xp === 'number' && s.xp >= 0 ? s.xp : 0,
      })).filter((s) => s.titulo.length > 0);

      const res = await client.query(
        `INSERT INTO cronograma_atividades
          (turma_id, semana_numero, datas_semana, ordem, tipo, disciplina, bloco,
           titulo, xp_total, subtarefas)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          turmaId,
          semanaNumero,
          datasSemana,
          i + 1,                          // ordem (1-indexed)
          t.tipo,
          t.disciplina || null,
          t.bloco || null,
          t.titulo.trim(),
          typeof t.xpTotal === 'number' ? t.xpTotal : 0,
          JSON.stringify(normalizedSubtarefas),
        ]
      );

      insertedRows.push(res.rows[0]);
    }

    await client.query('COMMIT');

    return NextResponse.json(
      {
        success: true,
        message: `Cronograma da Semana ${semanaNumero} salvo com sucesso.`,
        count: insertedRows.length,
        data: insertedRows.map(formatRow),
      },
      { status: 201 }
    );
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erro no POST /api/cronograma/semana:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao salvar o cronograma semanal.' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// ─── DELETE — Excluir cronograma inteiro de uma turma + semana ───────────────
// Query params: turmaId, semana (número)

export async function DELETE(request: Request) {
  const client = await getClient();

  try {
    const { searchParams } = new URL(request.url);
    const turmaId = searchParams.get('turmaId');
    const semanaParam = searchParams.get('semana');

    if (!turmaId || !semanaParam) {
      client.release();
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios ausentes: turmaId e semana.' },
        { status: 400 }
      );
    }

    const semanaNumero = parseInt(semanaParam, 10);
    if (isNaN(semanaNumero)) {
      client.release();
      return NextResponse.json(
        { error: 'O parâmetro semana deve ser um número inteiro.' },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    const result = await client.query(
      `DELETE FROM cronograma_atividades
       WHERE turma_id = $1 AND semana_numero = $2
       RETURNING id`,
      [turmaId, semanaNumero]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: `Cronograma da Semana ${semanaNumero} excluído com sucesso.`,
      deletedCount: result.rowCount ?? 0,
    });
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erro no DELETE /api/cronograma/semana:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao excluir o cronograma semanal.' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function formatRow(row: any) {
  return {
    id: row.id,
    turmaId: row.turma_id,
    semanaNumero: row.semana_numero,
    datasSemana: row.datas_semana,
    ordem: row.ordem,
    tipo: row.tipo,
    disciplina: row.disciplina ?? null,
    bloco: row.bloco ?? null,
    titulo: row.titulo,
    xpTotal: row.xp_total,
    subtarefas: typeof row.subtarefas === 'string'
      ? JSON.parse(row.subtarefas)
      : (row.subtarefas || []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
