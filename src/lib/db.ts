import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

let pool: Pool | null = null;

if (connectionString) {
  pool = new Pool({
    connectionString,
    max: 10, // maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err);
  });
} else {
  console.warn('DATABASE_URL is not set. Database connections will not be available.');
}

export async function query(text: string, params?: any[]) {
  if (!pool) {
    throw new Error('Database pool not initialized. Check if DATABASE_URL is set.');
  }
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
}

export function getPool() {
  return pool;
}

/**
 * Get a dedicated client from the pool for transaction support.
 * IMPORTANT: Always call client.release() when done, even on errors.
 */
export async function getClient() {
  if (!pool) {
    throw new Error('Database pool not initialized. Check if DATABASE_URL is set.');
  }
  return pool.connect();
}
