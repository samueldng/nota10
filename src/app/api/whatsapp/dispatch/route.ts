import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { alunoId, tipo, mensagem, relatorioId } = body;

    if (!alunoId && !relatorioId) {
      return NextResponse.json(
        { error: 'alunoId ou relatorioId é obrigatório' },
        { status: 400 }
      );
    }

    const targetId = alunoId || relatorioId;

    // Buscar telefone do responsável
    let telefone: string | null = null;
    try {
      const alunoRes = await query(
        `SELECT responsavel1_telefone, nome FROM alunos WHERE id = $1 LIMIT 1`,
        [targetId]
      );

      if (alunoRes.rows.length === 0) {
        return NextResponse.json(
          { error: 'Aluno não encontrado' },
          { status: 404 }
        );
      }

      telefone = alunoRes.rows[0].responsavel1_telefone;
    } catch (dbErr) {
      console.error('[WhatsApp Dispatch] Falha SQL ao buscar aluno:', dbErr);
      return NextResponse.json(
        { error: 'Erro ao consultar dados do aluno' },
        { status: 500 }
      );
    }

    if (!telefone) {
      return NextResponse.json(
        { error: 'Telefone do responsável não cadastrado para este aluno' },
        { status: 400 }
      );
    }

    // Formatar mensagem
    const formattedMessage = mensagem || `Olá! Você tem um novo alerta do tipo: ${tipo || 'geral'}. Acesse o Portal Nota 10 para mais detalhes.`;

    // MVP: Log do dispatch (integração real com WhatsApp Business API será feita na fase de produção)
    console.log(`[WhatsApp Dispatch] ========================================`);
    console.log(`[WhatsApp Dispatch] Destinatário: ${telefone}`);
    console.log(`[WhatsApp Dispatch] Tipo: ${tipo || 'geral'}`);
    console.log(`[WhatsApp Dispatch] Mensagem: ${formattedMessage}`);
    console.log(`[WhatsApp Dispatch] AlunoId: ${targetId}`);
    console.log(`[WhatsApp Dispatch] ========================================`);

    return NextResponse.json({
      success: true,
      message: 'Mensagem despachada com sucesso (MVP — log do servidor)',
      dispatchedTo: telefone,
      tipo: tipo || 'geral',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[WhatsApp Dispatch] Exceção geral:', errorMessage);
    return NextResponse.json(
      { error: 'Erro interno ao despachar mensagem via WhatsApp' },
      { status: 500 }
    );
  }
}
