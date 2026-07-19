import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MOCK_TO_NAME_MAP: Record<string, string> = {
  'T001': '5A Manhã',
  'T002': '5B Tarde',
  'T003': '5C Manhã',
  'T004': '4A Manhã',
  'T005': '4B Tarde',
  'T006': 'Reforço Geral',
  'T007': '5A Manhã 2025',
};

const NAME_TO_MOCK_MAP: Record<string, string> = Object.entries(MOCK_TO_NAME_MAP).reduce((acc, [k, v]) => {
  acc[v.toLowerCase().trim()] = k;
  return acc;
}, {} as Record<string, string>);

function isUuid(str: string): boolean {
  return UUID_REGEX.test(str);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawAlunoId = searchParams.get('alunoId');
  
  if (!rawAlunoId) {
    return NextResponse.json({ error: 'alunoId é obrigatório' }, { status: 400 });
  }

  const alunoIdInput = String(rawAlunoId).trim();
  console.log(`[Trilha API] Requisição GET recebida com searchParam alunoId: "${alunoIdInput}"`);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // 1. Identificar o aluno real diretamente no banco (por UUID, ID numérico ou número de matrícula)
  let alunoIdReal = alunoIdInput;
  try {
    const checkAluno = await query(
      `SELECT id, nome, numero FROM alunos WHERE id::text = $1 OR numero::text = $1 LIMIT 1`,
      [alunoIdInput]
    );
    if (checkAluno.rows.length > 0) {
      alunoIdReal = checkAluno.rows[0].id;
      console.log(`[Trilha API] Aluno localizado na tabela alunos: ${checkAluno.rows[0].nome} (id real: ${alunoIdReal}, numero: ${checkAluno.rows[0].numero})`);
    } else if (!isUuid(alunoIdInput)) {
      console.log(`[Trilha API] Aluno "${alunoIdInput}" não encontrado em alunos e não é UUID. Retornando Modo Demonstração.`);
      return NextResponse.json({
        turmaNome: 'Modo Demonstração',
        futuro: false,
        semanas: []
      });
    }
  } catch (err: any) {
    console.error('[Trilha API] Falha SQL ao verificar existência na tabela alunos:', err.message);
    throw err;
  }

  let turma = null;
  let fallbackUsado = false;

  // 2. EXTRAÇÃO DIRETA (Sem confiar na sessão): Buscar na tabela matriculas com base no aluno_id
  try {
    const alunoRes = await query(
      `SELECT m.turma_id::text as turma_id, t.nome as turma_nome, t.data_inicio
       FROM matriculas m
       LEFT JOIN turmas t ON m.turma_id::text = t.id::text OR m.turma_id::text = t.nome
       WHERE (m.aluno_id::text = $1 OR m.aluno_id::text IN (SELECT id::text FROM alunos WHERE numero::text = $1))
       ORDER BY 
         CASE WHEN m.status ILIKE 'ativ%' THEN 0 ELSE 1 END,
         m.created_at DESC
       LIMIT 1`,
      [alunoIdReal]
    );
    if (alunoRes.rows.length > 0) {
      turma = alunoRes.rows[0];
      console.log(`[Trilha API] Turma resolvida via tabela matriculas (aluno ${alunoIdReal}): ${turma.turma_nome || turma.turma_id} (${turma.turma_id})`);
    }
  } catch (dbErr: any) {
    console.error('[Trilha API] Falha SQL ao buscar na tabela matriculas:', dbErr.message);
    throw dbErr;
  }

  // 3. FALLBACK DE SEGURANÇA: Buscar direto por turmas se não houver matrícula formal
  if (!turma) {
    try {
      const matQualquer = await query(
        `SELECT m.turma_id::text as turma_id, t.nome as turma_nome, t.data_inicio
         FROM matriculas m
         LEFT JOIN turmas t ON m.turma_id::text = t.id::text
         WHERE m.aluno_id::text = $1
         LIMIT 1`,
        [alunoIdReal]
      );
      if (matQualquer.rows.length > 0) {
        turma = matQualquer.rows[0];
        console.log(`[Trilha API] Turma resolvida via matrícula fallback: ${turma.turma_nome} (${turma.turma_id})`);
      }
    } catch (dbErr: any) {
      console.error('[Trilha API] Falha SQL no fallback de matrícula:', dbErr.message);
      throw dbErr;
    }
  }

  // 4. FALLBACK MÁXIMO (Apenas para garantir que modo demo veja atividades caso não tenha matrícula)
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
        console.log(`[Trilha API] Fallback máximo utilizado para aluno sem matrícula: ${turma.turma_nome} (${turma.turma_id})`);
      }
    } catch (dbErr: any) {
      console.error('[Trilha API] Falha SQL no fallback de turmas:', dbErr.message);
      throw dbErr;
    }
  }

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
  const turmaNome = fallbackUsado ? (turma.turma_nome || turma.turma_id) + ' (Demonstração)' : (turma.turma_nome || turma.turma_id);
  
  let dataInicioTurma = null;
  try {
    dataInicioTurma = turma.data_inicio ? new Date(turma.data_inicio) : null;
  } catch (e: any) {
    console.error('[Trilha API] Erro ao interpretar data_inicio da turma:', e.message);
  }

  // --- DIAGNÓSTICO DO BANCO DE DADOS (LOG RAW NO TERMINAL DA VPS) ---
  try {
    const diagCount = await query(`SELECT COUNT(*) as total FROM cronograma_atividades`);
    const diagSamples = await query(`SELECT id, turma_id, semana_numero, titulo FROM cronograma_atividades LIMIT 5`);
    console.log(`\n=================== [Trilha API AUDITORIA RAW] ===================`);
    console.log(`[Trilha API DIAG] Total de registros na tabela cronograma_atividades: ${diagCount.rows[0]?.total || 0}`);
    console.log(`[Trilha API DIAG] Amostra de 5 registros gravados pelo painel:`, JSON.stringify(diagSamples.rows, null, 2));
    console.log(`===================================================================\n`);
  } catch (diagErr: any) {
    console.error('[Trilha API DIAG] Erro ao consultar diagnóstico de cronograma_atividades:', diagErr.message);
  }

  // 5. Montar lista abrangente de candidatos para a coluna turma_id na tabela cronograma_atividades
  const candidatosSet = new Set<string>();
  if (turmaId) candidatosSet.add(String(turmaId).trim());
  if (turma.turma_nome) {
    const nomeLimpo = String(turma.turma_nome).trim();
    candidatosSet.add(nomeLimpo);
    const mockCodigo = NAME_TO_MOCK_MAP[nomeLimpo.toLowerCase()];
    if (mockCodigo) candidatosSet.add(mockCodigo);
  }
  if (turmaId && MOCK_TO_NAME_MAP[String(turmaId)]) {
    candidatosSet.add(MOCK_TO_NAME_MAP[String(turmaId)]);
  }

  const listaCandidatos = Array.from(candidatosSet);
  console.log(`[Trilha API] Candidatos para turma_id ($2) na busca de cronograma:`, listaCandidatos);

  // 6. Executar SELECT na tabela cronograma_atividades (e log raw com parâmetros)
  let trilhaRes;
  const sqlCronograma = `
    SELECT 
      c.id, c.semana_numero, c.datas_semana, c.ordem, c.tipo, c.disciplina,
      c.bloco, c.titulo, c.xp_total, c.data_liberacao, c.dia_semana, c.subtarefas,
      COALESCE(p.status, 'pendente') as progresso_status,
      COALESCE(p.xp_ganho, 0) as xp_ganho
    FROM cronograma_atividades c
    LEFT JOIN atividades_progresso p ON c.id::text = p.atividade_id AND p.aluno_id::text = $1::text
    WHERE (
      c.turma_id::text = ANY($2::text[])
      OR c.turma_id::text IN (
        SELECT id::text FROM turmas WHERE id::text = ANY($2::text[]) OR nome::text = ANY($2::text[])
      )
      OR c.turma_id::text IN (
        SELECT t.id::text FROM turmas t 
        JOIN matriculas m ON m.turma_id::text = t.id::text OR m.turma_id::text = t.nome 
        WHERE m.aluno_id::text = $1::text OR m.aluno_id::text IN (SELECT id::text FROM alunos WHERE numero::text = $1::text)
      )
      OR c.turma_id::text IN (
        SELECT m.turma_id::text FROM matriculas m 
        WHERE m.aluno_id::text = $1::text OR m.aluno_id::text IN (SELECT id::text FROM alunos WHERE numero::text = $1::text)
      )
    )
    ORDER BY c.semana_numero ASC, c.ordem ASC
  `;

  console.log(`[Trilha API] STRING SQL FINAL EXECUTADA:\n${sqlCronograma}`);
  console.log(`[Trilha API] PARÂMETROS DA QUERY ($1, $2):`, JSON.stringify([alunoIdReal, listaCandidatos], null, 2));

  try {
    trilhaRes = await query(sqlCronograma, [alunoIdReal, listaCandidatos]);
    console.log(`[Trilha API] Consulta principal ao cronograma retornou ${trilhaRes.rows.length} atividade(s) para o aluno "${alunoIdReal}".`);
  } catch (dbErr: any) {
    console.error('[Trilha API] Falha SQL na consulta de cronograma_atividades:', dbErr.message);
    throw dbErr;
  }

  // 7. Determinar Time-Gating (Turma Futura)
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
    console.warn(`[Trilha API WARNING] 0 atividades encontradas para a turma ${turmaNome} (candidatos: ${listaCandidatos.join(', ')}).`);
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

  // 8. Montagem Estruturada do Payload final em conformidade com o contrato JSON
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
  console.log(`[Trilha API] Payload final montado com sucesso: ${semanasArray.length} semana(s) e ${trilhaRes.rows.length} atividade(s) para "${turmaNome}".`);

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
