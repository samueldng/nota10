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
  endereco_cidade TEXT
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

-- Políticas de Segurança (Permissivas para o MVP)
-- Permitindo leitura e escrita pública via chave anon
ALTER TABLE professores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all" ON professores FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE turmas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all" ON turmas FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE turma_professores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all" ON turma_professores FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all" ON alunos FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE registros_lancados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all" ON registros_lancados FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE folhas_geradas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all" ON folhas_geradas FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE log_auditoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_all" ON log_auditoria FOR ALL USING (true) WITH CHECK (true);
