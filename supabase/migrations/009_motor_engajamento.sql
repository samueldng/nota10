-- ═══════════════════════════════════════════════
-- 1. PLAYER STATE (Retomada de vídeo)
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS player_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  conteudo_id UUID NOT NULL REFERENCES conteudos_midia(id) ON DELETE CASCADE,
  current_time_seconds NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_seconds NUMERIC(10,2),
  percent_watched NUMERIC(5,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started','in_progress','completed')),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (aluno_id, conteudo_id)
);

CREATE INDEX IF NOT EXISTS idx_player_state_aluno ON player_state (aluno_id);

-- ═══════════════════════════════════════════════
-- 2. COMENTÁRIOS DE VÍDEO
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS video_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conteudo_id UUID NOT NULL REFERENCES conteudos_midia(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_comentarios_conteudo ON video_comentarios (conteudo_id);

-- ═══════════════════════════════════════════════
-- 3. TRILHA SEMANAL (Time-Gating)
-- ═══════════════════════════════════════════════
ALTER TABLE cronograma_atividades
  ADD COLUMN IF NOT EXISTS data_liberacao DATE,
  ADD COLUMN IF NOT EXISTS dia_semana VARCHAR(20);

-- Progresso por atividade individual (status estrito)
CREATE TABLE IF NOT EXISTS atividades_progresso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  atividade_id VARCHAR(150) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'bloqueada'
    CHECK (status IN ('bloqueada','em_andamento','concluida')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  xp_ganho INT DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (aluno_id, atividade_id)
);

CREATE INDEX IF NOT EXISTS idx_atividades_progresso_aluno ON atividades_progresso (aluno_id);
CREATE INDEX IF NOT EXISTS idx_atividades_progresso_status ON atividades_progresso (aluno_id, status);

-- ═══════════════════════════════════════════════
-- 4. QUESTÕES DE FIXAÇÃO (Banco de Questões)
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS questoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disciplina VARCHAR(100) NOT NULL,
  bloco VARCHAR(50),
  enunciado TEXT NOT NULL,
  tipo VARCHAR(30) NOT NULL DEFAULT 'multipla_escolha'
    CHECK (tipo IN ('multipla_escolha','verdadeiro_falso')),
  alternativas JSONB NOT NULL,
  resposta_correta VARCHAR(10) NOT NULL,
  explicacao TEXT,
  xp_valor INT NOT NULL DEFAULT 10,
  ordem INT DEFAULT 0,
  atividade_ref VARCHAR(150),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questoes_disciplina ON questoes (disciplina);
CREATE INDEX IF NOT EXISTS idx_questoes_atividade ON questoes (atividade_ref);

-- Respostas do aluno
CREATE TABLE IF NOT EXISTS respostas_aluno (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  questao_id UUID NOT NULL REFERENCES questoes(id) ON DELETE CASCADE,
  atividade_ref VARCHAR(150),
  resposta_dada VARCHAR(10) NOT NULL,
  esta_correta BOOLEAN NOT NULL,
  tempo_resposta_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (aluno_id, questao_id, atividade_ref)
);

CREATE INDEX IF NOT EXISTS idx_respostas_aluno ON respostas_aluno (aluno_id);
CREATE INDEX IF NOT EXISTS idx_respostas_atividade ON respostas_aluno (atividade_ref);

-- Resultado consolidado por sessão de questões
CREATE TABLE IF NOT EXISTS resultado_questoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  atividade_ref VARCHAR(150) NOT NULL,
  total_questoes INT NOT NULL,
  acertos INT NOT NULL,
  erros INT NOT NULL,
  percentual_aproveitamento NUMERIC(5,2) NOT NULL,
  xp_ganho INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (aluno_id, atividade_ref)
);

-- ═══════════════════════════════════════════════
-- 5. QUIZ "CORUJINHA" (Revisões)
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  disciplina VARCHAR(100) NOT NULL,
  bloco VARCHAR(50),
  descricao TEXT,
  xp_base INT NOT NULL DEFAULT 30,
  atividade_ref VARCHAR(150),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_questoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  questao_id UUID NOT NULL REFERENCES questoes(id) ON DELETE CASCADE,
  ordem INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quiz_resultados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  atividade_ref VARCHAR(150),
  total_questoes INT NOT NULL,
  acertos INT NOT NULL,
  erros INT NOT NULL,
  percentual NUMERIC(5,2) NOT NULL,
  xp_ganho INT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (aluno_id, quiz_id, atividade_ref)
);

-- ═══════════════════════════════════════════════
-- 6. RELATÓRIOS MENSAIS
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS relatorios_mensais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  mes_referencia VARCHAR(7) NOT NULL,
  dados JSONB NOT NULL,
  frases_parecer JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'rascunho'
    CHECK (status IN ('rascunho','disponivel','enviado')),
  notificado_whatsapp BOOLEAN DEFAULT FALSE,
  disponibilizado_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (aluno_id, mes_referencia)
);

-- ═══════════════════════════════════════════════
-- 7. COMUNICADOS (Multi-turma)
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS comunicado_turmas (
  comunicado_id UUID NOT NULL REFERENCES comunicados(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  PRIMARY KEY (comunicado_id, turma_id)
);

-- Migrar comunicados existentes para a nova tabela (se tiverem turma_id)
INSERT INTO comunicado_turmas (comunicado_id, turma_id)
SELECT id, turma_id FROM comunicados WHERE turma_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Opcional: remover a coluna turma_id de comunicados após validar
-- ALTER TABLE comunicados DROP COLUMN turma_id;

-- ═══════════════════════════════════════════════
-- 8. FILA DE WHATSAPP
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS whatsapp_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telefone VARCHAR(20) NOT NULL,
  mensagem TEXT NOT NULL,
  link VARCHAR(512),
  status VARCHAR(20) NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente','enviado','erro')),
  tentativas INT DEFAULT 0,
  erro_detalhe TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  enviado_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_status ON whatsapp_queue (status);
