/**
 * seed_professores.js
 * ═══════════════════════════════════════════════════════════════════════════
 * Seed idempotente do corpo docente — Nota 10 Educacional
 *
 * SEGURO: usa ON CONFLICT (email) DO NOTHING.
 * Professores já existentes (Romildo, Admin) NÃO são alterados.
 * Vínculos de turma usam ON CONFLICT DO NOTHING — não sobrescrevem.
 *
 * Uso na VPS (via SSH):
 *   cd ~/nota10 && node seed_professores.js
 *
 * Ou dentro do container:
 *   docker exec -i nota10-app node /app/seed_professores.js
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { Pool } = require('pg');
const fs       = require('fs');
const path     = require('path');

// ── Carregar DATABASE_URL de .env.local / .env / variável de ambiente ─────────
function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    try {
      const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
      const match   = content.match(/DATABASE_URL\s*=\s*(.+)/);
      if (match) return match[1].trim().replace(/^["']|["']$/g, '');
    } catch (_) {}
  }
  return process.env.DATABASE_URL;
}

const dbUrl = loadEnv();
if (!dbUrl) {
  console.error('❌  DATABASE_URL não encontrada. Defina em .env.local ou como variável de ambiente.');
  process.exit(1);
}

const pool = new Pool({ connectionString: dbUrl });

// ════════════════════════════════════════════════════════════════════════════
// DADOS DOS PROFESSORES
// Turmas referenciadas pelos NOMES REAIS da tabela `turmas` no banco.
// Nomes não encontrados serão ignorados (com aviso), nunca causam erro.
// ════════════════════════════════════════════════════════════════════════════

const PROFESSORES = [
  {
    nome:       'Brennda Larissa',
    email:      'brenndalarissafp00@gmail.com',
    telefone:   '(99) 98241-6688',
    especialidade: 'Matemática',
    descricao:  'Reforço (Tarde), Elite, Projeto e Pré CMT',
    // Turmas que leciona — nomes exatos da tabela `turmas`
    // Se uma turma não existir no BD, será avisado e pulada (nunca erro).
    turmas: [
      'Reforço Geral',   // T6 — turma de reforço
      // Adicione outros nomes quando as turmas Elite/Projeto/Pré CMT forem criadas:
      // 'Elite Tarde',
      // 'Projeto',
      // 'Pré CMT',
    ],
  },
  {
    nome:       'Rafaella Miranda',
    email:      'bruninharaf3@gmail.com',
    telefone:   '(99) 98255-5898',
    especialidade: 'Português e Multidisciplinar (Reforço)',
    descricao:  'Reforço (Manhã e Tarde), Projeto, Pré CMT',
    turmas: [
      'Reforço Geral',   // turma de reforço manhã/tarde
      // Adicione outros nomes quando as turmas Projeto/Pré CMT forem criadas:
      // 'Projeto',
      // 'Pré CMT',
    ],
  },
  {
    nome:       'Bruna Cavalcante',
    email:      'blfp0901@gmail.com',
    telefone:   '(99) 98105-3472',
    especialidade: 'Português',
    descricao:  'Pré CMT (T1 a T5, T8, T11)',
    turmas: [
      '4A Manhã',    // T1-equivalente
      '4B Tarde',    // T2-equivalente
      '5A Manhã',    // T3-equivalente
      '5B Tarde',    // T4-equivalente
      '5C Manhã',    // T5-equivalente
      // T8 e T11 serão vinculados quando essas turmas forem criadas no sistema
    ],
  },
];

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Resolve nomes de turmas para UUIDs consultando o banco.
 * Nomes não encontrados são registados em `warnings` e ignorados.
 */
