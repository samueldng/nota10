import { query } from './db';

let tablesChecked = false;

/**
 * Garante que todas as tabelas e índices de progresso do aluno, estado do player e trilhas 
 * existem no PostgreSQL de produção com as tipagens flexíveis corretas.
 * Idempotente e rápido (usa flag em memória após a primeira checagem bem-sucedida ou CREATE IF NOT EXISTS).
 */
export async function ensureProgressTables(): Promise<void> {
  if (tablesChecked) return;

  try {
    // 1. Tabela player_state (Heartbeat e progresso anti-skip de vídeos)
    await query(`
      CREATE TABLE IF NOT EXISTS player_state (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        aluno_id VARCHAR(100) NOT NULL,
        conteudo_id VARCHAR(100) NOT NULL,
        current_time_seconds NUMERIC(10,2) NOT NULL DEFAULT 0,
        duration_seconds NUMERIC(10,2) DEFAULT 0,
        percent_watched NUMERIC(5,2) NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed')),
        completed_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (aluno_id, conteudo_id)
      );
    `);

    // Índice para busca ultrarrápida no heartbeat do player
    await query(`
      CREATE INDEX IF NOT EXISTS idx_player_state_aluno_conteudo 
      ON player_state (aluno_id, conteudo_id);
    `);

    // 2. Tabela atividades_progresso (Status geral das atividades da trilha)
    await query(`
      CREATE TABLE IF NOT EXISTS atividades_progresso (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        aluno_id VARCHAR(100) NOT NULL,
        atividade_id VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pendente',
        xp_ganho INT DEFAULT 0,
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (aluno_id, atividade_id)
      );
    `);

    await query(`
      CREATE INDEX IF NOT EXISTS idx_atividades_progresso_aluno 
      ON atividades_progresso (aluno_id, atividade_id);
    `);

    // 3. Tabela aluno_progresso (Histórico individual de XP e pontuações por atividade)
    await query(`
      CREATE TABLE IF NOT EXISTS aluno_progresso (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        aluno_id VARCHAR(100) NOT NULL,
        atividade_id VARCHAR(100),
        tipo_acao VARCHAR(50) NOT NULL,
        xp_ganho INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (aluno_id, atividade_id)
      );
    `);

    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_progresso_aluno_atividade_unique
      ON aluno_progresso (aluno_id, atividade_id)
      WHERE atividade_id IS NOT NULL;
    `);

    // 4. Tabela video_comentarios (Dúvidas e comentários no player)
    await query(`
      CREATE TABLE IF NOT EXISTS video_comentarios (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conteudo_id VARCHAR(100) NOT NULL,
        aluno_id VARCHAR(100) NOT NULL,
        aluno_nome VARCHAR(255) NOT NULL,
        texto TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 5. Tabelas de resultados de quizzes e questões
    await query(`
      CREATE TABLE IF NOT EXISTS quiz_resultados (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        quiz_id VARCHAR(100) NOT NULL,
        aluno_id VARCHAR(100) NOT NULL,
        score INT NOT NULL DEFAULT 0,
        total_questions INT NOT NULL DEFAULT 0,
        respostas JSONB DEFAULT '[]'::jsonb,
        completed_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (quiz_id, aluno_id)
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS resultado_questoes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        aluno_id VARCHAR(100) NOT NULL,
        disciplina_id VARCHAR(100) NOT NULL,
        acertos INT DEFAULT 0,
        erros INT DEFAULT 0,
        total INT DEFAULT 0,
        xp_ganho INT DEFAULT 0,
        respostas JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    tablesChecked = true;
    console.log('[ensureProgressTables] Todas as tabelas de progresso, player_state e aluno_progresso verificadas/criadas com sucesso.');
  } catch (err: any) {
    console.error('[ensureProgressTables] Erro ao verificar/criar tabelas de progresso:', err.message);
  }
}
