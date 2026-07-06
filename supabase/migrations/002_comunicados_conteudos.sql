-- MIGRAÇÃO: Comunicados e Conteúdos de Mídia
-- Execute este script no PostgreSQL da VPS para criar as novas tabelas.
-- Compatível com execução idempotente (IF NOT EXISTS).

-- ═══════════════════════════════════════════════════════════════════════
-- 1. COMUNICADOS (turma_id NULL = comunicado global visível para todos)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS comunicados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID REFERENCES turmas(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  tipo_criticidade VARCHAR(50) NOT NULL,
  descricao TEXT NOT NULL,
  data_publicacao DATE NOT NULL,
  status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comunicados_turma ON comunicados (turma_id);
CREATE INDEX IF NOT EXISTS idx_comunicados_tipo ON comunicados (tipo_criticidade);

-- ═══════════════════════════════════════════════════════════════════════
-- 2. CONTEÚDOS DE MÍDIA (Unificação: videoaula, pdf, simulado)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS conteudos_midia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  tipo_conteudo VARCHAR(50) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  url_acesso VARCHAR(512) NOT NULL,
  disciplina VARCHAR(100),
  data_disponibilizacao DATE,
  status BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conteudos_turma ON conteudos_midia (turma_id);
CREATE INDEX IF NOT EXISTS idx_conteudos_tipo ON conteudos_midia (tipo_conteudo);
CREATE INDEX IF NOT EXISTS idx_conteudos_turma_tipo ON conteudos_midia (turma_id, tipo_conteudo);

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO
-- ═══════════════════════════════════════════════════════════════════════

SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('comunicados', 'conteudos_midia')
ORDER BY table_name;
