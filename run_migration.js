/**
 * run_migration.js
 * Executa as migrações 005 e 006 sem precisar do psql.
 * Uso na VPS: node run_migration.js
 */
const { Pool } = require('pg');
const fs   = require('fs');
const path = require('path');

// Resolve DATABASE_URL de .env ou .env.local
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
  console.error('❌  DATABASE_URL não encontrada em .env/.env.local nem nas variáveis de ambiente.');
  process.exit(1);
}

const pool = new Pool({ connectionString: dbUrl });

// ─────────────────────────────────────────────
// Lista de videoaulas oficiais
// ─────────────────────────────────────────────
const videos = [
  // Introdução
  { titulo: 'Bem Vindo ao PRÉ-CMT Nota 10',            url: 'https://youtu.be/Bmqb2SeSzKw', disciplina: 'Introdução', descricao: 'Aula de boas-vindas ao curso Pré-CMT Nota 10. Conheça a metodologia, a equipe e o que esperar de cada módulo.' },
  { titulo: 'Como Usar a Apostila Nota 10',             url: 'https://youtu.be/1Se5-gKvQ1o', disciplina: 'Introdução', descricao: 'Guia prático de como utilizar a apostila do curso Pré-CMT Nota 10 para maximizar seu desempenho nos estudos.' },
  { titulo: 'REVELADO: Segredo de quem já foi aprovado',url: 'https://youtu.be/m8IJqbRcuGI', disciplina: 'Introdução', descricao: 'Descubra as estratégias e hábitos dos alunos que já conquistaram a aprovação no CMT.' },
  // Português
  { titulo: 'Português — Bloco I',    url: 'https://youtu.be/GoX7ntye4Ac', disciplina: 'Português',  descricao: 'Videoaula do Bloco I de Português. Fundamentos da língua portuguesa com foco no conteúdo exigido no CMT.' },
  { titulo: 'Português — Bloco II',   url: 'https://youtu.be/59hHpqzHPlY', disciplina: 'Português',  descricao: 'Videoaula do Bloco II de Português. Aprofundamento dos conteúdos gramaticais e de interpretação textual.' },
  { titulo: 'Português — Bloco III',  url: 'https://youtu.be/vazlMW1g6Yw', disciplina: 'Português',  descricao: 'Videoaula do Bloco III de Português. Exercícios práticos e revisão dos conteúdos anteriores.' },
  { titulo: 'Português — Bloco IV',   url: 'https://youtu.be/lDaUT7_Eieo', disciplina: 'Português',  descricao: 'Videoaula do Bloco IV de Português. Técnicas avançadas de redação e coerência textual.' },
  { titulo: 'Português — Bloco V',    url: 'https://youtu.be/oYlFheLW9TA', disciplina: 'Português',  descricao: 'Videoaula do Bloco V de Português. Revisão geral e simulado orientado para os pontos mais cobrados.' },
  { titulo: 'Português — Bloco VI',   url: 'https://youtu.be/teKPWKqT0RU', disciplina: 'Português',  descricao: 'Videoaula do Bloco VI de Português. Consolidação do aprendizado com resolução de provas anteriores.' },
  { titulo: 'Português — Bloco VII',  url: 'https://youtu.be/dcs04w2unCc', disciplina: 'Português',  descricao: 'Videoaula do Bloco VII de Português. Foco em questões de alta dificuldade e estratégias de prova.' },
  { titulo: 'Português — Bloco VIII', url: 'https://youtu.be/yIqn6pcZ9Gg', disciplina: 'Português',  descricao: 'Videoaula do Bloco VIII de Português. Últimas revisões e dicas finais para a prova do CMT.' },
  { titulo: 'Português — Bloco IX',   url: 'https://youtu.be/fu7uyj9BW0o', disciplina: 'Português',  descricao: 'Videoaula do Bloco IX de Português. Simulação completa de prova comentada pelo professor.' },
  { titulo: 'Português — Bloco X',    url: 'https://youtu.be/dtMfLbctFAs', disciplina: 'Português',  descricao: 'Videoaula do Bloco X de Português. Encerramento do módulo com correção de erros frequentes e gabarito.' },
  // Matemática
  { titulo: 'Matemática — Bloco I',    url: 'https://youtu.be/Ev5Ujh18DUA', disciplina: 'Matemática', descricao: 'Videoaula do Bloco I de Matemática. Fundamentos aritméticos e operações básicas com foco no CMT.' },
  { titulo: 'Matemática — Bloco II',   url: 'https://youtu.be/4H_ff4BENjM', disciplina: 'Matemática', descricao: 'Videoaula do Bloco II de Matemática. Frações, decimais e porcentagem aplicados à resolução de problemas.' },
  { titulo: 'Matemática — Bloco III',  url: 'https://youtu.be/c4I9MsA6Lnc', disciplina: 'Matemática', descricao: 'Videoaula do Bloco III de Matemática. Geometria plana e cálculo de áreas e perímetros.' },
  { titulo: 'Matemática — Bloco IV',   url: 'https://youtu.be/MYUI2xgrw2s', disciplina: 'Matemática', descricao: 'Videoaula do Bloco IV de Matemática. Grandezas e medidas, conversão de unidades e problemas contextualizados.' },
  { titulo: 'Matemática — Bloco V',    url: 'https://youtu.be/RSFxSTTSuPk', disciplina: 'Matemática', descricao: 'Videoaula do Bloco V de Matemática. Raciocínio lógico, sequências e padrões numéricos.' },
  { titulo: 'Matemática — Bloco VI',   url: 'https://youtu.be/zLwlEAANifQ', disciplina: 'Matemática', descricao: 'Videoaula do Bloco VI de Matemática. Álgebra introdutória: equações e expressões algébricas.' },
  { titulo: 'Matemática — Bloco VII',  url: 'https://youtu.be/dcs04w2unCc', disciplina: 'Matemática', descricao: 'Videoaula do Bloco VII de Matemática. ATENÇÃO: URL pendente de atualização pelo administrador no painel.' },
  { titulo: 'Matemática — Bloco VIII', url: 'https://youtu.be/yWXeCXfJNvQ', disciplina: 'Matemática', descricao: 'Videoaula do Bloco VIII de Matemática. Estatística básica: média, moda e mediana.' },
  { titulo: 'Matemática — Bloco IX',   url: 'https://youtu.be/KNnHV83xW3g', disciplina: 'Matemática', descricao: 'Videoaula do Bloco IX de Matemática. Revisão geral e resolução de questões de provas anteriores do CMT.' },
  { titulo: 'Matemática — Bloco X',    url: 'https://youtu.be/TXPgGFWLShw', disciplina: 'Matemática', descricao: 'Videoaula do Bloco X de Matemática. Encerramento do módulo com simulação completa e gabarito comentado.' },
];

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── 1. Wipe videoaulas antigas ──────────────────────────────────────
    const del = await client.query("DELETE FROM conteudos_midia WHERE tipo_conteudo = 'videoaula'");
    console.log(`🗑️  ${del.rowCount} videoaula(s) antigas removidas.`);

    // ── 2. Busca turmas pre_cmt_5 ───────────────────────────────────────
    const turmasRes = await client.query("SELECT id, nome FROM turmas WHERE acompanhamento = 'pre_cmt_5'");
    const turmas = turmasRes.rows;
    if (turmas.length === 0) {
      throw new Error('Nenhuma turma Pré-CMT 5º Ano encontrada! Verifique a coluna acompanhamento na tabela turmas.');
    }
    console.log(`🏫 ${turmas.length} turma(s) encontrada(s): ${turmas.map(t => t.nome).join(', ')}`);

    // ── 3. Insere vídeos em cada turma ──────────────────────────────────
    let total = 0;
    for (const turma of turmas) {
      for (const v of videos) {
        await client.query(
          `INSERT INTO conteudos_midia (id, turma_id, tipo_conteudo, titulo, descricao, url_acesso, disciplina, status, created_at)
           VALUES (gen_random_uuid(), $1, 'videoaula', $2, $3, $4, $5, TRUE, NOW())`,
          [turma.id, v.titulo, v.descricao, v.url, v.disciplina]
        );
        total++;
      }
    }

    // ── 4. Garante que Prof. Romildo existe ─────────────────────────────
    await client.query(
      `INSERT INTO professores (nome, email, status)
       VALUES ('Prof. Romildo', 'romildo@nota10.edu.br', 'ativo')
       ON CONFLICT (email) DO UPDATE SET nome = EXCLUDED.nome, status = 'ativo'`
    );
    console.log('👤 Prof. Romildo garantido no banco.');

    await client.query('COMMIT');

    // ── 5. Verificação ───────────────────────────────────────────────────
    console.log(`\n✅ Migração concluída! ${total} videoaulas inseridas.\n`);

    const summary = await client.query(
      `SELECT disciplina, COUNT(*) as total
       FROM conteudos_midia WHERE tipo_conteudo = 'videoaula'
       GROUP BY disciplina ORDER BY disciplina`
    );
    console.log('📊 Vídeos por disciplina (total geral):');
    summary.rows.forEach(r => console.log(`   ${r.disciplina}: ${r.total}`));

    const byTurma = await client.query(
      `SELECT t.nome, COUNT(c.id) as total
       FROM turmas t JOIN conteudos_midia c ON c.turma_id = t.id AND c.tipo_conteudo = 'videoaula'
       WHERE t.acompanhamento = 'pre_cmt_5'
       GROUP BY t.nome ORDER BY t.nome`
    );
    console.log('\n🏫 Vídeos por turma:');
    byTurma.rows.forEach(r => console.log(`   ${r.nome}: ${r.total} vídeos`));

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migração falhou (ROLLBACK executado):', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

run();
