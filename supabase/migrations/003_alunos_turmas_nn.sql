-- MIGRAÇÃO PARA RELAÇÃO N:N ENTRE ALUNOS E TURMAS E SALDO DE XP GLOBAL
BEGIN;

-- 1. Criar a nova tabela pivô 'matriculas'
CREATE TABLE IF NOT EXISTS matriculas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_aluno_turma UNIQUE(aluno_id, turma_id)
);

-- 2. Migrar os dados de turmas e status atuais da tabela alunos para matriculas
INSERT INTO matriculas (aluno_id, turma_id, status)
SELECT id, turma_id, status
FROM alunos
WHERE turma_id IS NOT NULL
ON CONFLICT (aluno_id, turma_id) DO NOTHING;

-- 3. Limpar colunas redundantes na tabela alunos
ALTER TABLE alunos DROP COLUMN IF EXISTS turma_id;
ALTER TABLE alunos DROP COLUMN IF EXISTS turma_nome;
ALTER TABLE alunos DROP COLUMN IF EXISTS status;

COMMIT;
