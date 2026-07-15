-- ════════════════════════════════════════════════════════════════════════════════
-- LIMPEZA DE ACESSOS — NOTA 10 EDUCACIONAL
-- Remove todos os professores fictícios gerados pelo mockData e garante que
-- apenas dois acessos primários existam na tabela `professores`:
--   1. Admin do sistema
--   2. Romildo Cavalcante (dono do projeto)
-- ════════════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── Passo 1: Limpar toda a tabela de professores (respeita FKs via CASCADE) ────
-- A tabela turma_professores tem ON DELETE CASCADE, então os vínculos
-- são removidos automaticamente.
DELETE FROM turma_professores;
DELETE FROM professores;

-- ── Passo 2: Inserir os dois acessos primários oficiais ───────────────────────
INSERT INTO professores (nome, email, status) VALUES
  ('Admin',              'admin@nota10.edu.br',    'ativo'),
  ('Romildo Cavalcante', 'romildo@nota10.edu.br',  'ativo');

-- ── Passo 3: Verificação ──────────────────────────────────────────────────────
SELECT id, nome, email, status FROM professores ORDER BY nome;

COMMIT;

-- ════════════════════════════════════════════════════════════════════════════════
-- INSTRUÇÕES DE EXECUÇÃO
-- Execute este script diretamente no banco PostgreSQL da VPS:
--   psql -h <HOST> -U <USER> -d <DATABASE> -f limpeza_professores.sql
-- Ou cole o conteúdo no painel do pgAdmin / DBeaver.
-- ════════════════════════════════════════════════════════════════════════════════
