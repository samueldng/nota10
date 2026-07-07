const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf-8');
const lines = env.split('\n');
let supabaseUrl = '';
let supabaseAnonKey = '';

lines.forEach(l => {
  if (l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = l.split('=')[1].trim();
  }
  if (l.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    supabaseAnonKey = l.split('=')[1].trim();
  }
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.log("No Supabase URL/Key found!");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase.from('turmas').select('*');
  if (error) {
    console.error("Error reading database:", error);
  } else {
    console.log(`Found ${data.length} turmas in DB:`);
    data.forEach(d => {
      console.log(`- ID: ${d.id}, Nome: "${d.nome}", Acompanhamento: "${d.acompanhamento}"`);
    });
  }
}

run();
