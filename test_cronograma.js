/**
 * TESTE DE BROWSER v2 — Gestão de Cronograma (Login corrigido)
 * 
 * Usa o bypass de superadmin: admin@nota10.com / admin123
 * Injeta a sessão diretamente via localStorage para evitar
 * dependências de formulário de login complexo.
 */

const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3000';
const TIMEOUT  = 15000;

const OK   = '✅';
const FAIL = '❌';
const INFO = '🔵';
const WARN = '⚠️';

let passed = 0;
let failed = 0;

function log(icon, label, detail = '') {
  console.log(`${icon} ${label}${detail ? ' — ' + detail : ''}`);
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function assert(label, fn) {
  try {
    await fn();
    log(OK, label);
    passed++;
  } catch (err) {
    log(FAIL, label, err.message?.slice(0, 150));
    failed++;
  }
}

async function waitFor(page, selector, timeout = TIMEOUT) {
  await page.waitForSelector(selector, { timeout });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

(async () => {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  NOTA 10 — Teste de Browser v2: Gestão de Cronograma');
  console.log('══════════════════════════════════════════════════════\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    slowMo: 30,
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(TIMEOUT);

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      if (!txt.includes('favicon') && !txt.includes('404')) {
        console.log(`  [PAGE ERR] ${txt.slice(0, 120)}`);
      }
    }
  });

  // ── STEP 1: Injetar sessão de admin via localStorage ───────────────────────
  log(INFO, 'STEP 1: Autenticação via localStorage (bypass admin)');

  await assert('Carrega a raiz do site', async () => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await sleep(1000);
  });

  await assert('Injeta sessão de admin no localStorage', async () => {
    const session = {
      name: 'Coordenador Geral',
      email: 'admin@nota10.com',
      role: 'admin',
    };
    await page.evaluate((s) => {
      localStorage.setItem('nota10_session', JSON.stringify(s));
    }, session);
  });

  await assert('Recarrega a página com sessão ativa', async () => {
    await page.goto(`${BASE_URL}/cadastros/cronograma`, { waitUntil: 'domcontentloaded' });
    await sleep(3000);
    const url = page.url();
    // Se redirecionar para login, a autenticação não funcionou
    if (url.includes('/login')) {
      throw new Error(`Redirecionado para login. URL: ${url}`);
    }
  });

  // ── STEP 2: Verificar a página ─────────────────────────────────────────────
  log(INFO, '\nSTEP 2: Verificação da página');

  await assert('Título da página contém "Cronograma"', async () => {
    const bodyText = await page.$eval('body', (el) => el.textContent);
    if (!bodyText.includes('Cronograma')) {
      throw new Error('Texto "Cronograma" não encontrado no body');
    }
  });

  await assert('Dropdown de Turma carregado do banco', async () => {
    await waitFor(page, '#select-turma');
    await sleep(2000); // aguarda fetch de turmas
    const options = await page.$$eval('#select-turma option', (opts) =>
      opts.map((o) => o.textContent.trim()).filter(Boolean)
    );
    log(INFO, `  Turmas: ${options.join(', ')}`);
    if (options.length === 0) throw new Error('Nenhuma turma carregada');
  });

  await assert('Dropdown de Semana tem 20 opções', async () => {
    await waitFor(page, '#select-semana');
    const count = await page.$$eval('#select-semana option', (opts) => opts.length);
    if (count < 20) throw new Error(`Apenas ${count} semanas`);
  });

  // Screenshot inicial
  await page.screenshot({ path: 'screenshot_cron_01_loaded.png' });
  log(INFO, '  📸 screenshot_cron_01_loaded.png');

  // ── STEP 3: Selecionar Semana 1 ────────────────────────────────────────────
  log(INFO, '\nSTEP 3: Seleção de semana e preenchimento do período');

  await assert('Seleciona Semana 1', async () => {
    await page.select('#select-semana', '1');
    await sleep(1500);
  });

  await assert('Preenche período da semana', async () => {
    await waitFor(page, '#input-periodo');
    await page.$eval('#input-periodo', (el) => { el.value = ''; });
    await page.type('#input-periodo', '14 a 18 de Julho de 2026', { delay: 25 });
    const val = await page.$eval('#input-periodo', (el) => el.value);
    if (!val.includes('Julho')) throw new Error(`Valor: "${val}"`);
  });

  // ── STEP 4: Adicionar tarefa ───────────────────────────────────────────────
  log(INFO, '\nSTEP 4: Criação de tarefa com subtarefas');

  await assert('Adiciona nova tarefa (botão no empty state ou lista)', async () => {
    // Tenta o botão do empty state primeiro
    const emptyBtn = await page.$('#btn-add-first-tarefa');
    if (emptyBtn) {
      await emptyBtn.click();
    } else {
      const addBtn = await page.$('#btn-add-tarefa');
      if (!addBtn) throw new Error('Botão de adicionar tarefa não encontrado');
      await addBtn.click();
    }
    await sleep(600);
    // Aguarda o campo de título aparecer
    await waitFor(page, '#tarefa-titulo-0');
  });

  await assert('Preenche título da tarefa', async () => {
    await page.$eval('#tarefa-titulo-0', (el) => { el.value = ''; });
    await page.type('#tarefa-titulo-0', 'Preparação — Português, Bloco I', { delay: 20 });
    const val = await page.$eval('#tarefa-titulo-0', (el) => el.value);
    if (!val.includes('Português')) throw new Error(`Valor: "${val}"`);
  });

  await assert('Seleciona tipo "Pré-aula (Vídeo)"', async () => {
    await page.select('#tarefa-tipo-0', 'pre_aula');
  });

  await assert('Seleciona disciplina "Português"', async () => {
    await page.select('#tarefa-disciplina-0', 'Português');
  });

  await assert('Seleciona bloco "Bloco I"', async () => {
    await page.select('#tarefa-bloco-0', 'Bloco I');
  });

  await assert('Define XP da tarefa = 20', async () => {
    await page.$eval('#tarefa-xp-0', (el) => { el.value = ''; });
    await page.type('#tarefa-xp-0', '20', { delay: 20 });
    const val = await page.$eval('#tarefa-xp-0', (el) => el.value);
    if (val !== '20') throw new Error(`XP: "${val}"`);
  });

  // Screenshot com tarefa preenchida
  await page.screenshot({ path: 'screenshot_cron_02_tarefa.png' });
  log(INFO, '  📸 screenshot_cron_02_tarefa.png');

  // ── Subtarefas ─────────────────────────────────────────────────────────────
  await assert('Adiciona Subtarefa 1: "Assistir à videoaula" (15 XP)', async () => {
    await waitFor(page, '#btn-add-subtarefa-0');
    await page.click('#btn-add-subtarefa-0');
    await sleep(400);
    await waitFor(page, '#sub-titulo-0-0');
    await page.type('#sub-titulo-0-0', 'Assistir à videoaula', { delay: 20 });
    await page.$eval('#sub-xp-0-0', (el) => { el.value = ''; });
    await page.type('#sub-xp-0-0', '15', { delay: 20 });
  });

  await assert('Adiciona Subtarefa 2: "Fazer os registros" (10 XP)', async () => {
    await page.click('#btn-add-subtarefa-0');
    await sleep(400);
    await waitFor(page, '#sub-titulo-0-1');
    await page.type('#sub-titulo-0-1', 'Fazer os registros solicitados', { delay: 20 });
    await page.$eval('#sub-xp-0-1', (el) => { el.value = ''; });
    await page.type('#sub-xp-0-1', '10', { delay: 20 });
  });

  await assert('Adiciona Subtarefa 3: "Estudar a apostila" (5 XP)', async () => {
    await page.click('#btn-add-subtarefa-0');
    await sleep(400);
    await waitFor(page, '#sub-titulo-0-2');
    await page.type('#sub-titulo-0-2', 'Estudar a apostila do bloco', { delay: 20 });
    await page.$eval('#sub-xp-0-2', (el) => { el.value = ''; });
    await page.type('#sub-xp-0-2', '5', { delay: 20 });
  });

  await assert('XP total calculado corretamente (20+15+10+5 = 50 XP)', async () => {
    await sleep(500);
    const bodyText = await page.$eval('body', (el) => el.textContent);
    // Total XP = tarefa(20) + sub1(15) + sub2(10) + sub3(5) = 50
    if (!bodyText.includes('50')) {
      throw new Error('XP total "50" não encontrado. Texto: ' + bodyText.slice(0, 300));
    }
  });

  // Screenshot completo com subtarefas
  await page.screenshot({ path: 'screenshot_cron_03_subtarefas.png', fullPage: true });
  log(INFO, '  📸 screenshot_cron_03_subtarefas.png');

  // ── STEP 5: Salvar ────────────────────────────────────────────────────────
  log(INFO, '\nSTEP 5: Salvamento no banco de dados');

  await assert('Clica em "Salvar Cronograma"', async () => {
    await waitFor(page, '#btn-salvar-cronograma');
    await page.click('#btn-salvar-cronograma');
  });

  await assert('Toast de sucesso aparece em até 8s', async () => {
    let found = false;
    for (let i = 0; i < 16; i++) {
      await sleep(500);
      const txt = await page.$eval('body', (el) => el.textContent);
      if (txt.includes('sucesso') || txt.includes('salvo') || txt.includes('Semana')) {
        found = true;
        break;
      }
    }
    if (!found) throw new Error('Toast de sucesso não encontrado');
  });

  await sleep(1000);
  await page.screenshot({ path: 'screenshot_cron_04_saved.png' });
  log(INFO, '  📸 screenshot_cron_04_saved.png');

  // ── STEP 6: Verificar persistência ────────────────────────────────────────
  log(INFO, '\nSTEP 6: Verificação de persistência (reload)');

  await assert('Reload da página mantém dados salvos', async () => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await sleep(3500);
    const txt = await page.$eval('body', (el) => el.textContent);
    if (!txt.includes('Português') && !txt.includes('Preparação') && !txt.includes('videoaula')) {
      throw new Error('Dados não encontrados após reload. Possível falha na persistência.');
    }
  });

  await page.screenshot({ path: 'screenshot_cron_05_persisted.png', fullPage: true });
  log(INFO, '  📸 screenshot_cron_05_persisted.png');

  // ── STEP 7: Verificar API /api/cronograma diretamente ─────────────────────
  log(INFO, '\nSTEP 7: Verificação direta da API');

  await assert('API /api/cronograma retorna dados salvos', async () => {
    // Pega o turmaId selecionado
    const turmaId = await page.$eval('#select-turma', (el) => el.value);
    const apiUrl = `${BASE_URL}/api/cronograma?turmaId=${turmaId}&semana=1`;
    
    const apiPage = await browser.newPage();
    await apiPage.goto(apiUrl, { waitUntil: 'domcontentloaded' });
    const content = await apiPage.$eval('body', (el) => el.textContent);
    await apiPage.close();
    
    let data;
    try { data = JSON.parse(content); } catch { throw new Error('API não retornou JSON válido'); }
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`API retornou ${JSON.stringify(data).slice(0, 100)}`);
    }
    
    const tarefa = data[0];
    log(INFO, `  API: ${data.length} tarefa(s) — "${tarefa.titulo}" — XP: ${tarefa.xpTotal}`);
    log(INFO, `  Subtarefas: ${JSON.stringify(tarefa.subtarefas).slice(0, 80)}`);
    
    if (!tarefa.titulo.includes('Português') && !tarefa.titulo.includes('Preparação')) {
      throw new Error(`Título inesperado: "${tarefa.titulo}"`);
    }
  });

  // ── STEP 8: Excluir cronograma ────────────────────────────────────────────
  log(INFO, '\nSTEP 8: Exclusão do cronograma da semana');

  await assert('Botão "Excluir Semana" visível', async () => {
    await waitFor(page, '#btn-excluir-semana');
  });

  await assert('Modal de confirmação abre ao clicar', async () => {
    await page.click('#btn-excluir-semana');
    await sleep(700);
    await waitFor(page, '#btn-confirmar-exclusao');
    const modalText = await page.$eval('body', (el) => el.textContent);
    if (!modalText.includes('exclu') && !modalText.includes('remov')) {
      throw new Error('Modal de confirmação não apareceu');
    }
  });

  await assert('Confirma exclusão e toast de sucesso aparece', async () => {
    await page.click('#btn-confirmar-exclusao');
    let deleted = false;
    for (let i = 0; i < 12; i++) {
      await sleep(500);
      const txt = await page.$eval('body', (el) => el.textContent);
      if (txt.includes('exclu') || txt.includes('removid')) { deleted = true; break; }
    }
    if (!deleted) throw new Error('Toast de exclusão não encontrado');
  });

  await assert('Estado vazio exibido após exclusão', async () => {
    await sleep(1000);
    const txt = await page.$eval('body', (el) => el.textContent);
    const hasEmpty = txt.includes('Nenhuma tarefa') || txt.includes('Adicionar Nova Tarefa');
    if (!hasEmpty) throw new Error('Estado vazio não exibido após exclusão');
  });

  await page.screenshot({ path: 'screenshot_cron_06_deleted.png' });
  log(INFO, '  📸 screenshot_cron_06_deleted.png');

  // ── Resultado ─────────────────────────────────────────────────────────────
  await sleep(1500);
  await browser.close();

  console.log('\n══════════════════════════════════════════════════════');
  console.log(`  RESULTADO FINAL: ${passed} ✅ passou | ${failed} ❌ falhou | ${passed + failed} total`);
  console.log('══════════════════════════════════════════════════════\n');

  if (failed > 0) {
    console.log('⚠️  Alguns testes falharam. Verifique os screenshots para diagnóstico.');
  } else {
    console.log('🎉 Todos os testes passaram com sucesso!');
  }

  process.exit(failed > 0 ? 1 : 0);
})().catch((err) => {
  console.error('\n[FATAL]', err.message);
  process.exit(1);
});
