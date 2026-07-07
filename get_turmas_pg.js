const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://deployer_admin:A!S@d3f4g5h6@localhost:5432/nota10_prod"
});

async function run() {
  await client.connect();
  const res = await client.query("SELECT id, nome, acompanhamento FROM turmas");
  console.log(`Found ${res.rows.length} turmas:`);
  res.rows.forEach(r => {
    console.log(`- ID: ${r.id}, Nome: "${r.nome}", Acompanhamento: "${r.acompanhamento}"`);
  });
  await client.end();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
