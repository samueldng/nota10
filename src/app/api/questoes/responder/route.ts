import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { alunoId, atividadeRef, respostas } = body;

    if (!alunoId || !atividadeRef || !respostas || !Array.isArray(respostas)) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    const client = await getClient();

    try {
      await client.query('BEGIN');

      // 1. Validar se já foi concluído
      const resultCheck = await client.query(
        `SELECT id FROM resultado_questoes WHERE aluno_id = $1 AND atividade_ref = $2`,
        [alunoId, atividadeRef]
      );

      if (resultCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Atividade já concluída' }, { status: 400 });
      }

      // 2. Buscar gabarito e calcular resultado
      const qIds = respostas.map(r => r.questaoId);
      
      let questoes = [];
      if (qIds.length > 0) {
        const qRes = await client.query(
          `SELECT id, resposta_correta, explicacao, xp_valor FROM questoes WHERE id = ANY($1::uuid[])`,
          [qIds]
        );
        questoes = qRes.rows;
      }

      let acertos = 0;
      let erros = 0;
      let xpTotalBase = 0; // Somatório do XP possível (peso das questões)
      const correcoes = [];

      // Dicionário de questoes
      const qDict: Record<string, any> = {};
      questoes.forEach(q => qDict[q.id] = q);

      for (const resp of respostas) {
        const qData = qDict[resp.questaoId];
        if (!qData) continue;
        
        const isCorreta = qData.resposta_correta === resp.respostaDada;
        if (isCorreta) {
          acertos++;
        } else {
          erros++;
        }

        xpTotalBase += qData.xp_valor;

        correcoes.push({
          questaoId: resp.questaoId,
          correta: isCorreta,
          respostaCorreta: isCorreta ? undefined : qData.resposta_correta,
          explicacao: isCorreta ? undefined : qData.explicacao
        });

        // Opcional: Salvar resposta individual
        await client.query(
          `INSERT INTO respostas_aluno (aluno_id, questao_id, atividade_ref, resposta_dada, esta_correta)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT DO NOTHING`,
          [alunoId, resp.questaoId, atividadeRef, resp.respostaDada, isCorreta]
        );
      }

      const totalQuestoes = acertos + erros;
      const percentual = totalQuestoes > 0 ? (acertos / totalQuestoes) * 100 : 0;
      
      // Cálculo dinâmico do XP proporcional (mínimo 10%)
      const multiplicador = Math.max(0.10, percentual / 100);
      const xpGanho = Math.round(xpTotalBase * multiplicador);

      // 3. Salvar resultado consolidado
      await client.query(
        `INSERT INTO resultado_questoes (aluno_id, atividade_ref, total_questoes, acertos, erros, percentual_aproveitamento, xp_ganho)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [alunoId, atividadeRef, totalQuestoes, acertos, erros, percentual, xpGanho]
      );

      // 4. Injetar XP na tabela alunos e aluno_progresso
      if (xpGanho > 0) {
        await client.query(
          `INSERT INTO aluno_progresso (aluno_id, atividade_id, tipo_acao, xp_ganho)
           VALUES ($1, $2, 'questoes', $3)
           ON CONFLICT DO NOTHING`,
          [alunoId, atividadeRef, xpGanho]
        );

        const alunoRes = await client.query(
          `UPDATE alunos SET xp_total = xp_total + $1 WHERE id = $2 RETURNING xp_total, nivel`,
          [xpGanho, alunoId]
        );

        const novoXpTotal = alunoRes.rows[0].xp_total;
        const nivelAtual = alunoRes.rows[0].nivel;
        const nivelCalculado = Math.floor(novoXpTotal / 100) + 1;
        
        if (nivelCalculado > nivelAtual) {
          await client.query(`UPDATE alunos SET nivel = $1 WHERE id = $2`, [nivelCalculado, alunoId]);
        }
      }

      // 5. Atualizar trilha
      await client.query(
        `UPDATE atividades_progresso
         SET status = 'concluida', xp_ganho = $1, completed_at = NOW(), updated_at = NOW()
         WHERE aluno_id = $2 AND atividade_id = $3`,
         [xpGanho, alunoId, atividadeRef]
      );
      
      // TODO: Desbloquear próxima atividade da trilha se necessário

      await client.query('COMMIT');

      return NextResponse.json({
        totalQuestoes,
        acertos,
        erros,
        percentualAproveitamento: percentual,
        xpGanho,
        correcoes
      });

    } catch (e: any) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Erro ao submeter questões:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
