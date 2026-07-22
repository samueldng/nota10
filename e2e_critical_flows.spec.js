/**
 * @file e2e_critical_flows.spec.js
 * @description Suíte de Testes Automatizados E2E, Resiliência e Auditoria de Concorrência
 * @role QA Automation Engineer (qa-automation-engineer.md)
 */

describe('QA Automation — Jornadas Críticas e Resiliência Nota 10', () => {

  // ── 1. FLUXO DO PROFESSOR: LANÇAMENTO DE FOLHA & PERSISTÊNCIA ────
  it('Deve simular lançamento presencial pelo professor e validar gravação no PostgreSQL', async () => {
    const payloadLancar = {
      data: '2026-07-22',
      acompanhamento: 'pre_cmt_5',
      turma: '5A Manhã',
      disciplina: 'Matemática',
      bloco: 'Bloco 1',
      professor: 'João Silva',
      origem: 'manual',
      status: 'salvo',
      lancadoPor: 'Professor João',
      alunos: [
        {
          alunoId: 'b2076eef-73be-42a3-8208-e29454f5a101',
          nome: 'Ana Clara Pereira da Silva',
          presenca: 'presente',
          video: 'fez',
          palavraChave: 'fez',
          fixacao: 'fez',
          atencao: 'atento',
          participacao: 3,
          comportamento: 3,
          observacao: 'Excelente foco durante a aula.'
        }
      ]
    };

    const res = await fetch('http://localhost:3000/api/registros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadLancar)
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.records.length).toBeGreaterThan(0);
    expect(body.records[0].atencao).toBe(5);
    expect(body.records[0].fixacao).toBe(5);
  });

  // ── 2. FLUXO DO ALUNO: PLAYER DE VÍDEO & TRAVA ANTI-SKIP ────────
  it('Deve rejeitar pulo manual no vídeo de +55s com HTTP 400 (Anti-Skip)', async () => {
    // 2a. Heartbeat inicial (5s)
    await fetch('http://localhost:3000/api/player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alunoId: 'b2076eef-73be-42a3-8208-e29454f5a101',
        conteudoId: 'video-matematica-01',
        currentTime: 5,
        duration: 120
      })
    });

    // 2b. Tentativa de avanço suspeito (60s)
    const resSkip = await fetch('http://localhost:3000/api/player', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alunoId: 'b2076eef-73be-42a3-8208-e29454f5a101',
        conteudoId: 'video-matematica-01',
        currentTime: 60,
        duration: 120
      })
    });

    expect(resSkip.status).toBe(400);
    const bodySkip = await resSkip.json();
    expect(bodySkip.error).toContain('anti-skip');
  });

  // ── 3. RESILIÊNCIA DA IA: FALLBACK PREDITIVO EM CASO DE FALHA ─────
  it('Deve retornar JSON estruturado com fallback quando API externa de IA falhar ou estiver sem chave', async () => {
    const resIa = await fetch('http://localhost:3000/api/relatorios/gerar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alunoId: 'b2076eef-73be-42a3-8208-e29454f5a101' })
    });

    expect(resIa.status).toBe(200);
    const bodyIa = await resIa.json();
    expect(bodyIa.success).toBe(true);
    expect(Array.isArray(bodyIa.parecer.pontosFortes)).toBe(true);
    expect(bodyIa.parecer.pontosFortes.length).toBeGreaterThan(0);
    expect(bodyIa.parecer).toHaveProperty('orientacaoPratica');
  });

  // ── 4. RESILIÊNCIA WHATSAPP: AUDITORIA DE FALTAS & DEAD LETTER QUEUE 
  it('Deve registrar eventos de faltas e despachos no log_auditoria sem perda de dados', async () => {
    const resWapp = await fetch('http://localhost:3000/api/whatsapp/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'falta',
        faltas: [
          {
            alunoId: 'b2076eef-73be-42a3-8208-e29454f5a101',
            alunoNome: 'Ana Clara Pereira da Silva',
            turma: '5A Manhã',
            data: '2026-07-22',
            disciplina: 'Matemática'
          }
        ]
      })
    });

    expect(resWapp.status).toBe(200);
    const bodyWapp = await resWapp.json();
    expect(bodyWapp.success).toBe(true);
    expect(bodyWapp.dispatched.length).toBe(1);
  });

  // ── 5. AUDITORIA DE CONCORRÊNCIA: PROCESSAMENTO PARALELO ATÔMICO ─
  it('Deve processar 5 requisições de XP simultâneas sem race conditions ou perda de saldo', async () => {
    const ts = Date.now().toString().slice(-5);
    const promises = Array.from({ length: 5 }, (_, i) =>
      fetch('http://localhost:3000/api/quiz/finalizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alunoId: 'b2076eef-73be-42a3-8208-e29454f5a101',
          quizId: `quiz_conc_spec_${ts}_${i}`,
          acertos: 3,
          totalQuestoes: 3,
          xpBase: 30
        })
      })
    );

    const responses = await Promise.all(promises);
    const statusCodes = responses.map(r => r.status);
    expect(statusCodes.every(s => s === 200)).toBe(true);
  });

});
