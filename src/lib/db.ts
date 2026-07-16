import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

let pool: Pool | null = null;

// ── Auto-migration flag: garante que roda UMA VEZ por lifecycle da app ─────────
let migrationDone = false;

/**
 * Converte aluno_progresso.atividade_id de UUID para TEXT se necessário.
 * Essa migração é idempotente — se a coluna já for TEXT/VARCHAR, não faz nada.
 * Roda automaticamente na primeira query ou getClient() do lifecycle.
 */
async function ensureAtividadeIdIsText(p: Pool) {
  if (migrationDone) return;
  migrationDone = true; // marca antes para evitar re-entrância

  try {
    // 1. Verifica o tipo actual da coluna
    const colRes = await p.query(`
      SELECT udt_name
      FROM information_schema.columns
      WHERE table_name = 'aluno_progresso' AND column_name = 'atividade_id'
    `);

    if (colRes.rows.length === 0) {
      console.log('[DB Migration] Tabela aluno_progresso ou coluna atividade_id não existe. Pulando.');
      return;
    }

    const colType = colRes.rows[0].udt_name; // 'uuid', 'varchar', 'text'

    if (colType === 'text' || colType === 'varchar') {
      console.log(`[DB Migration] atividade_id já é ${colType} — nenhuma migração necessária.`);
      return;
    }

    console.log(`[DB Migration] atividade_id é ${colType} — iniciando conversão para TEXT...`);

    // 2. Remover TODAS as FK constraints de atividade_id
    const fkRes = await p.query(`
      SELECT tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = 'aluno_progresso'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND ccu.column_name = 'atividade_id'
    `);

    for (const row of fkRes.rows) {
      console.log(`[DB Migration] Removendo FK: ${row.constraint_name}`);
      await p.query(`ALTER TABLE aluno_progresso DROP CONSTRAINT IF EXISTS "${row.constraint_name}"`);
    }

    // 3. Dropar índices existentes sobre atividade_id (podem ter tipo UUID)
    await p.query(`DROP INDEX IF EXISTS idx_progresso_aluno_atividade_unique`);
    await p.query(`DROP INDEX IF EXISTS idx_progresso_atividade`);

    // 4. Converter a coluna: UUID → TEXT
    await p.query(`
      ALTER TABLE aluno_progresso
        ALTER COLUMN atividade_id TYPE TEXT USING atividade_id::text
    `);
    console.log('[DB Migration] ✅ Coluna atividade_id convertida para TEXT.');

    // 5. Recriar índice de busca
    await p.query(`CREATE INDEX IF NOT EXISTS idx_progresso_atividade ON aluno_progresso (atividade_id)`);

    // 6. Limpar duplicatas antes de criar o índice único
    const dupRes = await p.query(`
      SELECT aluno_id, atividade_id, COUNT(*) as cnt
      FROM aluno_progresso
      WHERE atividade_id IS NOT NULL
      GROUP BY aluno_id, atividade_id
      HAVING COUNT(*) > 1
    `);
    if (dupRes.rows.length > 0) {
      console.log(`[DB Migration] Encontradas ${dupRes.rows.length} duplicata(s) — limpando...`);
      await p.query(`
        DELETE FROM aluno_progresso
        WHERE id NOT IN (
          SELECT DISTINCT ON (aluno_id, atividade_id) id
          FROM aluno_progresso
          WHERE atividade_id IS NOT NULL
          ORDER BY aluno_id, atividade_id, created_at ASC
        )
        AND atividade_id IS NOT NULL
      `);
    }

    // 7. Recriar índice único parcial (idempotência anti-spam)
    await p.query(`
      CREATE UNIQUE INDEX idx_progresso_aluno_atividade_unique
        ON aluno_progresso (aluno_id, atividade_id)
        WHERE atividade_id IS NOT NULL
    `);
    console.log('[DB Migration] ✅ Índice único idx_progresso_aluno_atividade_unique criado.');

    console.log('[DB Migration] 🎉 Migração automática concluída com sucesso.');
  } catch (err: any) {
    console.error('[DB Migration] ❌ Falha na migração automática:', err.message);
    // Não relança — a app continua a funcionar; a migração será retentada no próximo restart.
    migrationDone = false;
  }
}

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

  // Disparar migração automaticamente ao arrancar
  ensureAtividadeIdIsText(pool);
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
