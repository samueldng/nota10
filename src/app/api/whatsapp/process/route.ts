import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';

export const dynamic = 'force-dynamic';

const MAX_RETRIES = 3;
const BATCH_SIZE = 50;

/**
 * Returns a random integer between min and max (inclusive), in milliseconds.
 * Default: 5000-10000ms (5-10 seconds) to mimic human behaviour and avoid Meta's spam filters.
 */
function jitterMs(min = 5000, max = 10000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * POST /api/whatsapp/process
 * 
 * Processes the WhatsApp dispatch queue with random jitter between sends.
 * Uses wa.me/ fallback (modo demo) when WHATSAPP_WEBHOOK_URL is not configured.
 */
export async function POST() {
  const client = await getClient();

  try {
    // Fetch pending messages
    const pendingRes = await client.query(
      `SELECT wf.*, a.nome as aluno_nome
       FROM whatsapp_fila wf
       LEFT JOIN alunos a ON wf.aluno_id = a.id
       WHERE wf.status = 'pendente' AND wf.tentativas < $1
       ORDER BY wf.criado_em ASC
       LIMIT $2`,
      [MAX_RETRIES, BATCH_SIZE]
    );

    if (pendingRes.rows.length === 0) {
      client.release();
      return NextResponse.json({
        success: true,
        processados: 0,
        mensagem: 'Nenhuma mensagem pendente na fila.',
      });
    }

    const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
    const isModoDemo = !webhookUrl;

    let sucesso = 0;
    let erro = 0;
    const resultados: any[] = [];

    for (const msg of pendingRes.rows) {
      try {
        // Mark as sending
        await client.query(
          `UPDATE whatsapp_fila SET status = 'enviando', tentativas = tentativas + 1 WHERE id = $1`,
          [msg.id]
        );

        let webhookResponse = '';
        let finalStatus = 'enviado';

        if (isModoDemo) {
          // Modo Demo: generate wa.me link and log
          const waLink = `https://wa.me/${msg.telefone}?text=${encodeURIComponent(msg.mensagem)}`;
          webhookResponse = JSON.stringify({ modo: 'demo', waLink });
          console.log(`[WhatsApp Demo] → ${msg.telefone} | Link: ${waLink}`);
        } else {
          // Production: call the webhook
          try {
            const extRes = await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                number: msg.telefone,
                message: msg.mensagem,
                type: msg.tipo,
                linkAnexo: msg.link_anexo || undefined,
              }),
            });
            webhookResponse = await extRes.text();
            if (!extRes.ok) {
              finalStatus = 'erro';
            }
          } catch (webhookErr: any) {
            webhookResponse = webhookErr.message;
            finalStatus = 'erro';
          }
        }

        // Update queue status
        await client.query(
          `UPDATE whatsapp_fila SET status = $1, enviado_em = CASE WHEN $1 = 'enviado' THEN NOW() ELSE NULL END, erro_detalhe = CASE WHEN $1 = 'erro' THEN $2 ELSE NULL END WHERE id = $3`,
          [finalStatus, webhookResponse, msg.id]
        );

        // Insert into log
        await client.query(
          `INSERT INTO whatsapp_log (fila_id, telefone, tipo, aluno_nome, status, webhook_response)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [msg.id, msg.telefone, msg.tipo, msg.aluno_nome || null, finalStatus, webhookResponse]
        );

        // Also log in the existing audit table
        await client.query(
          `INSERT INTO log_auditoria (data, usuario, acao, detalhe) VALUES (NOW()::text, 'SISTEMA_WHATSAPP', $1, $2)`,
          [
            `DISPARO_${msg.tipo.toUpperCase()}${isModoDemo ? '_DEMO' : ''}`,
            `Para: ${msg.telefone} | Aluno: ${msg.aluno_nome || 'N/A'} | Status: ${finalStatus}`,
          ]
        );

        if (finalStatus === 'enviado') sucesso++;
        else erro++;

        resultados.push({
          id: msg.id,
          telefone: msg.telefone,
          alunoNome: msg.aluno_nome,
          status: finalStatus,
        });

        // Anti-spam jitter: random delay between 5 and 10 seconds
        if (pendingRes.rows.indexOf(msg) < pendingRes.rows.length - 1) {
          const delay = jitterMs();
          console.log(`[WhatsApp Throttle] Aguardando ${delay}ms antes do próximo envio...`);
          await sleep(delay);
        }

      } catch (msgErr: any) {
        console.error(`[WhatsApp Process] Erro ao processar msg ${msg.id}:`, msgErr);
        await client.query(
          `UPDATE whatsapp_fila SET status = 'erro', erro_detalhe = $1 WHERE id = $2`,
          [msgErr.message, msg.id]
        );
        erro++;
      }
    }

    client.release();

    return NextResponse.json({
      success: true,
      modoDemo: isModoDemo,
      processados: pendingRes.rows.length,
      sucesso,
      erro,
      resultados,
    });

  } catch (err: any) {
    client.release();
    console.error('[API WhatsApp Process Error]:', err);
    return NextResponse.json({ error: err.message || 'Erro ao processar fila.' }, { status: 500 });
  }
}
