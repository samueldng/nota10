import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      alunoId,
      telefone = '+55 (11) 99999-8888',
      mensagem,
      tipo = 'relatorio_mensal'
    } = body;

    if (!mensagem) {
      return NextResponse.json({ error: 'Mensagem é obrigatória para disparo de WhatsApp' }, { status: 400 });
    }

    await query(`
      CREATE TABLE IF NOT EXISTS whatsapp_queue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        aluno_id UUID,
        telefone VARCHAR(30) NOT NULL,
        mensagem TEXT NOT NULL,
        tipo VARCHAR(50) DEFAULT 'relatorio_mensal',
        status VARCHAR(30) DEFAULT 'enviado',
        dispatched_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    let queueId = 'mock-wa-' + Date.now();

    if (alunoId && isUuid(String(alunoId))) {
      const res = await query(
        `INSERT INTO whatsapp_queue (aluno_id, telefone, mensagem, tipo, status, dispatched_at)
         VALUES ($1, $2, $3, $4, 'enviado', NOW())
         RETURNING id`,
        [alunoId, telefone, mensagem, tipo]
      );
      if (res.rows.length > 0) queueId = res.rows[0].id;
    }

    return NextResponse.json({
      success: true,
      queueId,
      status: 'enviado',
      telefoneDestino: telefone,
      mensagemDisparada: mensagem,
      dispatchedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Erro ao disparar WhatsApp:', error);
    return NextResponse.json({ error: 'Erro interno na fila do WhatsApp' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS whatsapp_queue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        aluno_id UUID,
        telefone VARCHAR(30) NOT NULL,
        mensagem TEXT NOT NULL,
        tipo VARCHAR(50) DEFAULT 'relatorio_mensal',
        status VARCHAR(30) DEFAULT 'enviado',
        dispatched_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const res = await query(`SELECT * FROM whatsapp_queue ORDER BY created_at DESC LIMIT 50`);
    return NextResponse.json(res.rows);
  } catch (error: any) {
    console.error('Erro ao consultar fila WhatsApp:', error);
    return NextResponse.json({ error: 'Erro interno ao consultar fila' }, { status: 500 });
  }
}
