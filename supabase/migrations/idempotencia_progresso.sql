-- ══════════════════════════════════════════════════════════════
-- MIGRAÇÃO: Idempotência no Progresso do Aluno
-- Data: 2026-07-15
-- Problema: sem UNIQUE constraint em (aluno_id, atividade_id),
--           duas requisições paralelas podiam inserir duplicatas.
-- ══════════════════════════════════════════════════════════════

-- 1. Remover duplicatas existentes (mantém o registro mais antigo)
DELETE FROM aluno_progresso
WHERE id NOT IN (
  SELECT DISTINCT ON (aluno_id, atividade_id) id
  FROM aluno_progresso
  WHERE atividade_id IS NOT NULL
  ORDER BY aluno_id, atividade_id, created_at ASC
)
AND atividade_id IS NOT NULL;

-- 2. Adicionar constraint UNIQUE parcial somente onde atividade_id não é NULL
--    (permite múltiplos registros sem atividade_id, ex: XP de ações genéricas)
CREATE UNIQUE INDEX IF NOT EXISTS idx_progresso_aluno_atividade_unique
  ON aluno_progresso (aluno_id, atividade_id)
  WHERE atividade_id IS NOT NULL;
