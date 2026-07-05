import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const pool = getPool();
  let dbOk = false;
  if (pool) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      dbOk = true;
    } catch (e) {
      console.error('Healthcheck DB error:', e);
    }
  }
  return NextResponse.json({
    status: 'ok',
    database: dbOk ? 'connected' : 'disconnected',
  });
}
