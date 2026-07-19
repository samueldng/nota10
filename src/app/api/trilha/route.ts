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

  // Se alunoId não é UUID válido, retornar resposta vazia estruturada — ZERO mock data
  if (!isUuid(String(alunoId))) {
    return NextResponse.json({
      semanas: [],
      turmaNome: 'Modo Demonstração',
      futuro: false,
      dataInicio: null,
      mensagem: 'Faça login com uma conta válida para visualizar sua Trilha de Estudos.'
    });
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  try {
    // 1. Tentar encontrar a turma exata do aluno com flexibilidade e fallback
    let turma = null;
    let isFallback = false;

    // A. Tentativa 1: Via tabela matriculas
    const alunoRes = await query(
      `SELECT m.turma_id, t.nome as turma_nome, t.data_inicio
       FROM matriculas m
       JOIN turmas t ON m.turma_id = t.id
       WHERE m.aluno_id = $1 AND m.status = 'ativo' LIMIT 1`,
      [alunoId]
    );

    if (alunoRes.rows.length > 0) {
      turma = alunoRes.rows[0];
    } else {
      // B. Tentativa 2: Buscar direto na tabela de alunos
      const alunoDiretoRes = await query(
        `SELECT turma_id, turma_nome FROM alunos WHERE id = $1 LIMIT 1`,
        [alunoId]
      );
      
      if (alunoDiretoRes.rows.length > 0) {
        const ad = alunoDiretoRes.rows[0];
        let qTurma = null;
        
        // Se turma_id é UUID válido
        if (ad.turma_id && isUuid(String(ad.turma_id))) {
          qTurma = await query(
            `SELECT id as turma_id, nome as turma_nome, data_inicio FROM turmas WHERE id = $1 LIMIT 1`, 
            [ad.turma_id]
          );
        }
        
        // Se UUID falhou e tem turma_nome
        if ((!qTurma || qTurma.rows.length === 0) && ad.turma_nome) {
          qTurma = await query(
            `SELECT id as turma_id, nome as turma_nome, data_inicio FROM turmas WHERE nome ILIKE $1 LIMIT 1`, 
            [ad.turma_nome]
          );
        }
        
        // Fallback extra: pegar primeiro nome da string (ex: "5A")
        if ((!qTurma || qTurma.rows.length === 0) && ad.turma_nome) {
          const primeiroNome = ad.turma_nome.split(' ')[0];
          if (primeiroNome.length > 0) {
            qTurma = await query(
              `SELECT id as turma_id, nome as turma_nome, data_inicio FROM turmas WHERE nome ILIKE $1 LIMIT 1`, 
              [`%${primeiroNome}%`]
            );
          }
        }
        
        if (qTurma && qTurma.rows.length > 0) {
          turma = qTurma.rows[0];
        }
      }
    }

    // C. Fallback Definitivo: Se ainda assim o aluno não tem turma vinculada corretamente,
    // vincular automaticamente à primeira turma disponível que possui cronograma ativo.
    // Assim a API NUNCA retorna vazio indevidamente.
    if (!turma) {
      isFallback = true;
      const fallbackRes = await query(
        `SELECT t.id as turma_id, t.nome as turma_nome, t.data_inicio
         FROM turmas t
         WHERE EXISTS (SELECT 1 FROM cronograma_atividades c WHERE c.turma_id = t.id)
         ORDER BY t.alunos_count DESC, t.nome ASC LIMIT 1`
      );
      if (fallbackRes.rows.length > 0) {
         turma = fallbackRes.rows[0];
      }
    }

    // Se mesmo assim não houver NENHUMA turma com cronograma no sistema
    if (!turma) {
      return NextResponse.json({
        semanas: [],
        turmaNome: 'Sem Turma',
        futuro: false,
        dataInicio: null,
        mensagem: 'Nenhuma turma no sistema possui trilhas cadastradas ainda.'
      });
    }

    const turmaId = turma.turma_id;
    const turmaNome = isFallback ? turma.turma_nome + ' (Demonstração)' : turma.turma_nome;
    
    let dataInicioTurma = null;
    try {
      dataInicioTurma = turma.data_inicio ? new Date(turma.data_inicio) : null;
    } catch (e) {
      // safe cast in case column doesn't exist
    }

    // 2. Buscar TODAS as atividades do cronograma da turma (com progresso do aluno via LEFT JOIN)
    const trilhaRes = await query(
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

    // 3. Se não há atividades cadastradas no cronograma, informar ao front — ZERO mock
    if (trilhaRes.rows.length === 0) {
      // Verificar se a turma inicia no futuro
      if (dataInicioTurma) {
        const dtInicio = new Date(dataInicioTurma);
        dtInicio.setHours(0, 0, 0, 0);
        if (hoje < dtInicio) {
          return NextResponse.json({
            semanas: [],
            turmaNome,
            futuro: true,
            dataInicio: dtInicio.toISOString().split('T')[0],
            mensagem: `As aulas da turma ${turmaNome} iniciam em ${dtInicio.toLocaleDateString('pt-BR')}.`
          });
        }
      }

      return NextResponse.json({
        semanas: [],
        turmaNome,
        futuro: false,
        dataInicio: null,
        mensagem: 'O cronograma de atividades ainda não foi cadastrado para esta turma. Aguarde o lançamento pela coordenação.'
      });
    }

    // 4. Determinar se turma ainda não iniciou (todas as data_liberacao estão no futuro)
    let turmaFutura = false;
    if (dataInicioTurma) {
      const dtInicio = new Date(dataInicioTurma);
      dtInicio.setHours(0, 0, 0, 0);
      if (hoje < dtInicio) {
        turmaFutura = true;
      }
    }

    // 5. Montar resposta estruturada por semana — SEM mock data
    const semanasMap = new Map<number, {
      semana_numero: number;
      datas_semana: string;
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
        // Se turmaFutura === true, todas as semanas ficam liberada = false

        semanasMap.set(row.semana_numero, {
          semana_numero: row.semana_numero,
          datas_semana: row.datas_semana || `Semana ${row.semana_numero}`,
          liberada,
          atividades: []
        });
      }

      const semana = semanasMap.get(row.semana_numero)!;

      // Status final: se a semana não está liberada, forçar 'bloqueada'
      let statusFinal: string;
      if (!semana.liberada) {
        statusFinal = 'bloqueada';
      } else {
        // Mapear status do progresso para status de exibição
        const ps = row.progresso_status;
        if (ps === 'concluida' || ps === 'concluido') {
          statusFinal = 'concluida';
        } else if (ps === 'em_andamento') {
          statusFinal = 'em_andamento';
        } else {
          statusFinal = 'pendente'; // disponível para fazer
        }
      }

      semana.atividades.push({
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

    // 6. Calcular a menor data_liberacao para informar ao front quando a turma começa
    let dataInicioFormatada: string | null = null;
    if (turmaFutura && dataInicioTurma) {
      const dt = new Date(dataInicioTurma);
      dt.setHours(0, 0, 0, 0);
      dataInicioFormatada = dt.toISOString().split('T')[0];
    }

    return NextResponse.json({
      semanas: Array.from(semanasMap.values()),
      turmaNome,
      futuro: turmaFutura,
      dataInicio: dataInicioFormatada,
      mensagem: turmaFutura
        ? `As aulas da turma ${turmaNome} iniciam em ${new Date(dataInicioTurma!).toLocaleDateString('pt-BR')}. O cronograma já está preparado!`
        : null
    });
  } catch (error: any) {
    console.error('[Trilha API] Erro ao buscar trilha:', error);
    return NextResponse.json({ error: 'Erro interno na trilha' }, { status: 500 });
  }
}
