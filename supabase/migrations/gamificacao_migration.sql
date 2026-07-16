-- ══════════════════════════════════════════════════════════════
-- MIGRAÇÃO: Gamificação Definitiva (localStorage → PostgreSQL)
-- Data: 2026-07-06
-- ══════════════════════════════════════════════════════════════

-- 1. Nova tabela: Registro de progresso individual do aluno
CREATE TABLE IF NOT EXISTS aluno_progresso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  atividade_id VARCHAR(150),
  tipo_acao VARCHAR(50) NOT NULL,  -- 'videoaula', 'simulado', 'revisao', 'fixacao', 'aula_presencial', etc.
  xp_ganho INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_progresso_aluno ON aluno_progresso (aluno_id);
CREATE INDEX IF NOT EXISTS idx_progresso_atividade ON aluno_progresso (atividade_id);
CREATE INDEX IF NOT EXISTS idx_progresso_tipo ON aluno_progresso (tipo_acao);

-- 2. Novas colunas na tabela alunos para gamificação
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS xp_total INT DEFAULT 0;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS nivel INT DEFAULT 1;
