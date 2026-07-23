import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/whatsapp/status
 * 
 * Returns the current state of the WhatsApp dispatch queue.
 * Optional query params: tipo (filter by type)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');

    let whereClause = '';
    const params: any[] = [];

    if (tipo) {
      whereClause = ' WHERE tipo = $1';
      params.push(tipo);
    }

    // Queue counts by status
    const statusRes = await query(
      `SELECT status, COUNT(*) as count FROM whatsapp_fila${whereClause} GROUP BY status`,
      params
    );

    const counts: Record<string, number> = {
      pendente: 0,
      enviando: 0,
      enviado: 0,
      erro: 0,
    };

    for (const row of statusRes.rows) {
      counts[row.status] = parseInt(row.count);
    }

    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    // Recent log entries
    const recentRes = await query(
      `SELECT wl.*, wf.mensagem
       FROM whatsapp_log wl
       LEFT JOIN whatsapp_fila wf ON wl.fila_id = wf.id
       ORDER BY wl.created_at DESC
       LIMIT 20`
    );

    return NextResponse.json({
      fila: counts,
      total,
      progresso: total > 0
        ? Math.round(((counts.enviado + counts.erro) / total) * 100)
        : 100,
      recentes: recentRes.rows.map(row => ({
        id: row.id,
        telefone: row.telefone,
        tipo: row.tipo,
        alunoNome: row.aluno_nome,
        status: row.status,
        createdAt: row.created_at,
      })),
    });
  } catch (err: any) {
    console.error('[API WhatsApp Status Error]:', err);
    return NextResponse.json({ error: err.message || 'Erro ao consultar status.' }, { status: 500 });
  }
}
