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

    // Buscar atividades concluídas (IDs de subtarefas e tarefas pai)
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
// Body: { alunoId, atividadeId?, tarefaPaiId?, tarefaPaiXp?, subtarefasTotais?, tipoAcao, xpGanho }
// Returns: { xpTotal, nivel, leveledUp, alreadyCompleted?, registro, tarefaPaiConcluida?, xpTarefaPai? }

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
    let body: any;
    try {
      body = await request.json();
    } catch (parseErr) {
      console.error('[POST /api/progresso] Falha ao parsear JSON do body:', parseErr);
      releaseOnce();
      return NextResponse.json({ error: 'Body inválido: JSON malformado.' }, { status: 400 });
    }

    const {
      alunoId,
      atividadeId,         // ID da subtarefa (título string ou UUID)
      tarefaPaiId,         // UUID da tarefa pai na tabela cronograma_atividades
      tarefaPaiXp,         // XP da tarefa pai (para creditar quando todas as subs terminarem)
      subtarefasTotais,    // número total de subtarefas da tarefa pai
      tipoAcao,
      xpGanho,
    } = body;

    // ── Diagnóstico: logar payload recebido em caso de falha de validação
    const logPayload = () => console.error(
      '[POST /api/progresso] Payload recebido:',
      JSON.stringify({ alunoId, atividadeId, tarefaPaiId, tarefaPaiXp, subtarefasTotais, tipoAcao, xpGanho })
    );

    if (!alunoId) {
      logPayload();
      releaseOnce();
      return NextResponse.json(
        { error: 'Campo obrigatório ausente: alunoId.' },
        { status: 400 }
      );
    }

    if (xpGanho == null) {
      logPayload();
      releaseOnce();
      return NextResponse.json(
        { error: 'Campo obrigatório ausente: xpGanho.' },
        { status: 400 }
      );
    }

    // Coerce: aceita number ou string. Subtarefas com 0 XP são válidas (xp >= 0).
    const xp = Number(xpGanho);
    if (!Number.isFinite(xp) || xp < 0) {
      logPayload();
      releaseOnce();
      return NextResponse.json(
        { error: 'xpGanho deve ser um número não-negativo.' },
        { status: 400 }
      );
    }

    const tipoStr = String(tipoAcao || 'atividade').slice(0, 50);

    await client.query('BEGIN');

    // 1. Lock na linha do aluno (previne race conditions paralelas)
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

    // ─── 2. IDEMPOTÊNCIA: INSERT ... ON CONFLICT DO NOTHING ───────────────────
    // Garante que o par (aluno_id, atividade_id) nunca é duplicado,
    // mesmo em requisições paralelas que passariam por um SELECT simples.
    let insertRes: any = null;
    let alreadyCompleted = false;

    if (atividadeId) {
      const atividadeIdStr = String(atividadeId);

      // Tenta inserir — se já existir um registro para esse par, ON CONFLICT não faz nada
      insertRes = await client.query(
        `INSERT INTO aluno_progresso (aluno_id, atividade_id, tipo_acao, xp_ganho)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (aluno_id, atividade_id) DO NOTHING
         RETURNING *`,
        [realAlunoId, atividadeIdStr, tipoStr, xp]
      );

      // Se não retornou nenhuma linha, o registro já existia → atividade já concluída
      if (insertRes.rows.length === 0) {
        await client.query('ROLLBACK');
        releaseOnce();
        return NextResponse.json({
          xpTotal: oldXP,
          nivel: oldNivel,
          leveledUp: false,
          alreadyCompleted: true,
          message: 'Atividade já concluída anteriormente.',
        });
      }

      alreadyCompleted = false;
    } else {
      // Sem atividadeId: simplesmente insere (ex: ação genérica)
      insertRes = await client.query(
        `INSERT INTO aluno_progresso (aluno_id, atividade_id, tipo_acao, xp_ganho)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [realAlunoId, null, tipoStr, xp]
      );
    }

    // ─── 3. Atualizar XP da subtarefa no aluno ────────────────────────────────
    let newXP = oldXP + xp;
    let newNivel = calcNivel(newXP);

    await client.query(
      `UPDATE alunos SET xp_total = $1, nivel = $2 WHERE id = $3`,
      [newXP, newNivel, realAlunoId]
    );

    const row = insertRes.rows[0];
    let tarefaPaiConcluida = false;
    let xpTarefaPai = 0;

    // ─── 4. CASCATA: Verificar se tarefa PAI foi concluída ────────────────────
    // Só executa quando a chamada inclui metadados da tarefa pai
    if (tarefaPaiId && typeof subtarefasTotais === 'number' && subtarefasTotais > 0) {
      // Buscar a tarefa pai para obter a lista completa de subtarefas
      const tarefaPaiRes = await client.query(
        `SELECT id, xp_total, subtarefas FROM cronograma_atividades WHERE id = $1 LIMIT 1`,
        [String(tarefaPaiId)]
      );

      if (tarefaPaiRes.rows.length > 0) {
        const tarefaPai = tarefaPaiRes.rows[0];
        const subtarefasArray: any[] = typeof tarefaPai.subtarefas === 'string'
          ? JSON.parse(tarefaPai.subtarefas)
          : (tarefaPai.subtarefas || []);

        const xpPai = typeof tarefaPaiXp === 'number' && tarefaPaiXp > 0
          ? tarefaPaiXp
          : (tarefaPai.xp_total || 0);

        // Verificar quantas subtarefas deste aluno já foram concluídas (incluindo a que acabou de ser inserida)
        const subTitulosEIds = subtarefasArray.map((s: any) =>
          String(s.id ?? s.titulo)
        );

        if (subTitulosEIds.length > 0) {
          const concluidasRes = await client.query(
            `SELECT COUNT(*) as cnt
             FROM aluno_progresso
             WHERE aluno_id = $1
               AND atividade_id = ANY($2::text[])`,
            [realAlunoId, subTitulosEIds]
          );

          const qtdConcluidas = parseInt(concluidasRes.rows[0]?.cnt ?? '0', 10);

          // Se todas as subtarefas estão concluídas E a tarefa pai ainda não foi registrada:
          if (qtdConcluidas >= subtarefasArray.length && xpPai > 0) {
            // Verifica se a tarefa pai já foi creditada anteriormente
            const paiJaConcluidoRes = await client.query(
              `SELECT id FROM aluno_progresso
               WHERE aluno_id = $1 AND atividade_id = $2
               LIMIT 1`,
              [realAlunoId, String(tarefaPaiId)]
            );

            if (paiJaConcluidoRes.rows.length === 0) {
              // Creditar XP da tarefa pai (usando ON CONFLICT como garantia extra)
              const paiInsert = await client.query(
                `INSERT INTO aluno_progresso (aluno_id, atividade_id, tipo_acao, xp_ganho)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (aluno_id, atividade_id) DO NOTHING
                 RETURNING *`,
                [realAlunoId, String(tarefaPaiId), 'tarefa_concluida', xpPai]
              );

              if (paiInsert.rows.length > 0) {
                // Somar XP da tarefa pai ao total
                newXP += xpPai;
                newNivel = calcNivel(newXP);
                await client.query(
                  `UPDATE alunos SET xp_total = $1, nivel = $2 WHERE id = $3`,
                  [newXP, newNivel, realAlunoId]
                );
                tarefaPaiConcluida = true;
                xpTarefaPai = xpPai;
              }
            }
          }
        }
      }
    }

    await client.query('COMMIT');

    return NextResponse.json(
      {
        xpTotal: newXP,
        nivel: newNivel,
        leveledUp: newNivel > oldNivel,
        alreadyCompleted,
        tarefaPaiConcluida,
        xpTarefaPai,
        registro: {
          id: row.id,
          alunoId: row.aluno_id,
          atividadeId: row.atividade_id,
          tipoAcao: row.tipo_acao,
          xpGanho: row.xp_ganho,
          createdAt: row.created_at,
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
