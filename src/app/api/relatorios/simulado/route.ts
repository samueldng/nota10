import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ─── GET /api/relatorios/simulado ───────────────────────────────────────────────
// Query params: alunoId (required)
// Business rule: plano 'padrao' | 'acompanhamento' → 403, plano 'elite' → 200

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

    // Buscar plano do aluno diretamente no banco
    const alunoRes = await query(
      `SELECT id, nome, plano, turma_nome FROM alunos WHERE id = $1`,
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
    if (plano === 'padrao' || plano === 'acompanhamento') {
      return NextResponse.json(
        {
          blocked: true,
          requiredPlan: 'elite',
          message: 'Relatório de Simulado disponível apenas no Plano Elite.',
        },
        { status: 403 }
      );
    }

    // Plano elite → liberar dados
    // Retornar relatório de simulado (dados mock estruturados por enquanto)
    return NextResponse.json({
      blocked: false,
      aluno: {
        id: aluno.id,
        nome: aluno.nome,
        turma: aluno.turma_nome,
        plano,
      },
      simulados: [
        {
          id: 's1',
          titulo: '1º Simulado Diagnóstico',
          data: '15/04/2026',
          status: 'realizado',
          totalQuestoes: 40,
          acertos: 28,
          aproveitamento: 70,
          temGabarito: true,
          temCorrecaoVideo: true,
          resultadoPorBloco: [
            { bloco: 'Bloco 1', disciplina: 'Português', acertos: 8, total: 10, classificacao: 'muito_bom' },
            { bloco: 'Bloco 2', disciplina: 'Português', acertos: 6, total: 10, classificacao: 'regular' },
            { bloco: 'Bloco 1', disciplina: 'Matemática', acertos: 9, total: 10, classificacao: 'muito_bom' },
            { bloco: 'Bloco 2', disciplina: 'Matemática', acertos: 5, total: 10, classificacao: 'precisa_revisar' },
          ],
        },
        {
          id: 's2',
          titulo: '2º Simulado Preparatório',
          data: '15/08/2026',
          status: 'agendado',
          totalQuestoes: 40,
          acertos: 0,
          aproveitamento: 0,
          temGabarito: false,
          temCorrecaoVideo: false,
          resultadoPorBloco: [],
        },
      ],
    });
  } catch (err: any) {
    console.error('Erro no GET /api/relatorios/simulado:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
