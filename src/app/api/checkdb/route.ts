import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensureProgressTables } from '@/lib/ensureTables';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureProgressTables();
    const res = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    return NextResponse.json({ tables: res.rows, message: 'Verificação e migração automática de tabelas concluída com sucesso!' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

