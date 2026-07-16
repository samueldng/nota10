/**
 * migrate_atividade_id_text.js
 *
 * PROBLEMA: aluno_progresso.atividade_id é UUID (com FK para cronograma_atividades).
 * Isso impede armazenar identificadores de subtarefas (strings como "teste de sub")
 * que não existem como UUIDs na tabela cronograma_atividades.
 *
 * SOLUÇÃO: Converter a coluna para TEXT e remover a FK constraint.
 * - Tarefas pai: continua recebendo o UUID (como string TEXT)
 * - Subtarefas: recebe o título (string TEXT)
 * - O índice único parcial é recriado sobre TEXT
 *
 * Uso: node migrate_atividade_id_text.js
 */
const { Pool } = require('pg');
const fs   = require('fs');
const path = require('path');

function loadEnv() {
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
  console.error('❌  DATABASE_URL não encontrada.');
  process.exit(1);
}

const pool = new Pool({ connectionString: dbUrl });

async function run() {
  const client = await pool.connect();
  try {
    console.log('🔗 Conectado ao banco de dados.');
    console.log('⚙️  Iniciando migração: atividade_id UUID → TEXT\n');

    // ── 1. Inspecionar o estado atual da coluna ──────────────────────────────
    const colRes = await client.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'aluno_progresso' AND column_name = 'atividade_id'
    `);

    if (colRes.rows.length === 0) {
      console.log('⚠️  Coluna atividade_id não encontrada. Verifique a tabela.');
      return;
    }

    const colType = colRes.rows[0].udt_name; // 'uuid' ou 'varchar' ou 'text'
    console.log(`📋 Tipo atual de atividade_id: ${colRes.rows[0].data_type} (${colType})`);

    if (colType === 'text' || colType === 'varchar') {
      console.log('✅ Coluna já é TEXT/VARCHAR — nenhuma alteração de tipo necessária.');
    } else {
      // ── 2. Descobrir e remover FK constraint ────────────────────────────────
      const fkRes = await client.query(`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'aluno_progresso'
          AND constraint_type = 'FOREIGN KEY'
      `);

      for (const row of fkRes.rows) {
        console.log(`🔗 Removendo FK constraint: ${row.constraint_name}`);
        await client.query(
          `ALTER TABLE aluno_progresso DROP CONSTRAINT IF EXISTS "${row.constraint_name}"`
        );
      }

      // ── 3. Remover índice único existente (criado na migração anterior) ────
      await client.query(
        `DROP INDEX IF EXISTS idx_progresso_aluno_atividade_unique`
      );
      console.log('🗑️  Índice único anterior removido (será recriado sobre TEXT).');

      // ── 4. Remover índice comum sobre atividade_id (pode ser UUID-typed) ───
      await client.query(
        `DROP INDEX IF EXISTS idx_progresso_atividade`
      );

      // ── 5. Alterar tipo da coluna: UUID → TEXT ─────────────────────────────
      await client.query(`
        ALTER TABLE aluno_progresso
          ALTER COLUMN atividade_id TYPE TEXT USING atividade_id::text
      `);
      console.log('✅ Coluna atividade_id alterada para TEXT.');

      // ── 6. Recriar índice comum ──────────────────────────────────────────────
      await client.query(
        `CREATE INDEX IF NOT EXISTS idx_progresso_atividade ON aluno_progresso (atividade_id)`
      );
      console.log('✅ Índice idx_progresso_atividade recriado.');
    }

    // ── 7. Recriar índice único parcial (idempotência anti-spam de XP) ───────
    // Garante que ON CONFLICT (aluno_id, atividade_id) funcione correctamente.
    await client.query(`
      DROP INDEX IF EXISTS idx_progresso_aluno_atividade_unique
    `);
    await client.query(`
      CREATE UNIQUE INDEX idx_progresso_aluno_atividade_unique
        ON aluno_progresso (aluno_id, atividade_id)
        WHERE atividade_id IS NOT NULL
    `);
    console.log('✅ Índice único idx_progresso_aluno_atividade_unique recriado sobre TEXT.');

    // ── 8. Verificação final ──────────────────────────────────────────────────
    const verifyRes = await client.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'aluno_progresso' AND column_name = 'atividade_id'
    `);
    const finalType = verifyRes.rows[0];
    console.log(`\n📋 Tipo final de atividade_id: ${finalType.data_type} (${finalType.udt_name})`);

    const idxRes = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'aluno_progresso' AND indexname = 'idx_progresso_aluno_atividade_unique'
    `);
    if (idxRes.rows.length > 0) {
      console.log(`✅ Índice único confirmado: ${idxRes.rows[0].indexname}`);
    }

    const countRes = await client.query(`SELECT COUNT(*) as total FROM aluno_progresso`);
    console.log(`📊 Total de registros em aluno_progresso: ${countRes.rows[0].total}`);

    console.log('\n🎉 Migração concluída! Subtarefas com título string agora podem ser armazenadas.');

  } catch (err) {
    console.error('❌ Migração falhou:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

run();
