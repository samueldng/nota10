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
pool.query('SELECT nome FROM turmas ORDER BY nome')
  .then(r => { r.rows.forEach(x => console.log(x.nome)); pool.end(); })
  .catch(e => { console.error(e.message); pool.end(); });
