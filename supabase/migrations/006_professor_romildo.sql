-- ═══════════════════════════════════════════════════════════════════════
-- MIGRAÇÃO 006: Garantir cadastro do Prof. Romildo no banco de dados
-- Execute este script na VPS para garantir que o professor esteja ativo.
-- Idempotente: usa INSERT ... ON CONFLICT DO NOTHING
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- Garante unicidade por email antes do insert
INSERT INTO professores (nome, email, status)
VALUES ('Prof. Romildo', 'romildo@nota10.edu.br', 'ativo')
ON CONFLICT (email) DO UPDATE SET
  nome   = EXCLUDED.nome,
  status = 'ativo';

-- Verificação
SELECT id, nome, email, status
FROM professores
WHERE email = 'romildo@nota10.edu.br';

COMMIT;
