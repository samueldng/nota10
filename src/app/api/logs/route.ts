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

    if (!data || !usuario || !acao) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO log_auditoria (data, usuario, acao, detalhe) VALUES ($1, $2, $3, $4) RETURNING *`,
      [data, usuario, acao, detalhe || null]
    );

    const row = result.rows[0];

    return NextResponse.json({ 
      success: true, 
      id: row.id,
      data: row.data, 
      usuario: row.usuario, 
      acao: row.acao, 
      detalhe: row.detalhe 
    }, { status: 201 });
  } catch (err: any) {
    console.error('Erro no POST /api/logs:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao salvar o registro no banco de dados.' },
      { status: 500 }
    );
  }
}
