/**
 * fix_prod_uuid.js
 *
 * CORREÇÃO IMEDIATA DE PRODUÇÃO — Erro 22P02
 * ============================================
 * Converte aluno_progresso.atividade_id de UUID para TEXT na base de dados
 * de produção, sem precisar de rebuild do Docker.
 *
 * Como usar NO VPS (via SSH):
 *   cd ~/nota10
 *   node fix_prod_uuid.js
 *
 * Ou dentro do container:
 *   docker exec -i nota10-app node /app/fix_prod_uuid.js
 */
const { Pool } = require('pg');
const fs   = require('fs');
const path = require('path');

function loadEnv() {
  // Tenta .env.local, .env, e depois variáveis de ambiente
  for (const file of ['.env.local', '.env']) {
    try {
      const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
      const match = content.match(/DATABASE_URL\s*=\s*(.+)/);
      if (match) return match[1].trim().replace(/^["']|["']$/g, '');
    } catch (_) {}
  }
  return process.env.DATABASE_URL;
}

const dbUrl = loadEnv();
if (!dbUrl) {
  console.error('❌  DATABASE_URL não encontrada. Defina nas variáveis de ambiente ou em .env.local');
  process.exit(1);
}

const pool = new Pool({ connectionString: dbUrl });

async function run() {
  const client = await pool.connect();
  try {
    console.log('\n🔗 Conectado ao banco de dados de produção.');

    // ── 1. Verificar tipo actual da coluna ─────────────────────────────────────
    const colRes = await client.query(`
      SELECT udt_name
      FROM information_schema.columns
      WHERE table_name = 'aluno_progresso'
        AND column_name = 'atividade_id'
    `);

    if (colRes.rows.length === 0) {
      console.error('❌  Coluna atividade_id não encontrada em aluno_progresso.');
      return;
    }

    const colType = colRes.rows[0].udt_name;
    console.log(`📋 Tipo actual de atividade_id: ${colType}`);

    if (colType === 'text' || colType === 'varchar') {
      console.log('✅ Coluna já é TEXT/VARCHAR — sem necessidade de conversão.');
      // Mesmo assim recria o índice único para garantir idempotência
    } else {
      console.log(`⚠️  Coluna é ${colType} — iniciando conversão para TEXT...\n`);

      // ── 2. Remover FK constraint(s) sobre atividade_id ──────────────────────
      const fkRes = await client.query(`
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
          ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name    = 'aluno_progresso'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND ccu.column_name  = 'atividade_id'
      `);

      for (const row of fkRes.rows) {
        console.log(`🔗 Removendo FK constraint: ${row.constraint_name}`);
        await client.query(
          `ALTER TABLE aluno_progresso DROP CONSTRAINT IF EXISTS "${row.constraint_name}"`
        );
      }
      if (fkRes.rows.length === 0) console.log('ℹ️  Nenhuma FK constraint encontrada em atividade_id.');

      // ── 3. Remover índices existentes (tipados como UUID) ───────────────────
      await client.query(`DROP INDEX IF EXISTS idx_progresso_aluno_atividade_unique`);
      await client.query(`DROP INDEX IF EXISTS idx_progresso_atividade`);
      console.log('🗑️  Índices antigos removidos.');

      // ── 4. Converter UUID → TEXT ─────────────────────────────────────────────
      await client.query(`
        ALTER TABLE aluno_progresso
          ALTER COLUMN atividade_id TYPE TEXT USING atividade_id::text
      `);
      console.log('✅ Coluna atividade_id convertida para TEXT com sucesso.');

      // ── 5. Recriar índice de busca simples ───────────────────────────────────
      await client.query(
        `CREATE INDEX IF NOT EXISTS idx_progresso_atividade ON aluno_progresso (atividade_id)`
      );
    }

    // ── 6. Limpar duplicatas antes do índice único ────────────────────────────
    const dupRes = await client.query(`
      SELECT aluno_id, atividade_id, COUNT(*) as cnt
      FROM aluno_progresso
      WHERE atividade_id IS NOT NULL
      GROUP BY aluno_id, atividade_id
      HAVING COUNT(*) > 1
    `);

    if (dupRes.rows.length > 0) {
      console.log(`⚠️  ${dupRes.rows.length} duplicata(s) encontrada(s). Removendo mais antigas...`);
      const delRes = await client.query(`
        DELETE FROM aluno_progresso
        WHERE id NOT IN (
          SELECT DISTINCT ON (aluno_id, atividade_id) id
          FROM aluno_progresso
          WHERE atividade_id IS NOT NULL
          ORDER BY aluno_id, atividade_id, created_at ASC
        )
        AND atividade_id IS NOT NULL
      `);
      console.log(`🗑️  ${delRes.rowCount} duplicata(s) removida(s).`);
    } else {
      console.log('✅ Sem duplicatas encontradas.');
    }

    // ── 7. Criar/recriar índice único parcial ─────────────────────────────────
    await client.query(`DROP INDEX IF EXISTS idx_progresso_aluno_atividade_unique`);
    await client.query(`
      CREATE UNIQUE INDEX idx_progresso_aluno_atividade_unique
        ON aluno_progresso (aluno_id, atividade_id)
        WHERE atividade_id IS NOT NULL
    `);
    console.log('✅ Índice único idx_progresso_aluno_atividade_unique criado.');

    // ── 8. Verificação final ──────────────────────────────────────────────────
    const verifyRes = await client.query(`
      SELECT udt_name
      FROM information_schema.columns
      WHERE table_name = 'aluno_progresso' AND column_name = 'atividade_id'
    `);
    const total = await client.query(`SELECT COUNT(*) as n FROM aluno_progresso`);

    console.log(`\n📋 Tipo final de atividade_id: ${verifyRes.rows[0].udt_name}`);
    console.log(`📊 Total de registros em aluno_progresso: ${total.rows[0].n}`);
    console.log('\n🎉 Correcção aplicada! O erro 22P02 não ocorrerá mais.');
    console.log('   Reinicie o container para carregar o novo código: docker restart nota10-app\n');

  } catch (err) {
    console.error('\n❌ Falha na correcção:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

run();
