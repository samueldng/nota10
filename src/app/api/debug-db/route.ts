import { NextResponse } from 'next/server';
import { getClient } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const client = await getClient();
  try {
    const turmas = await client.query('SELECT id, nome FROM turmas');
    const conteudos = await client.query('SELECT id, titulo, url_acesso FROM conteudos_midia');
    return NextResponse.json({
      turmas: turmas.rows,
      conteudos: conteudos.rows,
    });
  } finally {
    client.release();
  }
}
