-- SCHEMA PARA O MVP DO NOTA 10 EDUCACIONAL

-- Tabelas Básicas
CREATE TABLE professores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ativo'
);

CREATE TABLE turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  acompanhamento TEXT NOT NULL,
  turno TEXT NOT NULL,
  dias TEXT NOT NULL,
  horario TEXT NOT NULL,
  disciplinas TEXT[] DEFAULT '{}',
  alunos_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ativa'
);

CREATE TABLE turma_professores (
  turma_id UUID REFERENCES turmas(id) ON DELETE CASCADE,
  professor_id UUID REFERENCES professores(id) ON DELETE CASCADE,
  PRIMARY KEY (turma_id, professor_id)
);

CREATE TABLE alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL,
  nome TEXT NOT NULL,
  turma_id UUID REFERENCES turmas(id),
  turma_nome TEXT NOT NULL,
  acompanhamento TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo',
  responsavel1_nome TEXT NOT NULL,
  responsavel1_telefone TEXT NOT NULL,
  responsavel2_nome TEXT,
  responsavel2_telefone TEXT,
  endereco_rua TEXT,
  endereco_bairro TEXT,
  endereco_cidade TEXT,
  plano TEXT DEFAULT 'padrao',
  senha_inicial TEXT,
  primeiro_acesso BOOLEAN DEFAULT true
);

-- Registros de Lançamento
CREATE TABLE registros_lancados (
  id SERIAL PRIMARY KEY,
  data TEXT NOT NULL,
  acompanhamento TEXT NOT NULL,
  turma TEXT NOT NULL,
  aluno TEXT NOT NULL,
  disciplina TEXT NOT NULL,
  bloco TEXT NOT NULL,
  professor TEXT NOT NULL,
  origem TEXT NOT NULL,
  status TEXT NOT NULL,
  lancado_por TEXT NOT NULL,
  editado_por TEXT,
  data_edicao TEXT
);

-- Folhas Geradas
CREATE TABLE folhas_geradas (
  id TEXT PRIMARY KEY,
  acompanhamento TEXT NOT NULL,
  turma TEXT NOT NULL,
  aluno TEXT,
  data TEXT NOT NULL,
  disciplina TEXT NOT NULL,
  bloco TEXT,
  professor TEXT NOT NULL,
  gerada_por TEXT NOT NULL,
  data_geracao TEXT NOT NULL
);

-- Log de Auditoria
CREATE TABLE log_auditoria (
  id SERIAL PRIMARY KEY,
  data TEXT NOT NULL,
  usuario TEXT NOT NULL,
  acao TEXT NOT NULL,
  detalhe TEXT
);

-- Políticas de Segurança não se aplicam a PostgreSQL local sem extensão de RLS ativada explicitamente.
-- Todas as tabelas são públicas para acesso direto do pool da VPS.

-- Cronograma Semanal (Trilha de Atividades / XP)
CREATE TABLE cronograma_atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  semana_numero INT NOT NULL,
  datas_semana VARCHAR(50) NOT NULL,
  ordem INT NOT NULL DEFAULT 1,
  tipo VARCHAR(50) NOT NULL,
  disciplina VARCHAR(100),
  bloco VARCHAR(50),
  titulo VARCHAR(255) NOT NULL,
  xp_total INT NOT NULL DEFAULT 0,
  subtarefas JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by turma + week
CREATE INDEX idx_cronograma_turma_semana ON cronograma_atividades (turma_id, semana_numero);

-- Comunicados (turma_id NULL = comunicado global visível para todos)
CREATE TABLE comunicados (
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

CREATE INDEX idx_comunicados_turma ON comunicados (turma_id);
CREATE INDEX idx_comunicados_tipo ON comunicados (tipo_criticidade);

-- Conteúdos de Mídia (Unificação: videoaula, pdf, simulado)
CREATE TABLE conteudos_midia (
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

CREATE INDEX idx_conteudos_turma ON conteudos_midia (turma_id);
CREATE INDEX idx_conteudos_tipo ON conteudos_midia (tipo_conteudo);
CREATE INDEX idx_conteudos_turma_tipo ON conteudos_midia (turma_id, tipo_conteudo);
