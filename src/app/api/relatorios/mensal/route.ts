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
    // Buscar progresso real para montar estatísticas básicas
    const progRes = await query(
      `SELECT 
         COUNT(*) filter (where tipo_acao = 'videoaula') as qtd_videos,
         COUNT(*) filter (where tipo_acao = 'questoes') as qtd_questoes
       FROM aluno_progresso 
       WHERE aluno_id = $1`,
      [alunoId]
    );
    const prog = progRes.rows[0] || { qtd_videos: 0, qtd_questoes: 0 };

    return NextResponse.json({
      blocked: false,
      aluno: {
        id: aluno.id,
        nome: aluno.nome,
        turma: aluno.turma_nome,
        plano,
      },
      periodo: new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
      geradoEm: new Date().toLocaleDateString('pt-BR'),
      resumo: {
        presencas: 0, // Mock till integrated with presence module
        presencaPercent: 100,
        faltas: 0,
        faltasPercent: 0,
        atrasos: 0,
        atrasosPercent: 0,
        videoaula: parseInt(prog.qtd_videos, 10),
        fixacao: parseInt(prog.qtd_questoes, 10),
      },
      destaques: [
        'Relatório real ativado.',
        `Vídeos concluídos: ${prog.qtd_videos}`,
        `Atividades de fixação: ${prog.qtd_questoes}`,
      ],
      pontosAtencao: [],
      parecer: {
        pontosFortes: { portugues: [], matematica: [] },
        pontosAMelhorar: { portugues: [], matematica: [] },
        orientacao: []
      },
    });
  } catch (err: any) {
    console.error('Erro no GET /api/relatorios/mensal:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
