import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { alunoId, conteudoId } = body;

    if (!alunoId || !conteudoId) {
      return NextResponse.json({ error: 'alunoId e conteudoId são obrigatórios' }, { status: 400 });
    }

    const client = await getClient();

    try {
      await client.query('BEGIN');

      // 1. Verifica se já não foi concluído e o estado atual
      const stateRes = await client.query(
        `SELECT status, percent_watched FROM player_state 
         WHERE aluno_id = $1 AND conteudo_id = $2 FOR UPDATE`,
        [alunoId, conteudoId]
      );

      if (stateRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Estado de vídeo não encontrado' }, { status: 404 });
      }

      const state = stateRes.rows[0];
      
      // Validação anti-fraude: exigir no mínimo 90% assistido
      // (Alguma tolerância devido a créditos finais etc.)
      if (parseFloat(state.percent_watched) < 90) {
        await client.query('ROLLBACK');
        return NextResponse.json({ 
          error: 'Vídeo não foi assistido o suficiente para conclusão',
          percentWatched: state.percent_watched 
        }, { status: 400 });
      }

      if (state.status === 'completed') {
        await client.query('ROLLBACK');
        return NextResponse.json({ success: true, message: 'Já estava concluído', xpGanho: 0 });
      }

      // 2. Atualiza status do vídeo
      await client.query(
        `UPDATE player_state 
         SET status = 'completed', completed_at = NOW(), updated_at = NOW() 
         WHERE aluno_id = $1 AND conteudo_id = $2`,
        [alunoId, conteudoId]
      );

      // 3. Adiciona progresso e XP (Idempotente)
      const XP_VIDEO = 15;
      // Usamos conteudoId como atividade_id para videos
      const progRes = await client.query(
        `INSERT INTO aluno_progresso (aluno_id, atividade_id, tipo_acao, xp_ganho)
         VALUES ($1, $2, 'videoaula', $3)
         ON CONFLICT (aluno_id, atividade_id) WHERE atividade_id IS NOT NULL DO NOTHING
         RETURNING id`,
        [alunoId, conteudoId, XP_VIDEO]
      );

      let xpAdded = 0;
      let leveledUp = false;
      let novoNivel = 1;
      let novoXpTotal = 0;

      if (progRes.rows.length > 0) {
        xpAdded = XP_VIDEO;
        // Atualiza aluno (desnormalizado)
        const alunoRes = await client.query(
          `UPDATE alunos 
           SET xp_total = xp_total + $1 
           WHERE id = $2 
           RETURNING xp_total, nivel`,
          [XP_VIDEO, alunoId]
        );
        
        novoXpTotal = alunoRes.rows[0].xp_total;
        const nivelAtual = alunoRes.rows[0].nivel;
        
        // Regra de level up
        const nivelCalculado = Math.floor(novoXpTotal / 100) + 1;
        if (nivelCalculado > nivelAtual) {
          novoNivel = nivelCalculado;
          leveledUp = true;
          await client.query(`UPDATE alunos SET nivel = $1 WHERE id = $2`, [novoNivel, alunoId]);
        } else {
          novoNivel = nivelAtual;
        }
      }

      // 4. Se a videoaula estiver na trilha (atividades_progresso), atualiza a trilha
      await client.query(
        `UPDATE atividades_progresso
         SET status = 'concluida', completed_at = NOW(), updated_at = NOW()
         WHERE aluno_id = $1 AND atividade_id = $2`,
         [alunoId, conteudoId]
      );

      // Desbloqueia próxima atividade na sequência (lógica simples por ordem)
      // Identificar qual era essa atividade na trilha
      const trilhaRes = await client.query(
        `SELECT t.semana_numero, t.ordem, t.turma_id
         FROM cronograma_atividades t
         WHERE t.id::text = $1 LIMIT 1`,
         [conteudoId] // conteudo_id às vezes mapeia direto pro cronograma.id
      );

      if (trilhaRes.rows.length > 0) {
        const { semana_numero, ordem, turma_id } = trilhaRes.rows[0];
        // Encontra a próxima
        const proxRes = await client.query(
          `SELECT id FROM cronograma_atividades 
           WHERE turma_id = $1 AND semana_numero = $2 AND ordem > $3 
           ORDER BY ordem ASC LIMIT 1`,
           [turma_id, semana_numero, ordem]
        );
        
        if (proxRes.rows.length > 0) {
          const proxId = proxRes.rows[0].id;
          // Libera
          await client.query(
            `UPDATE atividades_progresso SET status = 'em_andamento'
             WHERE aluno_id = $1 AND atividade_id = $2 AND status = 'bloqueada'`,
             [alunoId, proxId]
          );
        }
      }

      await client.query('COMMIT');
      
      return NextResponse.json({ 
        success: true, 
        xpGanho: xpAdded,
        xpTotal: novoXpTotal,
        leveledUp,
        novoNivel
      });

    } catch (e: any) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Erro ao completar vídeo:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
