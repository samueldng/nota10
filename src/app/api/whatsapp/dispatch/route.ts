import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

function cleanPhone(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55')) return digits;
  return `55${digits}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { alunoId, tipo, mensagem, faltas } = body;

    const dispatched: any[] = [];
    const errors: any[] = [];

    // Tratar lote de faltas
    if (tipo === 'falta' && Array.isArray(faltas) && faltas.length > 0) {
      for (const item of faltas) {
        try {
          const res = await query(
            `SELECT nome, responsavel1_nome, responsavel1_telefone FROM alunos WHERE id::text = $1::text`,
            [item.alunoId]
          );

          if (res.rows.length > 0) {
            const row = res.rows[0];
            const phone = cleanPhone(row.responsavel1_telefone);
            const msg = `Olá, ${row.responsavel1_nome || 'Responsável'}! Informamos que o(a) aluno(a) ${row.nome} consta como AUSENTE na aula de ${item.disciplina || 'hoje'} (${item.data}) da turma ${item.turma}. Em caso de dúvidas, entre em contato com a coordenação Nota 10.`;

            if (phone) {
              // Log no banco
              await query(
                `INSERT INTO log_auditoria (data, usuario, acao, detalhe) VALUES (NOW()::text, 'SISTEMA_WHATSAPP', 'DISPARO_FALTA', $1)`,
                [`Para: ${phone} | Aluno: ${row.nome}`]
              );

              dispatched.push({ alunoId: item.alunoId, alunoNome: row.nome, phone, status: 'enviado' });
            }
          }
        } catch (e: any) {
          errors.push({ alunoId: item.alunoId, error: e.message });
        }
      }

      return NextResponse.json({
        success: true,
        tipo: 'falta_lote',
        totalProcessado: faltas.length,
        dispatched,
        errors
      });
    }

    // Caso individual
    if (!alunoId) {
      return NextResponse.json({ error: 'alunoId é obrigatório' }, { status: 400 });
    }

    const alunoRes = await query(
      `SELECT nome, responsavel1_nome, responsavel1_telefone FROM alunos WHERE id::text = $1::text`,
      [alunoId]
    );

    if (alunoRes.rows.length === 0) {
      return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 });
    }

    const aluno = alunoRes.rows[0];
    const phone = cleanPhone(aluno.responsavel1_telefone);

    if (!phone) {
      return NextResponse.json({ error: 'Telefone do responsável não cadastrado' }, { status: 400 });
    }

    const textToSend = mensagem || `Olá ${aluno.responsavel1_nome || ''}! Notificação Nota 10 sobre o aluno ${aluno.nome}.`;

    // Se houver webhook externo configurado (Evolution API / Twilio / Z-API)
    const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
    let externalSuccess = false;

    if (webhookUrl) {
      try {
        const extRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            number: phone,
            message: textToSend,
            type: tipo || 'geral'
          })
        });
        externalSuccess = extRes.ok;
      } catch (err) {
        console.warn('Falha no webhook externo de WhatsApp:', err);
      }
    }

    // Registrar no log de auditoria
    await query(
      `INSERT INTO log_auditoria (data, usuario, acao, detalhe) VALUES (NOW()::text, 'SISTEMA_WHATSAPP', $1, $2)`,
      [`DISPARO_${(tipo || 'GERAL').toUpperCase()}`, `Destino: ${phone} | Aluno: ${aluno.nome}`]
    );

    return NextResponse.json({
      success: true,
      tipo: tipo || 'geral',
      destinatario: phone,
      aluno: aluno.nome,
      mensagem: textToSend,
      webhookEntregue: externalSuccess
    });

  } catch (error: any) {
    console.error('Erro no despacho de WhatsApp:', error);
    return NextResponse.json({ error: 'Erro interno ao despachar WhatsApp' }, { status: 500 });
  }
}
