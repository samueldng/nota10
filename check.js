const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/nota10' });
client.connect().then(() => 
  client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'registros_lancados'")
).then(res => { 
  console.log('--- registros_lancados columns ---');
  res.rows.forEach(r => console.log(r.column_name, r.data_type));
  return client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'registro_alunos'");
}).then(res => {
  console.log('--- registro_alunos columns ---');
  res.rows.forEach(r => console.log(r.column_name, r.data_type));
  client.end(); 
}).catch(e => { 
  console.error('DB ERROR:', e); 
  client.end(); 
});
