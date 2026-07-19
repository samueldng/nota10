import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const alunoId = searchParams.get('alunoId');

    if (!alunoId) {
      return NextResponse.json({ error: 'alunoId obrigatório' }, { status: 400 });
    }

    if (!isUuid(String(alunoId))) {
      return NextResponse.json({
        alunoId,
        nomeAluno: 'Modo Demonstração',
        elite: false,
        eliteLocked: true,
        mesReferencia: getMesReferenciaAtual(),
        indicadores: { assiduidadeAulas: 0, mediaSimulados: 0, frequenciaPresencial: 0, posicaoRanking: 'N/A' },
        parecerPedagogico: 'Faça login com uma conta válida para visualizar seu parecer pedagógico.',
        aproveitamentoPorModulo: [],
        dataGeracao: new Date().toISOString()
      });
    }

    // 1. Buscar dados do aluno
    const alunoRes = await query(
      `SELECT a.id, a.nome, a.plano, COALESCE(a.elite, false) as elite, a.xp_total,
              m.turma_id, t.nome as turma_nome
       FROM alunos a
       LEFT JOIN matriculas m ON m.aluno_id = a.id AND m.status = 'ativo'
       LEFT JOIN turmas t ON t.id = m.turma_id
       WHERE a.id = $1`,
      [alunoId]
    );

    if (alunoRes.rows.length === 0) {
      return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 });
    }

    const aluno = alunoRes.rows[0];
    const nomeAluno = aluno.nome || 'Aluno';
    const elite = aluno.elite || aluno.plano === 'elite';
    const turmaId = aluno.turma_id;
    const xpAluno = Number(aluno.xp_total) || 0;

    // 2. Calcular posição no ranking da turma (baseado em xp_total real)
    let posicaoRanking = 'N/A';
    if (turmaId) {
      const rankRes = await query(
        `SELECT COUNT(*) + 1 as posicao
         FROM alunos a2
         JOIN matriculas m2 ON m2.aluno_id = a2.id AND m2.status = 'ativo'
         WHERE m2.turma_id = $1 AND a2.xp_total > $2 AND a2.id != $3`,
        [turmaId, xpAluno, alunoId]
      );
      const totalRes = await query(
        `SELECT COUNT(*) as total
         FROM matriculas WHERE turma_id = $1 AND status = 'ativo'`,
        [turmaId]
      );
      const posicao = rankRes.rows[0]?.posicao || 1;
      const total = totalRes.rows[0]?.total || 1;
      posicaoRanking = `${posicao}º lugar de ${total} alunos`;
    }

    // 3. Calcular KPIs reais baseados nas atividades do cronograma
    let assiduidadeAulas = 0;
    let mediaSimulados = 0;
    let frequenciaPresencial = 0;

    if (turmaId) {
      // Total de atividades no cronograma desta turma
      const totalAtivRes = await query(
        `SELECT 
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE tipo = 'presencial') as total_presencial,
           COUNT(*) FILTER (WHERE tipo = 'simulado') as total_simulado,
           COUNT(*) FILTER (WHERE tipo IN ('videoaula', 'revisao', 'fixacao')) as total_aulas
         FROM cronograma_atividades WHERE turma_id = $1`,
        [turmaId]
      );

      // Atividades concluídas pelo aluno
      const concluidasRes = await query(
        `SELECT 
           COUNT(*) as total_concluidas,
           COUNT(*) FILTER (WHERE c.tipo = 'presencial') as concluidas_presencial,
           COUNT(*) FILTER (WHERE c.tipo = 'simulado') as concluidas_simulado,
           COUNT(*) FILTER (WHERE c.tipo IN ('videoaula', 'revisao', 'fixacao')) as concluidas_aulas,
           COALESCE(AVG(p.xp_ganho) FILTER (WHERE c.tipo = 'simulado'), 0) as media_xp_simulado
         FROM atividades_progresso p
         JOIN cronograma_atividades c ON c.id::text = p.atividade_id
         WHERE p.aluno_id = $1 AND c.turma_id = $2 AND (p.status = 'concluida' OR p.status = 'concluido')`,
        [alunoId, turmaId]
      );

      const totais = totalAtivRes.rows[0] || {};
      const concluidas = concluidasRes.rows[0] || {};

      // Assiduidade = % de aulas digitais concluídas (videoaula + revisão + fixação)
      const totalAulas = Number(totais.total_aulas) || 0;
      const concluidasAulas = Number(concluidas.concluidas_aulas) || 0;
      assiduidadeAulas = totalAulas > 0 ? Math.round((concluidasAulas / totalAulas) * 1000) / 10 : 0;

      // Frequência Presencial = % de aulas presenciais concluídas
      const totalPresencial = Number(totais.total_presencial) || 0;
      const concluidasPresencial = Number(concluidas.concluidas_presencial) || 0;
      frequenciaPresencial = totalPresencial > 0 ? Math.round((concluidasPresencial / totalPresencial) * 1000) / 10 : 0;

      // Média Simulados = média de XP obtido em simulados (escala de 0-100 proporcional ao xp_total do simulado)
      const totalSimulado = Number(totais.total_simulado) || 0;
      const concluidasSimulado = Number(concluidas.concluidas_simulado) || 0;
      if (totalSimulado > 0 && concluidasSimulado > 0) {
        const mediaXpSimulado = Number(concluidas.media_xp_simulado) || 0;
        // XP máximo de simulado é 50, normalizar para escala 0-100
        mediaSimulados = Math.round(Math.min(100, (mediaXpSimulado / 50) * 100) * 10) / 10;
      }
    }

    // 4. Calcular aproveitamento por módulo (dados reais para os gráficos)
    const aproveitamentoPorModulo: { label: string; value: string; pct: number; color: string }[] = [];

    if (turmaId) {
      const moduloRes = await query(
        `SELECT 
           c.tipo,
           COUNT(*) as total,
           COUNT(p.id) FILTER (WHERE p.status IN ('concluida', 'concluido')) as concluidas
         FROM cronograma_atividades c
         LEFT JOIN atividades_progresso p ON c.id::text = p.atividade_id AND p.aluno_id = $1
         WHERE c.turma_id = $2
         GROUP BY c.tipo
         ORDER BY c.tipo`,
        [alunoId, turmaId]
      );

      const tipoConfig: Record<string, { label: string; color: string }> = {
        'videoaula': { label: 'Videoaulas Assistidas', color: '#8B5CF6' },
        'revisao': { label: 'Revisões Corujinha', color: '#22C55E' },
        'fixacao': { label: 'Fixação (Apostila)', color: '#3B82F6' },
        'simulado': { label: 'Simulados Sábado', color: '#F59E0B' },
        'presencial': { label: 'Presença em Aulas', color: '#EF4444' }
      };

      for (const row of moduloRes.rows) {
        const config = tipoConfig[row.tipo];
        if (!config) continue; // Tipo desconhecido, ignorar
        const total = Number(row.total) || 0;
        const concluidas = Number(row.concluidas) || 0;
        const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0;

        aproveitamentoPorModulo.push({
          label: config.label,
          value: `${concluidas}/${total}`,
          pct,
          color: config.color
        });
      }
    }

    // 5. Gerar parecer pedagógico humanizado com dicionário de frases padronizado
    const parecer = gerarParecerPedagogico(nomeAluno, assiduidadeAulas, mediaSimulados, frequenciaPresencial);

    // 6. Mês de referência dinâmico
    const mesReferencia = getMesReferenciaAtual();

    return NextResponse.json({
      alunoId,
      nomeAluno,
      elite,
      eliteLocked: !elite,
      mesReferencia,
      indicadores: {
        assiduidadeAulas,
        mediaSimulados,
        frequenciaPresencial,
        posicaoRanking
      },
      parecerPedagogico: parecer,
      aproveitamentoPorModulo,
      dataGeracao: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Relatório Mensal] Erro ao gerar relatório:', error);
    return NextResponse.json({ error: 'Erro interno ao consultar relatório' }, { status: 500 });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getMesReferenciaAtual(): string {
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const agora = new Date();
  return `${meses[agora.getMonth()]} ${agora.getFullYear()}`;
}

function gerarParecerPedagogico(
  nome: string,
  assiduidade: number,
  mediaSimulados: number,
  frequencia: number
): string {
  // Dicionário de frases padronizadas conforme regras pedagógicas do Nota10
  if (assiduidade === 0 && mediaSimulados === 0 && frequencia === 0) {
    return `O(A) aluno(a) ${nome} ainda não possui atividades concluídas no sistema. Recomendamos que inicie a Trilha de Estudos e participe das revisões gamificadas para acumular XP e desbloquear os módulos seguintes.`;
  }

  if (mediaSimulados >= 80 && assiduidade >= 85) {
    return `O(A) aluno(a) ${nome} apresentou excelente desempenho nas atividades propostas, com assiduidade de ${assiduidade}% nas aulas digitais e frequência de ${frequencia}% nos encontros presenciais. A média nos simulados (${mediaSimulados} pontos) demonstra solidez conceitual. Recomendamos intensificar a resolução de questões de nível avançado no Cofre das Questões e manter o ritmo exemplar nos simulados semanais.`;
  }

  if (mediaSimulados < 50 || assiduidade < 60) {
    return `Notamos a necessidade de um acompanhamento mais próximo para o(a) aluno(a) ${nome}. A assiduidade atual de ${assiduidade}% nas videoaulas e exercícios indica irregularidade na rotina de estudos. A média nos simulados (${mediaSimulados} pontos) sugere dificuldade na interpretação de questões e na fixação dos conteúdos. É fundamental participar das monitorias de reforço, realizar as revisões gamificadas (Corujinha) e manter pontualidade nas entregas da Trilha Semanal.`;
  }

  if (assiduidade >= 75 && mediaSimulados >= 65) {
    return `O(A) aluno(a) ${nome} apresenta um ritmo consistente de estudos com bom aproveitamento nas avaliações parciais (média de ${mediaSimulados} pontos em simulados). A assiduidade de ${assiduidade}% e frequência presencial de ${frequencia}% demonstram disciplina. A continuidade da rotina na Trilha Semanal e a realização das revisões gamificadas (Corujinha) são fundamentais para alcançar e superar a nota de corte almejada.`;
  }

  // Desempenho intermediário
  return `O(A) aluno(a) ${nome} apresenta desempenho intermediário, com assiduidade de ${assiduidade}% e média de ${mediaSimulados} pontos nos simulados. A frequência presencial foi de ${frequencia}%. Recomendamos maior regularidade na conclusão das atividades da Trilha Semanal e atenção especial às revisões de conteúdo para melhorar o aproveitamento geral.`;
}
