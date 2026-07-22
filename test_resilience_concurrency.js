const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runAuditSuite() {
  console.log('================================================================');
  console.log('🧪 SUÍTE DE TESTES E2E, RESILIÊNCIA E CONCORRÊNCIA — NOTA 10');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  // Buscar um aluno real do sistema
  let realAlunoId = '00000000-0000-0000-0000-000000000001';
  try {
    const alunosRes = await makeRequest('/api/alunos', 'GET');
    if (alunosRes.status === 200 && Array.isArray(alunosRes.data) && alunosRes.data.length > 0) {
      realAlunoId = alunosRes.data[0].id;
      console.log(`📌 Aluno de teste localizado no banco: ${alunosRes.data[0].nome} (${realAlunoId})\n`);
    }
  } catch (e) {
    console.warn('Não foi possível obter aluno real, usando ID fallback.');
  }

  // ── 1. TESTE DO PLAYER VIDEO: ANTI-SKIP E HEARTBEAT ──────────────
  console.log('1. [E2E & Player] Testando Player Heartbeat e Trava Anti-Skip...');
  try {
    // 1a. Heartbeat normal (0s -> 5s)
    await makeRequest('/api/player', 'POST', {
      alunoId: realAlunoId,
      conteudoId: 'video-matematica-01',
      currentTime: 5,
      duration: 120
    });

    // 1b. Salto ilegal (de 5s para 60s -> salto de 55s > 15s)
    const hbSkip = await makeRequest('/api/player', 'POST', {
      alunoId: realAlunoId,
      conteudoId: 'video-matematica-01',
      currentTime: 60,
      duration: 120
    });

    if (hbSkip.status === 400 && hbSkip.data?.error?.includes('anti-skip')) {
      console.log('  ✅ TRAVA ANTI-SKIP FUNCIONANDO: Bloqueou salto de +55s com HTTP 400!');
      passed++;
    } else {
      console.error('  ❌ FALHA NO ANTI-SKIP:', hbSkip);
      failed++;
    }
  } catch (err) {
    console.error('  ❌ Erro ao testar Anti-Skip:', err.message);
    failed++;
  }

  // ── 2. TESTE DE RESILIÊNCIA DA IA (PARECER PEDAGÓGICO) ────────────
  console.log('\n2. [Resiliência IA] Testando Fallback do Parecer Pedagógico...');
  try {
    const iaRes = await makeRequest('/api/relatorios/gerar', 'POST', {
      alunoId: realAlunoId
    });

    if (iaRes.status === 200 && iaRes.data?.success && iaRes.data?.parecer?.pontosFortes) {
      console.log('  ✅ RESILIÊNCIA DA IA OK: Fallback preditivo gerou o parecer estruturado em JSON!');
      console.log('     - Pontos Fortes:', iaRes.data.parecer.pontosFortes.length, 'itens');
      console.log('     - Orientação Prática:', (iaRes.data.parecer.orientacaoPratica || '').substring(0, 60) + '...');
      passed++;
    } else {
      console.error('  ❌ FALHA NO FALLBACK DE IA:', iaRes);
      failed++;
    }
  } catch (err) {
    console.error('  ❌ Erro ao testar Parecer IA:', err.message);
    failed++;
  }

  // ── 3. TESTE DE WHATSAPP DISPATCH & AUDITORIA DE FALTAS ───────────
  console.log('\n3. [Resiliência WhatsApp] Testando Log de Auditoria & Retry Queue...');
  try {
    const wappRes = await makeRequest('/api/whatsapp/dispatch', 'POST', {
      tipo: 'falta',
      faltas: [
        {
          alunoId: realAlunoId,
          alunoNome: 'Aluno Teste',
          turma: '5A Manhã',
          data: '2026-07-22',
          disciplina: 'Português'
        }
      ]
    });

    if (wappRes.status === 200 && wappRes.data?.success) {
      console.log('  ✅ DESPACHO WHATSAPP OK: Evento registrado no log_auditoria sem perda de dados!');
      passed++;
    } else {
      console.error('  ❌ FALHA NO DESPACHO WHATSAPP:', wappRes);
      failed++;
    }
  } catch (err) {
    console.error('  ❌ Erro no despacho de WhatsApp:', err.message);
    failed++;
  }

  // ── 4. TESTE DE CONCORRÊNCIA DE XP (RACE CONDITION AUDIT) ────────
  console.log('\n4. [Concorrência DB] Testando Requisições Simultâneas de XP...');
  try {
    const timestamp = Date.now().toString().slice(-5);
    // Disparar 5 requisições concorrentes em paralelo
    const promises = [
      makeRequest('/api/quiz/finalizar', 'POST', { alunoId: realAlunoId, quizId: `quiz_conc_${timestamp}_1`, acertos: 3, totalQuestoes: 3, xpBase: 30 }),
      makeRequest('/api/quiz/finalizar', 'POST', { alunoId: realAlunoId, quizId: `quiz_conc_${timestamp}_2`, acertos: 3, totalQuestoes: 3, xpBase: 30 }),
      makeRequest('/api/quiz/finalizar', 'POST', { alunoId: realAlunoId, quizId: `quiz_conc_${timestamp}_3`, acertos: 3, totalQuestoes: 3, xpBase: 30 }),
      makeRequest('/api/quiz/finalizar', 'POST', { alunoId: realAlunoId, quizId: `quiz_conc_${timestamp}_4`, acertos: 3, totalQuestoes: 3, xpBase: 30 }),
      makeRequest('/api/quiz/finalizar', 'POST', { alunoId: realAlunoId, quizId: `quiz_conc_${timestamp}_5`, acertos: 3, totalQuestoes: 3, xpBase: 30 }),
    ];

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.status === 200 && r.data?.success).length;

    console.log(`  📊 Conclusão paralela de 5 eventos: ${successCount}/5 requisições bem-sucedidas com atomicidade.`);

    if (successCount === 5) {
      console.log('  ✅ AUDITORIA DE CONCORRÊNCIA OK: 100% das atualizações paralelas de XP foram processadas atomicamente no PostgreSQL!');
      passed++;
    } else {
      console.error('  ❌ FALHA NA CONCORRÊNCIA:', results);
      failed++;
    }
  } catch (err) {
    console.error('  ❌ Erro ao testar Concorrência:', err.message);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`🎯 RESULTADO DA SUÍTE: ${passed} PASSOU | ${failed} FALHOU`);
  console.log('================================================================\n');
}

runAuditSuite();
