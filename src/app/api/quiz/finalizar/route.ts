import { NextResponse } from 'next/server';
import { getClient } from '@/lib/db';
import { ensureProgressTables } from '@/lib/ensureTables';

export const dynamic = 'force-dynamic';

function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      alunoId,
      quizId = 'quiz-corujinha',
      atividadeRef = 'revisao_corujinha',
      totalQuestoes = 1,
      acertos = 0,
      erros = 0,
      xpBase = 30
    } = body;

    if (!alunoId) {
      return NextResponse.json({ error: 'alunoId obrigatório' }, { status: 400 });
    }

    const percentual = totalQuestoes > 0 ? Number(((acertos / totalQuestoes) * 100).toFixed(2)) : 0;
    const xpCalculado = Math.max(5, Math.round((acertos / Math.max(totalQuestoes, 1)) * xpBase));

    if (!isUuid(String(alunoId))) {
      return NextResponse.json({
        success: true,
        mock: true,
        acertos,
        erros,
        percentual,
        xpGanho: xpCalculado,
        xpTotal: xpCalculado,
        leveledUp: false,
        novoNivel: 1,
        message: 'Revisão finalizada e XP computado (modo teste)'
      });
    }

    await ensureProgressTables();

    const client = await getClient();

    try {
      await client.query('BEGIN');

      await client.query(`
        CREATE TABLE IF NOT EXISTS quiz_resultados (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
          quiz_id VARCHAR(150) NOT NULL,
          atividade_ref VARCHAR(150),
          total_questoes INT NOT NULL,
          acertos INT NOT NULL,
          erros INT NOT NULL,
          percentual NUMERIC(5,2) NOT NULL,
          xp_ganho INT NOT NULL,
          completed_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE (aluno_id, quiz_id, atividade_ref)
        );
      `);

      // Verificar aluno com trava FOR UPDATE para garantir consistência transacional
      const alunoCheck = await client.query(`SELECT id, xp_total, nivel FROM alunos WHERE id = $1 FOR UPDATE`, [alunoId]);
      if (alunoCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Aluno não encontrado no banco' }, { status: 404 });
      }

      // Gravar resultado do quiz de forma idempotente sem interromper a transação
      await client.query(
        `INSERT INTO quiz_resultados (aluno_id, quiz_id, atividade_ref, total_questoes, acertos, erros, percentual, xp_ganho, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         ON CONFLICT DO NOTHING`,
        [alunoId, String(quizId), String(atividadeRef), totalQuestoes, acertos, erros, percentual, xpCalculado]
      );

      // Chave única de atividade com hash aleatório para segurança concorrente
      const uniqueAtvKey = `${quizId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // Adicionar entrada em aluno_progresso para auditoria de XP
      await client.query(
        `INSERT INTO aluno_progresso (aluno_id, atividade_id, tipo_acao, xp_ganho)
         VALUES ($1, $2, 'quiz_revisao', $3)
         ON CONFLICT (aluno_id, atividade_id) WHERE atividade_id IS NOT NULL DO NOTHING`,
        [alunoId, uniqueAtvKey, xpCalculado]
      );

      let novoXpTotal = alunoCheck.rows[0].xp_total || 0;
      let novoNivel = alunoCheck.rows[0].nivel || 1;
      let leveledUp = false;

      // Concede ou ajusta saldo do aluno atomicamente no PostgreSQL
      if (xpCalculado > 0) {
        const updateAlunoRes = await client.query(
          `UPDATE alunos SET xp_total = COALESCE(xp_total, 0) + $1 WHERE id = $2 RETURNING xp_total, nivel`,
          [xpCalculado, alunoId]
        );
        novoXpTotal = updateAlunoRes.rows[0].xp_total;
        const nivelAtual = updateAlunoRes.rows[0].nivel;
        const nivelCalculado = Math.floor(novoXpTotal / 500) + 1;

        if (nivelCalculado > nivelAtual) {
          novoNivel = nivelCalculado;
          leveledUp = true;
          await client.query(`UPDATE alunos SET nivel = $1 WHERE id = $2`, [novoNivel, alunoId]);
        } else {
          novoNivel = nivelAtual;
        }
      }

      // Concluir na trilha se aplicável
      try {
        await client.query(
          `UPDATE atividades_progresso
           SET status = 'concluida', completed_at = NOW(), xp_ganho = $3, updated_at = NOW()
           WHERE aluno_id = $1 AND atividade_id = $2`,
          [alunoId, String(atividadeRef), xpCalculado]
        );
      } catch (e) {}

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        acertos,
        erros,
        percentual,
        xpGanho: xpCalculado,
        xpTotal: novoXpTotal,
        leveledUp,
        novoNivel,
        message: 'Revisão Corujinha concluída!'
      });
    } catch (dbError: any) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('Erro de banco em quiz/finalizar:', dbError);
      return NextResponse.json({ error: dbError.message || 'Erro no banco' }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Erro em POST /api/quiz/finalizar:', error);
    return NextResponse.json({ error: error.message || 'Erro interno no cômputo do quiz' }, { status: 500 });
  }
}
