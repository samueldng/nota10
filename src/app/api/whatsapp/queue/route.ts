import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';

export const dynamic = 'force-dynamic';

function cleanPhone(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55')) return digits;
  return `55${digits}`;
}

/**
 * POST /api/whatsapp/queue
 * 
 * Enfileira mensagens WhatsApp para envio em background.
 * 
 * Body (cronograma/comunicado):
 *   { tipo: 'cronograma', turmaIds: string[], mensagem: string, anexoId?: string }
 * 
 * Body (boleto — individual):
 *   { tipo: 'boleto', items: [{ alunoId, linkBoleto, mensagem? }] }
 */
export async function POST(request: Request) {
  const client = await getClient();

  try {
    const body = await request.json();
    const { tipo } = body;

    if (!tipo) {
      client.release();
      return NextResponse.json({ error: 'Campo "tipo" é obrigatório.' }, { status: 400 });
    }

    await client.query('BEGIN');

    let enfileirados = 0;
    const errors: any[] = [];

    if (tipo === 'boleto' && Array.isArray(body.items)) {
      // Boleto: per-student dispatch
      for (const item of body.items) {
        try {
          const alunoRes = await client.query(
            `SELECT nome, responsavel1_nome, responsavel1_telefone FROM alunos WHERE id::text = $1::text`,
            [item.alunoId]
          );

          if (alunoRes.rows.length === 0) {
            errors.push({ alunoId: item.alunoId, error: 'Aluno não encontrado' });
            continue;
          }

          const aluno = alunoRes.rows[0];
          const phone = cleanPhone(aluno.responsavel1_telefone);

          if (!phone) {
            errors.push({ alunoId: item.alunoId, error: 'Telefone não cadastrado' });
            continue;
          }

          const msg = item.mensagem ||
            `Olá, ${aluno.responsavel1_nome || 'Responsável'}! Segue o boleto referente ao aluno(a) ${aluno.nome}. Acesse: ${item.linkBoleto || '(link não disponível)'}. Em caso de dúvidas, entre em contato com a coordenação Nota 10.`;

          await client.query(
            `INSERT INTO whatsapp_fila (telefone, mensagem, link_anexo, tipo, aluno_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [phone, msg, item.linkBoleto || null, 'boleto', item.alunoId]
          );

          enfileirados++;
        } catch (e: any) {
          errors.push({ alunoId: item.alunoId, error: e.message });
        }
      }
    } else {
      // Cronograma / Comunicado: batch by turma
      const { turmaIds, mensagem, anexoId } = body;

      if (!turmaIds || !Array.isArray(turmaIds) || turmaIds.length === 0) {
        await client.query('ROLLBACK');
        client.release();
        return NextResponse.json({ error: 'turmaIds é obrigatório para tipo cronograma/comunicado.' }, { status: 400 });
      }

      if (!mensagem) {
        await client.query('ROLLBACK');
        client.release();
        return NextResponse.json({ error: 'Mensagem é obrigatória.' }, { status: 400 });
      }

      // Build link for the attachment
      let linkAnexo: string | null = null;
      if (anexoId) {
        // Generate a download link using the app's own API
        linkAnexo = `/api/anexos?id=${anexoId}&download=true`;
      }

      // Get all students from the specified turmas via matriculas
      for (const turmaId of turmaIds) {
        const alunosRes = await client.query(
          `SELECT a.id, a.nome, a.responsavel1_nome, a.responsavel1_telefone
           FROM alunos a
           JOIN matriculas m ON a.id = m.aluno_id
           WHERE m.turma_id::text = $1::text AND m.status = 'ativo'`,
          [turmaId]
        );

        for (const aluno of alunosRes.rows) {
          const phone = cleanPhone(aluno.responsavel1_telefone);

          if (!phone) {
            errors.push({ alunoId: aluno.id, alunoNome: aluno.nome, error: 'Telefone não cadastrado' });
            continue;
          }

          const personalMsg = mensagem
            .replace('{nomeResponsavel}', aluno.responsavel1_nome || 'Responsável')
            .replace('{nomeAluno}', aluno.nome || 'Aluno');

          await client.query(
            `INSERT INTO whatsapp_fila (telefone, mensagem, anexo_id, link_anexo, tipo, aluno_id, turma_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [phone, personalMsg, anexoId || null, linkAnexo, tipo, aluno.id, turmaId]
          );

          enfileirados++;
        }
      }
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      enfileirados,
      errors: errors.length > 0 ? errors : undefined,
    }, { status: 201 });

  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[API WhatsApp Queue Error]:', err);
    return NextResponse.json({ error: err.message || 'Erro ao enfileirar mensagens.' }, { status: 500 });
  } finally {
    client.release();
  }
}
