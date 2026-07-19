const { Pool } = require('pg');
const fs   = require('fs');
const path = require('path');

function loadEnv() {
  for (const f of ['.env.local', '.env']) {
    try {
      const c = fs.readFileSync(path.join(__dirname, f), 'utf8');
      const m = c.match(/DATABASE_URL\s*=\s*(.+)/);
      if (m) return m[1].trim().replace(/^["']|["']$/g, '');
    } catch (_) {}
  }
  return process.env.DATABASE_URL;
}

const pool = new Pool({ connectionString: loadEnv() });

async function run() {
  const q = (sql, p) => pool.query(sql, p);

  const cols = await q(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'matriculas'
    ORDER BY ordinal_position
  `);
  console.log('=== MATRICULAS COLUMNS ===');
  cols.rows.forEach(r => console.log(' ', r.column_name, '-', r.data_type));

  const acomp = await q(`SELECT DISTINCT acompanhamento FROM alunos ORDER BY 1 LIMIT 20`);
  console.log('\n=== ACOMPANHAMENTOS (alunos) ===');
  acomp.rows.forEach(r => console.log(' ', r.acompanhamento));

  const xpStats = await q(`SELECT COUNT(*) as n, COALESCE(SUM(xp_total),0) as total_xp FROM alunos WHERE xp_total > 0`);
  console.log('\n=== ALUNOS COM XP > 0 ===', xpStats.rows[0]);

  const acompTurma = await q(`SELECT DISTINCT acompanhamento FROM turmas ORDER BY 1`);
  console.log('\n=== ACOMPANHAMENTOS (turmas) ===');
  acompTurma.rows.forEach(r => console.log(' ', r.acompanhamento));

  pool.end();
}

run().catch(e => { console.error(e.message); pool.end(); });

