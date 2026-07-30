const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://deployer_admin:A!S@d3f4g5h6@localhost:5432/nota10_prod' });
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'registros_lancados'").then(res => {
  console.log(res.rows);
  process.exit(0);
}).catch(console.error);
