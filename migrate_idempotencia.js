/**
 * migrate_idempotencia.js
 * Aplica a unique constraint parcial em aluno_progresso(aluno_id, atividade_id)
 * para garantir idempotência no sistema de XP (anti-spam de duplicação de XP).
 *
 * Uso: node migrate_idempotencia.js
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

    // 1. Verificar duplicatas existentes
    const dupRes = await client.query(`
      SELECT aluno_id, atividade_id, COUNT(*) as cnt
      FROM aluno_progresso
      WHERE atividade_id IS NOT NULL
      GROUP BY aluno_id, atividade_id
      HAVING COUNT(*) > 1
    `);

    if (dupRes.rows.length > 0) {
      console.log(`⚠️  Encontradas ${dupRes.rows.length} combinação(ões) duplicadas. Limpando...`);

      // Remover duplicatas, mantendo o registro mais antigo (created_at ASC)
      const deleteRes = await client.query(`
        DELETE FROM aluno_progresso
        WHERE id NOT IN (
          SELECT DISTINCT ON (aluno_id, atividade_id) id
          FROM aluno_progresso
          WHERE atividade_id IS NOT NULL
          ORDER BY aluno_id, atividade_id, created_at ASC
        )
        AND atividade_id IS NOT NULL
      `);
      console.log(`🗑️  ${deleteRes.rowCount} registro(s) duplicado(s) removido(s).`);
    } else {
      console.log('✅ Nenhuma duplicata encontrada.');
    }

    // 2. Criar índice único parcial (se ainda não existir)
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_progresso_aluno_atividade_unique
        ON aluno_progresso (aluno_id, atividade_id)
        WHERE atividade_id IS NOT NULL
    `);
    console.log('✅ Índice único idx_progresso_aluno_atividade_unique criado (ou já existia).');

    // 3. Verificação final
    const countRes = await client.query(`SELECT COUNT(*) as total FROM aluno_progresso`);
    console.log(`\n📊 Total de registros em aluno_progresso: ${countRes.rows[0].total}`);
    console.log('\n🎉 Migração de idempotência concluída com sucesso!');
    console.log('   O sistema de XP agora usa ON CONFLICT DO NOTHING para bloqueio de duplicatas.');

  } catch (err) {
    console.error('❌ Migração falhou:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

run();
