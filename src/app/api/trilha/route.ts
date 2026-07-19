import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const alunoId = searchParams.get('alunoId');
  
  if (!alunoId) {
    return NextResponse.json({ error: 'alunoId é obrigatório' }, { status: 400 });
  }

  // Se alunoId não é UUID válido, retornar resposta vazia estruturada
  if (!isUuid(String(alunoId))) {
    return NextResponse.json({
      turmaNome: 'Modo Demonstração',
      futuro: false,
      semanas: []
    });
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  try {
    let turma = null;
    let fallbackUsado = false;

    // 1. OBRIGATÓRIO: Buscar a turma ativa na tabela matriculas usando um JOIN explícito
    try {
      const alunoRes = await query(
        `SELECT m.turma_id, t.nome as turma_nome, t.data_inicio
         FROM matriculas m
         JOIN turmas t ON m.turma_id = t.id
         WHERE m.aluno_id = $1 AND m.status = 'ativo' LIMIT 1`,
        [alunoId]
      );
      if (alunoRes.rows.length > 0) {
        turma = alunoRes.rows[0];
      }
    } catch (dbErr) {
      console.error('[Trilha API] Falha SQL ao buscar matrícula:', dbErr);
    }

    // 2. FALLBACK DE SEGURANÇA: Buscar direto na tabela de alunos
    if (!turma) {
      try {
        const alunoDiretoRes = await query(
          `SELECT turma_id, turma_nome FROM alunos WHERE id = $1 LIMIT 1`,
          [alunoId]
        );
        
        if (alunoDiretoRes.rows.length > 0) {
          const ad = alunoDiretoRes.rows[0];
          let qTurma = null;
          
          if (ad.turma_id && isUuid(String(ad.turma_id))) {
            qTurma = await query(
              `SELECT id as turma_id, nome as turma_nome, data_inicio FROM turmas WHERE id = $1 LIMIT 1`, 
              [ad.turma_id]
            );
          }
          
          if ((!qTurma || qTurma.rows.length === 0) && ad.turma_nome) {
            qTurma = await query(
              `SELECT id as turma_id, nome as turma_nome, data_inicio FROM turmas WHERE nome ILIKE $1 LIMIT 1`, 
              [ad.turma_nome]
            );
          }
          
          if (qTurma && qTurma.rows.length > 0) {
            turma = qTurma.rows[0];
          }
        }
      } catch (dbErr) {
        console.error('[Trilha API] Falha SQL ao buscar turma diretamente do aluno:', dbErr);
      }
    }

    // 3. FALLBACK DE SEGURANÇA MÁXIMO (Nunca retornar 404 vazio se houver cronogramas)
    if (!turma) {
      fallbackUsado = true;
      try {
        const fallbackRes = await query(
          `SELECT t.id as turma_id, t.nome as turma_nome, t.data_inicio
           FROM turmas t
           WHERE EXISTS (SELECT 1 FROM cronograma_atividades c WHERE c.turma_id = t.id)
           ORDER BY t.alunos_count DESC, t.nome ASC LIMIT 1`
        );
        if (fallbackRes.rows.length > 0) {
           turma = fallbackRes.rows[0];
        }
      } catch (dbErr) {
        console.error('[Trilha API] Falha SQL no fallback máximo de turma:', dbErr);
      }
    }

    // Se mesmo com todos os fallbacks não existir NENHUMA turma no sistema
    if (!turma) {
      return NextResponse.json({
        turmaNome: 'Sem Turma',
        futuro: false,
        semanas: [],
        mensagem: 'Nenhuma turma no sistema possui trilhas cadastradas ainda.'
      });
    }

    const turmaId = turma.turma_id;
    const turmaNome = fallbackUsado ? turma.turma_nome + ' (Demonstração)' : turma.turma_nome;
    
    let dataInicioTurma = null;
    try {
      dataInicioTurma = turma.data_inicio ? new Date(turma.data_inicio) : null;
    } catch (e) {
      console.error('[Trilha API] Coluna data_inicio não existe ou é inválida:', e);
    }

    // 4. Buscar cronograma_atividades cruzando com atividades_progresso
    let trilhaRes;
    try {
      trilhaRes = await query(
        `SELECT 
           c.id, c.semana_numero, c.datas_semana, c.ordem, c.tipo, c.disciplina,
           c.bloco, c.titulo, c.xp_total, c.data_liberacao, c.dia_semana, c.subtarefas,
           COALESCE(p.status, 'pendente') as progresso_status,
           COALESCE(p.xp_ganho, 0) as xp_ganho
         FROM cronograma_atividades c
         LEFT JOIN atividades_progresso p ON c.id::text = p.atividade_id AND p.aluno_id = $1
         WHERE c.turma_id = $2
         ORDER BY c.semana_numero ASC, c.ordem ASC`,
        [alunoId, turmaId]
      );
    } catch (dbErr) {
      console.error('[Trilha API] Falha SQL ao buscar o cronograma da turma:', dbErr);
      return NextResponse.json({ error: 'Erro interno ao consultar o cronograma.' }, { status: 500 });
    }

    // 5. Determinar Time-Gating (Turma Futura)
    let turmaFutura = false;
    let dataInicioFormatada = null;
    if (dataInicioTurma) {
      const dtInicio = new Date(dataInicioTurma);
      dtInicio.setHours(0, 0, 0, 0);
      if (hoje < dtInicio) {
        turmaFutura = true;
        dataInicioFormatada = dtInicio.toISOString().split('T')[0];
      }
    }

    if (trilhaRes.rows.length === 0) {
      return NextResponse.json({
        turmaNome,
        futuro: turmaFutura,
        semanas: [],
        dataInicio: dataInicioFormatada,
        mensagem: turmaFutura 
          ? `As aulas da turma ${turmaNome} iniciam em ${dataInicioTurma?.toLocaleDateString('pt-BR')}.`
          : 'O cronograma de atividades ainda não foi cadastrado para esta turma.'
      });
    }

    // 6. Montagem Estruturada do Payload
    const semanasMap = new Map<number, {
      semana: number;
      periodo: string;
      liberada: boolean;
      atividades: any[];
    }>();

    for (const row of trilhaRes.rows) {
      if (!semanasMap.has(row.semana_numero)) {
        let liberada = false;

        if (!turmaFutura) {
          if (row.data_liberacao) {
            const dtLiberacao = new Date(row.data_liberacao);
            dtLiberacao.setHours(0, 0, 0, 0);
            if (hoje >= dtLiberacao) liberada = true;
          } else {
            // Sem data_liberacao explícita: semana 1 sempre liberada se turma já iniciou
            if (row.semana_numero === 1) liberada = true;
          }
        }

        semanasMap.set(row.semana_numero, {
          semana: row.semana_numero,
          periodo: row.datas_semana || `Semana ${row.semana_numero}`,
          liberada,
          atividades: []
        });
      }

      const semanaAtiva = semanasMap.get(row.semana_numero)!;

      let statusFinal: string;
      if (!semanaAtiva.liberada) {
        statusFinal = 'bloqueada';
      } else {
        const ps = row.progresso_status;
        if (ps === 'concluida' || ps === 'concluido') {
          statusFinal = 'concluida';
        } else if (ps === 'em_andamento') {
          statusFinal = 'em_andamento';
        } else {
          statusFinal = 'pendente';
        }
      }

      semanaAtiva.atividades.push({
        id: row.id,
        ordem: row.ordem,
        dia_semana: row.dia_semana,
        tipo: row.tipo,
        disciplina: row.disciplina,
        bloco: row.bloco,
        titulo: row.titulo,
        xp_total: row.xp_total,
        status: statusFinal,
        xp_ganho: row.xp_ganho || 0
      });
    }

    return NextResponse.json({
      turmaNome,
      futuro: turmaFutura,
      dataInicio: dataInicioFormatada,
      semanas: Array.from(semanasMap.values()),
      mensagem: turmaFutura
        ? `As aulas da turma ${turmaNome} iniciam em ${new Date(dataInicioTurma!).toLocaleDateString('pt-BR')}. O cronograma já está preparado!`
        : null
    });

  } catch (error: any) {
    console.error('[Trilha API] Exceção geral capturada:', error);
    return NextResponse.json({ error: 'Falha crítica na rota de trilha' }, { status: 500 });
  }
}
