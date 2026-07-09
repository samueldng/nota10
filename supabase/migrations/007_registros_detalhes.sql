-- ═══════════════════════════════════════════════════════════════════════
-- MIGRAÇÃO 007: Tabela de Detalhes do Registro de Alunos
-- Cria a tabela 1:N que vincula cada aluno avaliado a um registro_lancado.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS registro_alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_id INTEGER NOT NULL REFERENCES registros_lancados(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  
  -- Campos baseados na interface de lançamento do Lançar Registro
  presenca VARCHAR(50) NOT NULL,
  video VARCHAR(50),
  palavra_chave VARCHAR(50),
  fixacao VARCHAR(50),
  praticar VARCHAR(50),
  atencao VARCHAR(50),
  participacao INTEGER,
  comportamento INTEGER,
  pontualidade VARCHAR(50),
  observacao TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para otimização de relatórios
CREATE INDEX IF NOT EXISTS idx_registro_alunos_registro_id ON registro_alunos(registro_id);
CREATE INDEX IF NOT EXISTS idx_registro_alunos_aluno_id ON registro_alunos(aluno_id);

COMMIT;
