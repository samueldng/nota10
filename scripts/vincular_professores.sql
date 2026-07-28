BEGIN;

-- 1. Limpar todas as associações atuais para evitar duplicatas ou lixo
DELETE FROM turma_professores;

-- 2. Inserir as novas associações mapeadas dinamicamente pelos nomes corretos

-- Brennda Larissa: T6, T7, T9, T10
INSERT INTO turma_professores (professor_id, turma_id)
SELECT p.id, t.id
FROM professores p
CROSS JOIN turmas t
WHERE p.nome ILIKE '%Brennda Larissa%'
  AND t.nome IN ('T6 - Sexta-feira Tarde', 'T7 - Sexta-feira Tarde', 'T9 - Sábado Manhã', 'T10 - Sábado Manhã')
ON CONFLICT DO NOTHING;

-- Rafaella Miranda: T6, T7, T9, T10
INSERT INTO turma_professores (professor_id, turma_id)
SELECT p.id, t.id
FROM professores p
CROSS JOIN turmas t
WHERE p.nome ILIKE '%Rafaella Miranda%'
  AND t.nome IN ('T6 - Sexta-feira Tarde', 'T7 - Sexta-feira Tarde', 'T9 - Sábado Manhã', 'T10 - Sábado Manhã')
ON CONFLICT DO NOTHING;

-- Prof. Romildo: T8, T11
INSERT INTO turma_professores (professor_id, turma_id)
SELECT p.id, t.id
FROM professores p
CROSS JOIN turmas t
WHERE p.nome ILIKE '%Romildo%'
  AND t.nome IN ('T8 - Sexta-feira Tarde', 'T11 - Sábado Manhã')
ON CONFLICT DO NOTHING;

-- Bruna Cavalcante: T1, T2, T3, T4, T5, T8, T11
INSERT INTO turma_professores (professor_id, turma_id)
SELECT p.id, t.id
FROM professores p
CROSS JOIN turmas t
WHERE p.nome ILIKE '%Bruna Cavalcante%'
  AND t.nome IN (
    'T1 - Segunda-feira', 
    'T2 - Terça-feira', 
    'T3 - Quarta-feira', 
    'T4 - Quinta-feira', 
    'T5 - Quarta-feira Manhã', 
    'T8 - Sexta-feira Tarde', 
    'T11 - Sábado Manhã'
  )
ON CONFLICT DO NOTHING;

-- Verificação:
SELECT p.nome as Professor, t.nome as Turma
FROM turma_professores tp
JOIN professores p ON tp.professor_id = p.id
JOIN turmas t ON tp.turma_id = t.id
ORDER BY p.nome, t.nome;

COMMIT;
