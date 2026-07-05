import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await query(`
      SELECT data, usuario, acao, detalhe
      FROM log_auditoria
      ORDER BY id DESC
    `);

    return NextResponse.json(result.rows);
  } catch (err: any) {
    console.error('Error fetching audit logs:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, usuario, acao, detalhe } = body;

    await query(
      `INSERT INTO log_auditoria (data, usuario, acao, detalhe) VALUES ($1, $2, $3, $4)`,
      [data, usuario, acao, detalhe || null]
    );

    return NextResponse.json({ success: true, data, usuario, acao, detalhe });
  } catch (err: any) {
    console.error('Error creating audit log:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
