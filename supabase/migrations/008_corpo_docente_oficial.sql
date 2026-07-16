-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRAÇÃO 008: Corpo Docente Oficial — Brennda, Rafaella e Bruna
-- Idempotente: ON CONFLICT (email) DO NOTHING
-- Professores existentes (Romildo, mock) são preservados intactos.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Adicionar colunas de detalhe ao perfil do professor (se ainda não existirem) ─
ALTER TABLE professores ADD COLUMN IF NOT EXISTS telefone     TEXT;
ALTER TABLE professores ADD COLUMN IF NOT EXISTS especialidade TEXT;
ALTER TABLE professores ADD COLUMN IF NOT EXISTS descricao    TEXT;

-- ── Inserir professoras ────────────────────────────────────────────────────────
INSERT INTO professores (nome, email, status, telefone, especialidade, descricao)
VALUES
  (
    'Brennda Larissa',
    'brenndalarissafp00@gmail.com',
    'ativo',
    '(99) 98241-6688',
    'Matemática',
    'Reforço (Tarde), Elite, Projeto e Pré CMT'
  ),
  (
    'Rafaella Miranda',
    'bruninharaf3@gmail.com',
    'ativo',
    '(99) 98255-5898',
    'Português e Multidisciplinar (Reforço)',
    'Reforço (Manhã e Tarde), Projeto, Pré CMT'
  ),
  (
    'Bruna Cavalcante',
    'blfp0901@gmail.com',
    'ativo',
    '(99) 98105-3472',
    'Português',
    'Pré CMT — turmas regulares'
  )
ON CONFLICT (email) DO NOTHING;

-- ── Vínculos de turma: Brennda Larissa → Reforço Geral ───────────────────────
INSERT INTO turma_professores (turma_id, professor_id)
SELECT t.id, p.id
FROM turmas t, professores p
WHERE t.nome = 'Reforço Geral'
  AND p.email = 'brenndalarissafp00@gmail.com'
ON CONFLICT (turma_id, professor_id) DO NOTHING;

-- ── Vínculos de turma: Rafaella Miranda → Reforço Geral ──────────────────────
INSERT INTO turma_professores (turma_id, professor_id)
SELECT t.id, p.id
FROM turmas t, professores p
WHERE t.nome = 'Reforço Geral'
  AND p.email = 'bruninharaf3@gmail.com'
ON CONFLICT (turma_id, professor_id) DO NOTHING;

-- ── Vínculos de turma: Bruna Cavalcante → turmas regulares ───────────────────
INSERT INTO turma_professores (turma_id, professor_id)
SELECT t.id, p.id
FROM turmas t, professores p
WHERE t.nome IN ('4A Manhã', '4B Tarde', '5A Manhã', '5B Tarde', '5C Manhã')
  AND p.email = 'blfp0901@gmail.com'
ON CONFLICT (turma_id, professor_id) DO NOTHING;

-- ── Verificação final ─────────────────────────────────────────────────────────
SELECT p.nome, p.email, p.status, p.especialidade,
       COUNT(tp.turma_id) AS turmas_vinculadas
FROM professores p
LEFT JOIN turma_professores tp ON p.id = tp.professor_id
WHERE p.email IN (
  'brenndalarissafp00@gmail.com',
  'bruninharaf3@gmail.com',
  'blfp0901@gmail.com'
)
GROUP BY p.id, p.nome, p.email, p.status, p.especialidade
ORDER BY p.nome;

COMMIT;