async function resolveNomesParaUuids(client, nomes, warnings) {
  const uuids = [];
  for (const nome of nomes) {
    const res = await client.query(
      'SELECT id FROM turmas WHERE nome = $1 LIMIT 1',
      [nome]
    );
    if (res.rows.length > 0) {
      uuids.push(res.rows[0].id);
    } else {
      warnings.push(`  ⚠️  Turma não encontrada no BD: "${nome}" — vínculo ignorado (crie a turma e reexecute o script).`);
    }
  }
  return uuids;
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════

async function run() {
  const client = await pool.connect();
  try {
    console.log('\n🔗 Conectado ao banco de dados.');
    console.log('═'.repeat(70));
    console.log('  SEED IDEMPOTENTE — CORPO DOCENTE — NOTA 10 EDUCACIONAL');
    console.log('  Registros existentes NÃO serão alterados ou apagados.');
    console.log('═'.repeat(70) + '\n');

    // ── Verificar estado atual ───────────────────────────────────────────────
    const existentes = await client.query('SELECT nome, email FROM professores ORDER BY nome');
    console.log(`📋 Professores já cadastrados (${existentes.rows.length}):`);
    existentes.rows.forEach(p => console.log(`   • ${p.nome} <${p.email}>`));
    console.log('');

    // ── Verificar coluna telefone/especialidade (adicionadas se ausentes) ────
    const colCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'professores'
        AND column_name IN ('telefone', 'especialidade', 'descricao')
    `);
    const existingCols = new Set(colCheck.rows.map(r => r.column_name));

    if (!existingCols.has('telefone')) {
      console.log('📐 Adicionando coluna telefone à tabela professores...');
      await client.query(`ALTER TABLE professores ADD COLUMN IF NOT EXISTS telefone TEXT`);
    }
    if (!existingCols.has('especialidade')) {
      console.log('📐 Adicionando coluna especialidade à tabela professores...');
      await client.query(`ALTER TABLE professores ADD COLUMN IF NOT EXISTS especialidade TEXT`);
    }
    if (!existingCols.has('descricao')) {
      console.log('📐 Adicionando coluna descricao à tabela professores...');
      await client.query(`ALTER TABLE professores ADD COLUMN IF NOT EXISTS descricao TEXT`);
    }

    // ── Inserir cada professor ───────────────────────────────────────────────
    const allWarnings = [];
    const resultados  = [];

    for (const prof of PROFESSORES) {
      console.log(`👤 Processando: ${prof.nome} <${prof.email}>`);

      await client.query('BEGIN');

      // INSERT idempotente: se o email já existe, não faz nada (preserva dados)
      const insRes = await client.query(`
        INSERT INTO professores (nome, email, status, telefone, especialidade, descricao)
        VALUES ($1, $2, 'ativo', $3, $4, $5)
        ON CONFLICT (email) DO NOTHING
        RETURNING id, nome, email
      `, [prof.nome, prof.email, prof.telefone, prof.especialidade, prof.descricao]);

      let professorId;
      let acao;

      if (insRes.rows.length > 0) {
        // Novo registro inserido
        professorId = insRes.rows[0].id;
        acao        = '✅ INSERIDO';
      } else {
        // Já existia — buscar o id existente
        const existing = await client.query(
          'SELECT id FROM professores WHERE email = $1',
          [prof.email]
        );
        professorId = existing.rows[0].id;
        acao        = '⏩ JÁ EXISTIA (preservado)';
      }

      // Resolver turmas por nome → UUID
      const warnings    = [];
      const turmaUuids  = await resolveNomesParaUuids(client, prof.turmas, warnings);
      allWarnings.push(...warnings);

      // Vincular turmas (ON CONFLICT DO NOTHING — não sobrescreve vínculos existentes)
      let vinculosNovos = 0;
      for (const turmaId of turmaUuids) {
        const vinculoRes = await client.query(`
          INSERT INTO turma_professores (turma_id, professor_id)
          VALUES ($1, $2)
          ON CONFLICT (turma_id, professor_id) DO NOTHING
          RETURNING turma_id
        `, [turmaId, professorId]);
        if (vinculoRes.rows.length > 0) vinculosNovos++;
      }

      await client.query('COMMIT');

      resultados.push({ nome: prof.nome, acao, turmasVinculadas: turmaUuids.length, vinculosNovos });
      console.log(`   ${acao} | ID: ${professorId}`);
      console.log(`   📚 Turmas encontradas: ${turmaUuids.length}/${prof.turmas.length} | Vínculos novos: ${vinculosNovos}`);
      warnings.forEach(w => console.log(`   ${w}`));
      console.log('');
    }

    // ── Verificação final ────────────────────────────────────────────────────
    console.log('═'.repeat(70));
    console.log('  VERIFICAÇÃO FINAL');
    console.log('═'.repeat(70));

    const finalRes = await client.query(`
      SELECT p.nome, p.email, p.status, p.telefone, p.especialidade,
             COUNT(tp.turma_id) AS num_turmas
      FROM professores p
      LEFT JOIN turma_professores tp ON p.id = tp.professor_id
      GROUP BY p.id, p.nome, p.email, p.status, p.telefone, p.especialidade
      ORDER BY p.nome
    `);

    finalRes.rows.forEach(p => {
      console.log(`   • ${p.nome} — ${p.email} — ${p.status} — ${p.num_turmas} turma(s)`);
    });

    if (allWarnings.length > 0) {
      console.log('\n⚠️  AVISOS (turmas não encontradas — reexecute após criar estas turmas):');
      [...new Set(allWarnings)].forEach(w => console.log(w));
    }

    console.log('\n🎉 Seed concluído com sucesso!');
    console.log('   Os professores já podem ser visualizados no painel administrativo.');
    console.log('   Para vincular turmas ainda não criadas, crie-as no sistema e reexecute este script.\n');

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('\n❌ Erro durante o seed:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

run();
