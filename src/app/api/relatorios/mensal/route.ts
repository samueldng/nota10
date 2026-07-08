import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ─── GET /api/relatorios/mensal ─────────────────────────────────────────────────
// Query params: alunoId (required)
// Business rule: plano 'padrao' → 403, plano 'acompanhamento' | 'elite' → 200

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const alunoId = searchParams.get('alunoId');

    if (!alunoId) {
      return NextResponse.json(
        { error: 'Parâmetro alunoId é obrigatório.' },
        { status: 400 }
      );
    }

    // Buscar plano do aluno diretamente no banco com sua turma ativa
    const alunoRes = await query(
      `SELECT a.id, a.nome, a.plano,
              (SELECT t.nome 
               FROM matriculas m 
               JOIN turmas t ON m.turma_id = t.id 
               WHERE m.aluno_id = a.id AND m.status = 'ativo' 
               LIMIT 1) as turma_nome 
       FROM alunos a 
       WHERE a.id = $1`,
      [alunoId]
    );

    if (alunoRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Aluno não encontrado.' },
        { status: 404 }
      );
    }

    const aluno = alunoRes.rows[0];
    const plano = aluno.plano || 'padrao';

    // ── VALIDAÇÃO DE PLANO (BACKEND) ──
    if (plano === 'padrao') {
      return NextResponse.json(
        {
          blocked: true,
          requiredPlan: 'acompanhamento',
          message: 'Relatório Mensal disponível a partir do Plano Acompanhamento.',
        },
        { status: 403 }
      );
    }

    // Plano acompanhamento ou elite → liberar dados
    // Retornar relatório mensal (dados mock estruturados por enquanto)
    return NextResponse.json({
      blocked: false,
      aluno: {
        id: aluno.id,
        nome: aluno.nome,
        turma: aluno.turma_nome,
        plano,
      },
      periodo: 'Junho 2026',
      geradoEm: '30/06/2026',
      resumo: {
        presencas: 36,
        presencaPercent: 90,
        faltas: 4,
        faltasPercent: 10,
        atrasos: 2,
        atrasosPercent: 5,
        videoaula: 85,
        fixacao: 82,
      },
      destaques: [
        'Evolução contínua na atenção em sala',
        'Alta taxa de completude de atividades',
        'Participação acima da média da turma',
      ],
      pontosAtencao: [
        'Bloco 2 de Matemática precisa de reforço',
        '2 faltas no mês — manter regularidade',
      ],
      parecer: {
        pontosFortes: {
          portugues: [
            'Demonstra grande dedicação nas aulas de Português.',
            'Apresenta excelente compreensão dos conteúdos do Bloco 2.',
            'Participa ativamente das discussões sobre textos.',
          ],
          matematica: [
            'Atenção plena em sala de aula (escala de atento constante).',
            'Entrega as tarefas pontualmente (100% no mês).',
            'Tem facilidade com lógica e cálculo no Bloco 3.',
          ],
        },
        pontosAMelhorar: {
          portugues: [
            'Precisa melhorar a constância na resolução da seção "Praticar".',
            'Demonstrou dificuldade na fixação do Bloco 1 (Interpretação Avançada).',
          ],
          matematica: [
            'Ocasionalmente assiste apenas metade da videoaula antes da classe.',
            'Evita participar oralmente quando o problema é complexo (Bloco 4).',
          ],
        },
        orientacao: [
          'Estabelecer horário fixo em casa para assistir à videoaula completa antes de resolver os blocos matemáticos.',
          'Incentivar a leitura em voz alta para ganhar confiança na participação oral.',
        ],
      },
    });
  } catch (err: any) {
    console.error('Erro no GET /api/relatorios/mensal:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
