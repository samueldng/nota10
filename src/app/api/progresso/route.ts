import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';

export const dynamic = 'force-dynamic';

const XP_POR_NIVEL = 100;

function calcNivel(xp: number): number {
  return Math.floor(xp / XP_POR_NIVEL) + 1;
}

// ─── Helper: resolve aluno pelo ID ou número ───────────────────────────────────
async function resolveAluno(clientOrPool: { query: Function }, alunoIdParam: string, forUpdate = false) {
  const lock = forUpdate ? ' FOR UPDATE' : '';
  let res = await clientOrPool.query(
    `SELECT id, xp_total, nivel FROM alunos WHERE id::text = $1 OR numero = $1 LIMIT 1${lock}`,
    [alunoIdParam]
  );
  if (res.rows.length === 0 && alunoIdParam === 'a1') {
    res = await clientOrPool.query(
      `SELECT id, xp_total, nivel FROM alunos ORDER BY id ASC LIMIT 1${lock}`
    );
  }
  return res.rows.length > 0 ? res.rows[0] : null;
}

// ─── GET /api/progresso ─────────────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const alunoIdParam = searchParams.get('alunoId');
    if (!alunoIdParam) {
      return NextResponse.json({ error: 'alunoId é obrigatório.' }, { status: 400 });
    }

    const aluno = await resolveAluno({ query }, alunoIdParam);
    if (!aluno) {
      return NextResponse.json({ error: 'Aluno não encontrado.' }, { status: 404 });
    }

    const xp_total = aluno.xp_total || 0;
    const nivel    = aluno.nivel    || 1;
    const xpAtual  = xp_total % XP_POR_NIVEL;

    const [historicoRes, completasRes] = await Promise.all([
      query(
        `SELECT id, atividade_id, tipo_acao, xp_ganho, created_at
         FROM aluno_progresso WHERE aluno_id = $1
         ORDER BY created_at DESC LIMIT 50`,
        [aluno.id]
      ),
      query(
        `SELECT DISTINCT atividade_id::text FROM aluno_progresso
         WHERE aluno_id = $1 AND atividade_id IS NOT NULL`,
        [aluno.id]
      ),
    ]);

    return NextResponse.json({
      xpTotal:  xp_total,
      nivel,
      xpAtual,
      xpProximo: XP_POR_NIVEL,
      progresso: Math.round((xpAtual / XP_POR_NIVEL) * 100),
      atividadesConcluidas: completasRes.rows.map((r) => r.atividade_id),
      historico: historicoRes.rows.map((r) => ({
        id:          r.id,
        atividadeId: r.atividade_id,
        tipoAcao:    r.tipo_acao,
        xpGanho:     r.xp_ganho,
        createdAt:   r.created_at,
      })),
    });
  } catch (err: any) {
    console.error('Erro no GET /api/progresso:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST /api/progresso ────────────────────────────────────────────────────────
// Body: { alunoId, atividadeId, xpGanho, tipoAcao? }
// Responsabilidade ÚNICA: INSERT idempotente + UPDATE xp no aluno.
// A lógica de cascata (tarefa pai) é responsabilidade do FRONT-END,
// que envia um segundo POST para o mesmo endpoint com o atividadeId da tarefa pai.

export async function POST(request: Request) {
  const client = await getClient();
  let released = false;
  const releaseOnce = () => { if (!released) { released = true; client.release(); } };

  try {
    // ── Parse body ─────────────────────────────────────────────────────────────
    let body: any;
    try {
      body = await request.json();
    } catch {
      releaseOnce();
      return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
    }

    const { alunoId, atividadeId, xpGanho, tipoAcao } = body;

    // ── Validação mínima ────────────────────────────────────────────────────────
    if (!alunoId) {
      releaseOnce();
      return NextResponse.json({ error: 'alunoId é obrigatório.' }, { status: 400 });
    }
    if (xpGanho == null) {
      releaseOnce();
      return NextResponse.json({ error: 'xpGanho é obrigatório.' }, { status: 400 });
    }
    
    let xp = Number(xpGanho);
    const { desempenho } = body;
    
    // XP Dinâmico baseado em desempenho (percentual de 0 a 100)
    if (desempenho !== undefined && typeof desempenho === 'number') {
      const multiplicador = Math.max(0.10, desempenho / 100);
      xp = Math.round(xp * multiplicador);
    }
    
    if (!Number.isFinite(xp) || xp < 0) {
      releaseOnce();
      return NextResponse.json({ error: 'xpGanho deve ser ≥ 0.' }, { status: 400 });
    }

    // atividadeId é sempre tratado como TEXT — nunca como UUID.
    // A coluna atividade_id em aluno_progresso é TEXT (após migração auto-executada no db.ts).
    const atividadeStr = atividadeId != null ? String(atividadeId) : null;
    const tipoStr      = String(tipoAcao || 'atividade').slice(0, 50);

    await client.query('BEGIN');

    // ── 1. Lock do aluno (previne race conditions em paralelo) ─────────────────
    const aluno = await resolveAluno(client, String(alunoId), true);
    if (!aluno) {
      await client.query('ROLLBACK');
      releaseOnce();
      return NextResponse.json({ error: 'Aluno não encontrado.' }, { status: 404 });
    }

    const realAlunoId = aluno.id;
    const oldXP       = aluno.xp_total || 0;
    const oldNivel    = aluno.nivel    || 1;

    // ── 2. INSERT idempotente ──────────────────────────────────────────────────
    // ON CONFLICT DO NOTHING garante que o par (aluno_id, atividade_id) é único.
    // Se atividade_id for NULL (ação genérica), insere sempre (sem conflict check).
    let insertRes: any;
    let alreadyCompleted = false;

    if (atividadeStr !== null) {
      // Usa casting explícito ::text nos parâmetros para nunca acionar a coluna como UUID.
      insertRes = await client.query(
        `INSERT INTO aluno_progresso (aluno_id, atividade_id, tipo_acao, xp_ganho)
         VALUES ($1, $2::text, $3, $4)
         ON CONFLICT (aluno_id, atividade_id) DO NOTHING
         RETURNING *`,
        [realAlunoId, atividadeStr, tipoStr, xp]
      );

      if (insertRes.rows.length === 0) {
        // Já existia — retorna XP atual sem somar
        await client.query('ROLLBACK');
        releaseOnce();
        return NextResponse.json({
          xpTotal:          oldXP,
          nivel:            oldNivel,
          leveledUp:        false,
          alreadyCompleted: true,
          message:          'Atividade já concluída anteriormente.',
        });
      }
    } else {
      insertRes = await client.query(
        `INSERT INTO aluno_progresso (aluno_id, atividade_id, tipo_acao, xp_ganho)
         VALUES ($1, NULL, $2, $3)
         RETURNING *`,
        [realAlunoId, tipoStr, xp]
      );
    }

    // ── 3. Atualizar XP total ──────────────────────────────────────────────────
    const newXP    = oldXP + xp;
    const newNivel = calcNivel(newXP);

    await client.query(
      `UPDATE alunos SET xp_total = $1, nivel = $2 WHERE id = $3`,
      [newXP, newNivel, realAlunoId]
    );

    await client.query('COMMIT');

    const row = insertRes.rows[0];
    return NextResponse.json(
      {
        xpTotal:          newXP,
        nivel:            newNivel,
        leveledUp:        newNivel > oldNivel,
        alreadyCompleted: false,
        registro: {
          id:          row.id,
          alunoId:     row.aluno_id,
          atividadeId: row.atividade_id,
          tipoAcao:    row.tipo_acao,
          xpGanho:     row.xp_ganho,
          createdAt:   row.created_at,
        },
      },
      { status: 201 }
    );
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
