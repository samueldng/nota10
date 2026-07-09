-- ═══════════════════════════════════════════════════════════════════════
-- MIGRAÇÃO 005: Videoaulas Oficiais do Pré-CMT 5º Ano
-- Execute este script no PostgreSQL da VPS para limpar dados de teste
-- e popular com a grade oficial de videoaulas do curso.
--
-- IMPORTANTE: Este script utiliza um bloco PL/pgSQL anônimo (DO $$)
-- para inserir os vídeos em TODAS as turmas de acompanhamento 'pre_cmt_5'
-- de forma dinâmica, sem hardcodar IDs de turmas.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ────────────────────────────────────────────────────────────────────────
-- 1. LIMPEZA SEGURA: Remove apenas videoaulas (preserva PDFs e simulados)
-- ────────────────────────────────────────────────────────────────────────
DELETE FROM conteudos_midia WHERE tipo_conteudo = 'videoaula';

-- ────────────────────────────────────────────────────────────────────────
-- 2. INJEÇÃO DE DADOS OFICIAIS (bloco dinâmico por turma)
-- ────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_turma_id UUID;
  v_turma RECORD;
BEGIN
  -- Itera sobre todas as turmas do acompanhamento Pré-CMT 5º Ano
  FOR v_turma IN
    SELECT id FROM turmas WHERE acompanhamento = 'pre_cmt_5'
  LOOP
    v_turma_id := v_turma.id;

    -- ════════════════════════════════════
    -- MÓDULO: Introdução / Boas-vindas
    -- ════════════════════════════════════
    INSERT INTO conteudos_midia (id, turma_id, tipo_conteudo, titulo, descricao, url_acesso, disciplina, status, created_at)
    VALUES (
      gen_random_uuid(), v_turma_id, 'videoaula',
      'Bem Vindo ao PRÉ-CMT Nota 10',
      'Aula de boas-vindas ao curso Pré-CMT Nota 10. Conheça a metodologia, a equipe e o que esperar de cada módulo.',
      'https://youtu.be/Bmqb2SeSzKw',
      'Introdução', TRUE, NOW()
    );

    INSERT INTO conteudos_midia (id, turma_id, tipo_conteudo, titulo, descricao, url_acesso, disciplina, status, created_at)
    VALUES (
      gen_random_uuid(), v_turma_id, 'videoaula',
      'Como Usar a Apostila Nota 10',
      'Guia prático de como utilizar a apostila do curso Pré-CMT Nota 10 para maximizar seu desempenho nos estudos.',
      'https://youtu.be/1Se5-gKvQ1o',
      'Introdução', TRUE, NOW()
    );

    INSERT INTO conteudos_midia (id, turma_id, tipo_conteudo, titulo, descricao, url_acesso, disciplina, status, created_at)
    VALUES (
      gen_random_uuid(), v_turma_id, 'videoaula',
      'REVELADO: Segredo de quem já foi aprovado',
      'Descubra as estratégias e hábitos dos alunos que já conquistaram a aprovação no CMT. Inspiração e método comprovado.',
      'https://youtu.be/m8IJqbRcuGI',
      'Introdução', TRUE, NOW()
    );

    -- ════════════════════════════════════
    -- MÓDULO: Português
    -- ════════════════════════════════════
    INSERT INTO conteudos_midia (id, turma_id, tipo_conteudo, titulo, descricao, url_acesso, disciplina, status, created_at)
    VALUES (
      gen_random_uuid(), v_turma_id, 'videoaula',
      'Português — Bloco I',
      'Videoaula do Bloco I de Português. Fundamentos da língua portuguesa com foco no conteúdo exigido no CMT.',
      'https://youtu.be/GoX7ntye4Ac',
      'Português', TRUE, NOW()
    );

    INSERT INTO conteudos_midia (id, turma_id, tipo_conteudo, titulo, descricao, url_acesso, disciplina, status, created_at)
    VALUES (
      gen_random_uuid(), v_turma_id, 'videoaula',
      'Português — Bloco II',
      'Videoaula do Bloco II de Português. Aprofundamento dos conteúdos gramaticais e de interpretação textual.',
      'https://youtu.be/59hHpqzHPlY',
      'Português', TRUE, NOW()
    );

    INSERT INTO conteudos_midia (id, turma_id, tipo_conteudo, titulo, descricao, url_acesso, disciplina, status, created_at)
    VALUES (
      gen_random_uuid(), v_turma_id, 'videoaula',
      'Português — Bloco III',
      'Videoaula do Bloco III de Português. Exercícios práticos e revisão dos conteúdos anteriores.',
      'https://youtu.be/vazlMW1g6Yw',
      'Português', TRUE, NOW()
    );

    INSERT INTO conteudos_midia (id, turma_id, tipo_conteudo, titulo, descricao, url_acesso, disciplina, status, created_at)
    VALUES (
      gen_random_uuid(), v_turma_id, 'videoaula',
      'Português — Bloco IV',
      'Videoaula do Bloco IV de Português. Técnicas avançadas de redação e coerência textual.',
      'https://youtu.be/lDaUT7_Eieo',
      'Português', TRUE, NOW()
    );

    INSERT INTO conteudos_midia (id, turma_id, tipo_conteudo, titulo, descricao, url_acesso, disciplina, status, created_at)
    VALUES (
      gen_random_uuid(), v_turma_id, 'videoaula',
      'Português — Bloco V',
      'Videoaula do Bloco V de Português. Revisão geral e simulado orientado para os pontos mais cobrados.',
      'https://youtu.be/oYlFheLW9TA',
      'Português', TRUE, NOW()
    );

    INSERT INTO conteudos_midia (id, turma_id, tipo_conteudo, titulo, descricao, url_acesso, disciplina, status, created_at)
    VALUES (
      gen_random_uuid(), v_turma_id, 'videoaula',
      'Português — Bloco VI',
      'Videoaula do Bloco VI de Português. Consolidação do aprendizado com resolução de provas anteriores.',
      'https://youtu.be/teKPWKqT0RU',
      'Português', TRUE, NOW()
    );

    INSERT INTO conteudos_midia (id, turma_id, tipo_conteudo, titulo, descricao, url_acesso, disciplina, status, created_at)
    VALUES (
      gen_random_uuid(), v_turma_id, 'videoaula',
      'Português — Bloco VII',
      'Videoaula do Bloco VII de Português. Foco em questões de alta dificuldade e estratégias de prova.',
      'https://youtu.be/dcs04w2unCc',
      'Português', TRUE, NOW()
    );

    INSERT INTO conteudos_midia (id, turma_id, tipo_conteudo, titulo, descricao, url_acesso, disciplina, status, created_at)
    VALUES (
      gen_random_uuid(), v_turma_id, 'videoaula',
      'Português — Bloco VIII',
      'Videoaula do Bloco VIII de Português. Últimas revisões e dicas finais para a prova do CMT.',
      'https://youtu.be/yIqn6pcZ9Gg',
      'Português', TRUE, NOW()
    );

    INSERT INTO conteudos_midia (id, turma_id, tipo_conteudo, titulo, descricao, url_acesso, disciplina, status, created_at)
    VALUES (
      gen_random_uuid(), v_turma_id, 'videoaula',
      'Português — Bloco IX',
      'Videoaula do Bloco IX de Português. Simulação completa de prova comentada pelo professor.',
      'https://youtu.be/fu7uyj9BW0o',
      'Português', TRUE, NOW()
    );

    INSERT INTO conteudos_midia (id, turma_id, tipo_conteudo, titulo, descricao, url_acesso, disciplina, status, created_at)
    VALUES (
      gen_random_uuid(), v_turma_id, 'videoaula',
      'Português — Bloco X',
      'Videoaula do Bloco X de Português. Encerramento do módulo com correção de erros frequentes e gabarito.',
      'https://youtu.be/dtMfLbctFAs',
      'Português', TRUE, NOW()
    );

    -- ════════════════════════════════════
    -- MÓDULO: Matemática
    -- ════════════════════════════════════
    INSERT INTO conteudos_midia (id, turma_id, tipo_conteudo, titulo, descricao, url_acesso, disciplina, status, created_at)
    VALUES (
      gen_random_uuid(), v_turma_id, 'videoaula',
      'Matemática — Bloco I',
      'Videoaula do Bloco I de Matemática. Fundamentos aritméticos e operações básicas com foco no CMT.',
      'https://youtu.be/Ev5Ujh18DUA',
      'Matemática', TRUE, NOW()
    );

    INSERT INTO conteudos_midia (id, turma_id, tipo_conteudo, titulo, descricao, url_acesso, disciplina, status, created_at)
    VALUES (
      gen_random_uuid(), v_turma_id, 'videoaula',
      'Matemática — Bloco II',
      'Videoaula do Bloco II de Matemática. Frações, decimais e porcentagem aplicados à resolução de problemas.',
      'https://youtu.be/4H_ff4BENjM',
      'Matemática', TRUE, NOW()
    );

    INSERT INTO conteudos_midia (id, turma_id, tipo_conteudo, titulo, descricao, url_acesso, disciplina, status, created_at)
    VALUES (
      gen_random_uuid(), v_turma_id, 'videoaula',
      'Matemática — Bloco III',
      'Videoaula do Bloco III de Matemática. Geometria plana e cálculo de áreas e perímetros.',
      'https://youtu.be/c4I9MsA6Lnc',
      'Matemática', TRUE, NOW()
    );

    INSERT INTO conteudos_midia (id, turma_id, tipo_conteudo, titulo, descricao, url_acesso, disciplina, status, created_at)
    VALUES (
      gen_random_uuid(), v_turma_id, 'videoaula',
      'Matemática — Bloco IV',
      'Videoaula do Bloco IV de Matemática. Grandezas e medidas, conversão de unidades e problemas contextualizados.',
      'https://youtu.be/MYUI2xgrw2s',
      'Matemática', TRUE, NOW()
    );

    INSERT INTO conteudos_midia (id, turma_id, tipo_conteudo, titulo, descricao, url_acesso, disciplina, status, created_at)
    VALUES (
      gen_random_uuid(), v_turma_id, 'videoaula',
      'Matemática — Bloco V',
      'Videoaula do Bloco V de Matemática. Raciocínio lógico, sequências e padrões numéricos.',
      'https://youtu.be/RSFxSTTSuPk',
      'Matemática', TRUE, NOW()
    );

    INSERT INTO conteudos_midia (id, turma_id, tipo_conteudo, titulo, descricao, url_acesso, disciplina, status, created_at)
    VALUES (
      gen_random_uuid(), v_turma_id, 'videoaula',
      'Matemática — Bloco VI',
      'Videoaula do Bloco VI de Matemática. Álgebra introdutória: equações e expressões algébricas.',
      'https://youtu.be/zLwlEAANifQ',
      'Matemática', TRUE, NOW()
    );

    -- NOTA: URL duplicada em relação ao Bloco VII de Português (youtu.be/dcs04w2unCc).
    -- Inserida conforme orientação do cliente para edição posterior no painel administrativo.
    INSERT INTO conteudos_midia (id, turma_id, tipo_conteudo, titulo, descricao, url_acesso, disciplina, status, created_at)
    VALUES (
      gen_random_uuid(), v_turma_id, 'videoaula',
      'Matemática — Bloco VII',
      'Videoaula do Bloco VII de Matemática. ATENÇÃO: URL pendente de atualização pelo administrador no painel.',
      'https://youtu.be/dcs04w2unCc',
      'Matemática', TRUE, NOW()
    );

    INSERT INTO conteudos_midia (id, turma_id, tipo_conteudo, titulo, descricao, url_acesso, disciplina, status, created_at)
    VALUES (
      gen_random_uuid(), v_turma_id, 'videoaula',
      'Matemática — Bloco VIII',
      'Videoaula do Bloco VIII de Matemática. Estatística básica: média, moda e mediana.',
      'https://youtu.be/yWXeCXfJNvQ',
      'Matemática', TRUE, NOW()
    );

    INSERT INTO conteudos_midia (id, turma_id, tipo_conteudo, titulo, descricao, url_acesso, disciplina, status, created_at)
    VALUES (
      gen_random_uuid(), v_turma_id, 'videoaula',
      'Matemática — Bloco IX',
      'Videoaula do Bloco IX de Matemática. Revisão geral e resolução de questões de provas anteriores do CMT.',
      'https://youtu.be/KNnHV83xW3g',
      'Matemática', TRUE, NOW()
    );

    INSERT INTO conteudos_midia (id, turma_id, tipo_conteudo, titulo, descricao, url_acesso, disciplina, status, created_at)
    VALUES (
      gen_random_uuid(), v_turma_id, 'videoaula',
      'Matemática — Bloco X',
      'Videoaula do Bloco X de Matemática. Encerramento do módulo com simulação completa e gabarito comentado.',
      'https://youtu.be/TXPgGFWLShw',
      'Matemática', TRUE, NOW()
    );

  END LOOP;
END;
$$;

-- ────────────────────────────────────────────────────────────────────────
-- 3. VERIFICAÇÃO FINAL
-- ────────────────────────────────────────────────────────────────────────
SELECT
  disciplina,
  COUNT(*) AS total_videos
FROM conteudos_midia
WHERE tipo_conteudo = 'videoaula'
GROUP BY disciplina
ORDER BY disciplina;

COMMIT;
