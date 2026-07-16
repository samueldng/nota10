import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';

export const dynamic = 'force-dynamic';

const XP_POR_NIVEL = 100;

function calcNivel(xp: number): number {
  return Math.floor(xp / XP_POR_NIVEL) + 1;
}

// ─── Helper para resolver ID real do aluno ──────────────────────────────────────
async function resolveAluno(clientOrPool: { query: Function }, alunoIdParam: string, forUpdate = false) {
  const lockClause = forUpdate ? ' FOR UPDATE' : '';
  let res = await clientOrPool.query(
    `SELECT id, xp_total, nivel FROM alunos WHERE id::text = $1 OR numero = $1 LIMIT 1${lockClause}`,
    [alunoIdParam]
  );

  if (res.rows.length === 0 && alunoIdParam === 'a1') {
    res = await clientOrPool.query(
      `SELECT id, xp_total, nivel FROM alunos ORDER BY id ASC LIMIT 1${lockClause}`
    );
  }

  return res.rows.length > 0 ? res.rows[0] : null;
}

// ─── GET ────────────────────────────────────────────────────────────────────────
// Query params: alunoId (required)
// Returns: { xpTotal, nivel, xpAtual, xpProximo, progresso, historico, atividadesConcluidas }

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const alunoIdParam = searchParams.get('alunoId');

    if (!alunoIdParam) {
      return NextResponse.json(
        { error: 'Parâmetro alunoId é obrigatório.' },
        { status: 400 }
      );
    }

    const aluno = await resolveAluno({ query }, alunoIdParam, false);

    if (!aluno) {
      return NextResponse.json(
        { error: 'Aluno não encontrado.' },
        { status: 404 }
      );
    }

    const realAlunoId = aluno.id;
    const xp_total = aluno.xp_total || 0;
    const nivel = aluno.nivel || 1;
    const xpAtual = xp_total % XP_POR_NIVEL;

    // Buscar histórico de progresso (últimos 50 registros)
    const historicoRes = await query(
      `SELECT id, atividade_id, tipo_acao, xp_ganho, created_at
       FROM aluno_progresso
       WHERE aluno_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [realAlunoId]
    );

    // Buscar atividades concluídas
    const completasRes = await query(
      `SELECT DISTINCT atividade_id FROM aluno_progresso WHERE aluno_id = $1 AND atividade_id IS NOT NULL`,
      [realAlunoId]
    );

    return NextResponse.json({
      xpTotal: xp_total,
      nivel: nivel,
      xpAtual,
      xpProximo: XP_POR_NIVEL,
      progresso: Math.round((xpAtual / XP_POR_NIVEL) * 100),
      atividadesConcluidas: completasRes.rows.map((row) => row.atividade_id),
      historico: historicoRes.rows.map((row) => ({
        id: row.id,
        atividadeId: row.atividade_id,
        tipoAcao: row.tipo_acao,
        xpGanho: row.xp_ganho,
        createdAt: row.created_at,
      })),
    });
  } catch (err: any) {
    console.error('Erro no GET /api/progresso:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST ───────────────────────────────────────────────────────────────────────
// Body: { alunoId, atividadeId?, tipoAcao, xpGanho }
// Inserts progress record and atomically updates alunos.xp_total + nivel
// Returns: { xpTotal, nivel, leveledUp, registro }

export async function POST(request: Request) {
  const client = await getClient();
  let released = false;
  const releaseOnce = () => {
    if (!released) {
      released = true;
      client.release();
    }
  };

  try {
    const body = await request.json();
    const { alunoId, atividadeId, tipoAcao, xpGanho } = body;

    if (!alunoId || xpGanho == null) {
      releaseOnce();
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes (alunoId, xpGanho).' },
        { status: 400 }
      );
    }

    const xp = parseInt(xpGanho, 10);
    if (isNaN(xp) || xp <= 0) {
      releaseOnce();
      return NextResponse.json(
        { error: 'xpGanho deve ser um número inteiro positivo.' },
        { status: 400 }
      );
    }

    const tipoStr = String(tipoAcao || 'atividade').slice(0, 50);

    await client.query('BEGIN');

    // 1. Get current XP before update (for level-up detection) with FOR UPDATE lock
    const aluno = await resolveAluno(client, String(alunoId), true);

    if (!aluno) {
      await client.query('ROLLBACK');
      releaseOnce();
      return NextResponse.json(
        { error: 'Aluno não encontrado.' },
        { status: 404 }
      );
    }

    const realAlunoId = aluno.id;
    const oldXP = aluno.xp_total || 0;
    const oldNivel = aluno.nivel || 1;

    // 1.5 Anti-spam check for duplicate activity progress
    if (atividadeId) {
      const existingRes = await client.query(
        `SELECT id FROM aluno_progresso WHERE aluno_id = $1 AND atividade_id = $2 LIMIT 1`,
        [realAlunoId, String(atividadeId)]
      );
      if (existingRes.rows.length > 0) {
        await client.query('ROLLBACK');
        releaseOnce();
        return NextResponse.json({
          xpTotal: oldXP,
          nivel: oldNivel,
          leveledUp: false,
          alreadyCompleted: true,
          message: 'Atividade já concluída anteriormente.'
        });
      }
    }

    // 2. Insert progress record
    const insertRes = await client.query(
      `INSERT INTO aluno_progresso (aluno_id, atividade_id, tipo_acao, xp_ganho)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [realAlunoId, atividadeId ? String(atividadeId) : null, tipoStr, xp]
    );

    // 3. Atomically update XP total and recalculate level
    const newXP = oldXP + xp;
    const newNivel = calcNivel(newXP);

    await client.query(
      `UPDATE alunos SET xp_total = $1, nivel = $2 WHERE id = $3`,
      [newXP, newNivel, realAlunoId]
    );

    await client.query('COMMIT');

    const row = insertRes.rows[0];

    return NextResponse.json({
      xpTotal: newXP,
      nivel: newNivel,
      leveledUp: newNivel > oldNivel,
      registro: {
        id: row.id,
        alunoId: row.aluno_id,
        atividadeId: row.atividade_id,
        tipoAcao: row.tipo_acao,
        xpGanho: row.xp_ganho,
        createdAt: row.created_at,
      },
    }, { status: 201 });
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erro no POST /api/progresso:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao registrar progresso.' },
      { status: 500 }
    );
  } finally {
    releaseOnce();
  }
}
