import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawAlunoId = searchParams.get('alunoId');
  
  if (!rawAlunoId) {
    return NextResponse.json({ error: 'alunoId é obrigatório' }, { status: 400 });
  }

  const alunoIdInput = String(rawAlunoId).trim();
  console.log(`[Trilha API] Requisição recebida para alunoIdInput: "${alunoIdInput}"`);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // 1. Identificar o aluno real (seja por UUID, ID numérico ou número de matrícula)
  let alunoIdReal = alunoIdInput;
  try {
    const checkAluno = await query(
      `SELECT id, nome, numero FROM alunos WHERE id::text = $1 OR numero::text = $1 LIMIT 1`,
      [alunoIdInput]
    );
    if (checkAluno.rows.length > 0) {
      alunoIdReal = checkAluno.rows[0].id;
      console.log(`[Trilha API] Aluno localizado no BD: ${checkAluno.rows[0].nome} (ID real: ${alunoIdReal})`);
    } else if (!isUuid(alunoIdInput)) {
      console.log(`[Trilha API] Aluno "${alunoIdInput}" não é UUID e não foi encontrado no BD. Retornando Modo Demonstração.`);
      return NextResponse.json({
        turmaNome: 'Modo Demonstração',
        futuro: false,
        semanas: []
      });
    }
  } catch (err: any) {
    console.error('[Trilha API] Falha SQL ao verificar existência de aluno:', err.message);
    // Não abafa o erro SQL com catch silencioso retornando vazio; repassa para estourar o log claro no console da VPS
    throw err;
  }

  let turma = null;
  let fallbackUsado = false;

  // 2. OBRIGATÓRIO: Buscar a turma ativa na tabela matriculas usando um JOIN explícito e casting de texto
  try {
    const alunoRes = await query(
      `SELECT m.turma_id::text as turma_id, t.nome as turma_nome, t.data_inicio
       FROM matriculas m
       JOIN turmas t ON m.turma_id::text = t.id::text
       WHERE m.aluno_id::text = $1 AND (m.status ILIKE 'ativ%' OR m.status IS NULL OR m.status = '')
       ORDER BY m.created_at DESC
       LIMIT 1`,
      [alunoIdReal]
    );
    if (alunoRes.rows.length > 0) {
      turma = alunoRes.rows[0];
      console.log(`[Trilha API] Turma resolvida via matriculas: ${turma.turma_nome} (${turma.turma_id})`);
    }
  } catch (dbErr: any) {
    console.error('[Trilha API] Falha SQL ao buscar matrícula:', dbErr.message);
    throw dbErr;
  }

  // 3. FALLBACK DE SEGURANÇA: Buscar na tabela alunos (e cruzar por id ou nome com turmas)
  if (!turma) {
    try {
      const alunoDiretoRes = await query(
        `SELECT id FROM alunos WHERE id::text = $1 LIMIT 1`,
        [alunoIdReal]
      );
      
      if (alunoDiretoRes.rows.length > 0) {
        // Tenta buscar se existe qualquer matrícula (mesmo sem status ativo)
        const matQualquer = await query(
          `SELECT m.turma_id::text as turma_id, t.nome as turma_nome, t.data_inicio
           FROM matriculas m
           JOIN turmas t ON m.turma_id::text = t.id::text
           WHERE m.aluno_id::text = $1
           ORDER BY m.created_at DESC
           LIMIT 1`,
          [alunoIdReal]
        );
        if (matQualquer.rows.length > 0) {
          turma = matQualquer.rows[0];
          console.log(`[Trilha API] Turma resolvida via matrícula flexível: ${turma.turma_nome} (${turma.turma_id})`);
        }
      }
    } catch (dbErr: any) {
      console.error('[Trilha API] Falha SQL no fallback de busca em alunos:', dbErr.message);
      throw dbErr;
    }
  }

  // 4. FALLBACK DE SEGURANÇA MÁXIMO (Se nenhuma turma estiver vinculada ao aluno, mas existirem cronogramas no colégio)
  if (!turma) {
    fallbackUsado = true;
    try {
      const fallbackRes = await query(
        `SELECT t.id::text as turma_id, t.nome as turma_nome, t.data_inicio
         FROM turmas t
         WHERE EXISTS (SELECT 1 FROM cronograma_atividades c WHERE c.turma_id::text = t.id::text OR c.turma_id::text ILIKE t.nome)
         ORDER BY t.alunos_count DESC, t.nome ASC LIMIT 1`
      );
      if (fallbackRes.rows.length > 0) {
        turma = fallbackRes.rows[0];
        console.log(`[Trilha API] Fallback máximo utilizado. Turma demonstrativa escolhida: ${turma.turma_nome} (${turma.turma_id})`);
      }
    } catch (dbErr: any) {
      console.error('[Trilha API] Falha SQL no fallback máximo de turma:', dbErr.message);
      throw dbErr;
    }
  }

  // Se mesmo com todos os fallbacks não existir NENHUMA turma no sistema
  if (!turma) {
    console.warn('[Trilha API] Nenhuma turma foi encontrada no sistema.');
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
  } catch (e: any) {
    console.error('[Trilha API] Erro ao interpretar data_inicio da turma:', e.message);
  }

  // 5. Buscar cronograma_atividades cruzando flexivelmente com turma_id (UUID ou Nome) e atividades_progresso
  let trilhaRes;
  try {
    const sqlCronograma = `
      SELECT 
        c.id, c.semana_numero, c.datas_semana, c.ordem, c.tipo, c.disciplina,
        c.bloco, c.titulo, c.xp_total, c.data_liberacao, c.dia_semana, c.subtarefas,
        COALESCE(p.status, 'pendente') as progresso_status,
        COALESCE(p.xp_ganho, 0) as xp_ganho
      FROM cronograma_atividades c
      LEFT JOIN atividades_progresso p ON c.id::text = p.atividade_id AND p.aluno_id::text = $1::text
      WHERE (
        c.turma_id::text = $2::text 
        OR c.turma_id::text ILIKE $3::text 
        OR c.turma_id::text IN (
          SELECT id::text FROM turmas WHERE id::text = $2::text OR nome ILIKE $3::text
        )
      )
      ORDER BY c.semana_numero ASC, c.ordem ASC
    `;
    trilhaRes = await query(sqlCronograma, [alunoIdReal, turmaId, turma.turma_nome]);
    console.log(`[Trilha API] Consulta ao cronograma retornou ${trilhaRes.rows.length} atividades para a turma "${turma.turma_nome}".`);
  } catch (dbErr: any) {
    console.error('[Trilha API] Falha SQL ao buscar o cronograma da turma:', dbErr.message);
    // Repassa o erro original para o terminal/log da VPS para expor qualquer divergência de schema/colunas
    throw dbErr;
  }

  // 6. Determinar Time-Gating (Turma Futura)
  let turmaFutura = false;
  let dataInicioFormatada = null;
  if (dataInicioTurma && !isNaN(dataInicioTurma.getTime())) {
    const dtInicio = new Date(dataInicioTurma);
    dtInicio.setHours(0, 0, 0, 0);
    if (hoje < dtInicio) {
      turmaFutura = true;
      dataInicioFormatada = dtInicio.toISOString().split('T')[0];
    }
  }

  if (trilhaRes.rows.length === 0) {
    console.warn(`[Trilha API] 0 atividades encontradas para a turma ${turmaNome} (${turmaId}).`);
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

  // 7. Montagem Estruturada do Payload final em conformidade com o contrato JSON
  const semanasMap = new Map<number, {
    semana: number;
    periodo: string;
    liberada: boolean;
    atividades: any[];
  }>();

  for (const row of trilhaRes.rows) {
    const semNum = Number(row.semana_numero) || 1;
    if (!semanasMap.has(semNum)) {
      let liberada = false;

      if (!turmaFutura) {
        if (row.data_liberacao) {
          const dtLiberacao = new Date(row.data_liberacao);
          dtLiberacao.setHours(0, 0, 0, 0);
          if (!isNaN(dtLiberacao.getTime()) && hoje >= dtLiberacao) liberada = true;
        } else {
          // Sem data_liberacao explícita: semana 1 sempre liberada se a turma já iniciou
          if (semNum === 1) liberada = true;
        }
      }

      semanasMap.set(semNum, {
        semana: semNum,
        periodo: row.datas_semana || `Semana ${semNum}`,
        liberada,
        atividades: []
      });
    }

    const semanaAtiva = semanasMap.get(semNum)!;

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

    let subtarefasParsed = [];
    try {
      if (typeof row.subtarefas === 'string') {
        subtarefasParsed = JSON.parse(row.subtarefas);
      } else if (Array.isArray(row.subtarefas)) {
        subtarefasParsed = row.subtarefas;
      }
    } catch (e) {
      subtarefasParsed = [];
    }

    semanaAtiva.atividades.push({
      id: row.id,
      ordem: row.ordem,
      dia_semana: row.dia_semana || null,
      tipo: row.tipo,
      disciplina: row.disciplina || null,
      bloco: row.bloco || null,
      titulo: row.titulo,
      xp_total: Number(row.xp_total) || 0,
      subtarefas: subtarefasParsed,
      status: statusFinal,
      xp_ganho: Number(row.xp_ganho) || 0
    });
  }

  const semanasArray = Array.from(semanasMap.values());
  console.log(`[Trilha API] Payload montado com sucesso: ${semanasArray.length} semana(s) para "${turmaNome}".`);

  return NextResponse.json({
    turmaNome,
    futuro: turmaFutura,
    dataInicio: dataInicioFormatada,
    semanas: semanasArray,
    mensagem: turmaFutura
      ? `As aulas da turma ${turmaNome} iniciam em ${new Date(dataInicioTurma!).toLocaleDateString('pt-BR')}. O cronograma já está preparado!`
      : null
  });
}
