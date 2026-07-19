import { NextResponse } from 'next/server';
import { getClient } from '@/lib/db';

export const dynamic = 'force-dynamic';

function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      alunoId,
      atividadeRef = 'apostila_fixacao',
      totalQuestoes = 1,
      acertos = 0,
      erros = 0,
      xpBase = 25
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
        message: 'Fixação concluída (modo teste)'
      });
    }

    const client = await getClient();

    try {
      await client.query('BEGIN');

      await client.query(`
        CREATE TABLE IF NOT EXISTS resultado_questoes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
          atividade_ref VARCHAR(150) NOT NULL,
          total_questoes INT NOT NULL,
          acertos INT NOT NULL,
          erros INT NOT NULL,
          percentual_aproveitamento NUMERIC(5,2) NOT NULL,
          xp_ganho INT NOT NULL DEFAULT 0,
          completed_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE (aluno_id, atividade_ref)
        );
      `);

      const alunoCheck = await client.query(`SELECT id, xp_total, nivel FROM alunos WHERE id = $1 FOR UPDATE`, [alunoId]);
      if (alunoCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Aluno não encontrado no banco' }, { status: 404 });
      }

      await client.query(
        `INSERT INTO resultado_questoes (aluno_id, atividade_ref, total_questoes, acertos, erros, percentual_aproveitamento, xp_ganho, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (aluno_id, atividade_ref)
         DO UPDATE SET
           total_questoes = $3,
           acertos = $4,
           erros = $5,
           percentual_aproveitamento = $6,
           xp_ganho = $7,
           completed_at = NOW()`,
        [alunoId, String(atividadeRef), totalQuestoes, acertos, erros, percentual, xpCalculado]
      );

      const progRes = await client.query(
        `INSERT INTO aluno_progresso (aluno_id, atividade_id, tipo_acao, xp_ganho)
         VALUES ($1, $2, 'fixacao_apostila', $3)
         ON CONFLICT (aluno_id, atividade_id) WHERE atividade_id IS NOT NULL DO NOTHING
         RETURNING id`,
        [alunoId, `${atividadeRef}_${Date.now().toString().slice(-6)}`, xpCalculado]
      );

      let novoXpTotal = alunoCheck.rows[0].xp_total || 0;
      let novoNivel = alunoCheck.rows[0].nivel || 1;
      let leveledUp = false;

      if (xpCalculado > 0) {
        const updateAlunoRes = await client.query(
          `UPDATE alunos SET xp_total = COALESCE(xp_total, 0) + $1 WHERE id = $2 RETURNING xp_total, nivel`,
          [xpCalculado, alunoId]
        );
        novoXpTotal = updateAlunoRes.rows[0].xp_total;
        const nivelAtual = updateAlunoRes.rows[0].nivel;
        const nivelCalculado = Math.floor(novoXpTotal / 100) + 1;

        if (nivelCalculado > nivelAtual) {
          novoNivel = nivelCalculado;
          leveledUp = true;
          await client.query(`UPDATE alunos SET nivel = $1 WHERE id = $2`, [novoNivel, alunoId]);
        } else {
          novoNivel = nivelAtual;
        }
      }

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
        message: 'Exercício de fixação concluído com sucesso!'
      });
    } catch (dbError: any) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Erro em POST /api/questoes/finalizar:', error);
    return NextResponse.json({ error: 'Erro interno na fixação' }, { status: 500 });
  }
}
