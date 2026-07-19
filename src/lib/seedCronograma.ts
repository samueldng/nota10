import { getClient } from './db';

export async function seedCronogramaOficial() {
  console.log('🌱 [Seed Cronograma] Iniciando o povoamento oficial do cronograma (7 semanas)...');
  
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Garantir que turmas tem a coluna data_inicio e cronograma_atividades tem colunas essenciais
    await client.query(`
      ALTER TABLE turmas ADD COLUMN IF NOT EXISTS data_inicio DATE DEFAULT '2026-07-13';
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cronograma_atividades (
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
        data_liberacao DATE,
        dia_semana VARCHAR(20),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cronograma_turma_semana ON cronograma_atividades (turma_id, semana_numero);
    `);

    // 2. Buscar todas as turmas cadastradas
    const turmasRes = await client.query(`SELECT id, nome, data_inicio, dias FROM turmas`);
    if (turmasRes.rows.length === 0) {
      console.warn('⚠️ [Seed Cronograma] Nenhuma turma encontrada na tabela turmas. Cadastre as turmas primeiro.');
      await client.query('ROLLBACK');
      return { success: false, message: 'Nenhuma turma encontrada na tabela turmas.' };
    }

    console.log(`📌 Encontradas ${turmasRes.rows.length} turmas. Limpando cronogramas antigos para reinjeção estruturada...`);
    await client.query(`DELETE FROM cronograma_atividades`);

    const mesesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    // 3. Estrutura das 7 semanas pedagógicas oficiais
    for (const turma of turmasRes.rows) {
      const dataBase = turma.data_inicio ? new Date(turma.data_inicio) : new Date('2026-07-13');
      dataBase.setHours(12, 0, 0, 0); // Evitar problemas com timezone

      for (let w = 1; w <= 7; w++) {
        const inicioSemana = new Date(dataBase);
        inicioSemana.setDate(inicioSemana.getDate() + (w - 1) * 7);

        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(fimSemana.getDate() + 6);

        const datasSemanaStr = `${inicioSemana.getDate()} ${mesesMeses[inicioSemana.getMonth()]} - ${fimSemana.getDate()} ${mesesMeses[fimSemana.getMonth()]}`;
        const dataLiberacaoStr = inicioSemana.toISOString().split('T')[0];
        const blocoNum = Math.min(4, Math.ceil(w / 1.75));
        const blocoNome = `Bloco ${blocoNum}`;

        const atividadesSemana = [
          {
            ordem: 1,
            dia_semana: 'Segunda',
            tipo: 'presencial',
            disciplina: 'Geral',
            bloco: blocoNome,
            titulo: w === 1 ? 'Aula Presencial - Alinhamento & Disciplina' :
                    w === 7 ? 'Aula Presencial - Mega Revisão Final e Dicas' :
                    `Aula Presencial - Módulo de Estudo ${w}`,
            xp_total: 15,
            subtarefas: JSON.stringify([
              { id: `s${w}-1`, titulo: 'Presença e Pontualidade Confirmadas', status: 'pendente' },
              { id: `s${w}-2`, titulo: 'Anotações no Caderno de Bordo', status: 'pendente' }
            ])
          },
          {
            ordem: 2,
            dia_semana: 'Terça',
            tipo: 'revisao',
            disciplina: 'Português',
            bloco: blocoNome,
            titulo: w === 1 ? 'Revisão Corujinha - Sintaxe Inicial' :
                    w === 7 ? 'Revisão Corujinha - Maratona Final de Gramática' :
                    `Revisão Corujinha - Gramática & Texto ${w}`,
            xp_total: 30,
            subtarefas: JSON.stringify([
              { id: `s${w}-3`, titulo: 'Participação ao Vivo ou Replay', status: 'pendente' },
              { id: `s${w}-4`, titulo: 'Resolução do Minidesafio Corujinha', status: 'pendente' }
            ])
          },
          {
            ordem: 3,
            dia_semana: 'Quarta',
            tipo: 'videoaula',
            disciplina: 'Matemática',
            bloco: blocoNome,
            titulo: w === 1 ? 'Videoaula - Geometria & Teoremas Básicos' :
                    w === 7 ? 'Videoaula - Estratégias de Raciocínio Lógico' :
                    `Videoaula - Conceitos Chave de Álgebra e Geometria ${w}`,
            xp_total: 15,
            subtarefas: JSON.stringify([
              { id: `s${w}-5`, titulo: 'Assistir à Videoaula Completa (80%+)', status: 'pendente' }
            ])
          },
          {
            ordem: 4,
            dia_semana: 'Quinta',
            tipo: 'fixacao',
            disciplina: w % 2 === 1 ? 'Português' : 'Matemática',
            bloco: blocoNome,
            titulo: w === 7 ? 'Apostila - Questões de Fixação Final' : `Apostila - Questões de Fixação Módulo ${w}`,
            xp_total: 25,
            subtarefas: JSON.stringify([
              { id: `s${w}-6`, titulo: 'Conferir Gabarito Comentado no Cofre', status: 'pendente' }
            ])
          },
          {
            ordem: 5,
            dia_semana: 'Sábado',
            tipo: 'simulado',
            disciplina: 'Geral',
            bloco: blocoNome,
            titulo: w === 7 ? 'Simulado Final e Formatura' : `Conferência Semanal & Simulado ${w}`,
            xp_total: 50,
            subtarefas: JSON.stringify([
              { id: `s${w}-7`, titulo: 'Envio das Respostas no Tempo Oficial', status: 'pendente' }
            ])
          }
        ];

        for (const ativ of atividadesSemana) {
          await client.query(
            `INSERT INTO cronograma_atividades (
              turma_id, semana_numero, datas_semana, ordem, tipo, disciplina,
              bloco, titulo, xp_total, subtarefas, data_liberacao, dia_semana
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12)`,
            [
              turma.id,
              w,
              datasSemanaStr,
              ativ.ordem,
              ativ.tipo,
              ativ.disciplina,
              ativ.bloco,
              ativ.titulo,
              ativ.xp_total,
              ativ.subtarefas,
              dataLiberacaoStr,
              ativ.dia_semana
            ]
          );
        }
      }
    }

    await client.query('COMMIT');
    console.log('✅ [Seed Cronograma] 7 semanas inseridas com sucesso para todas as turmas!');
    return { success: true, message: '7 semanas inseridas com sucesso para todas as turmas!' };
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('❌ [Seed Cronograma] Erro ao injetar cronograma:', err);
    throw err;
  } finally {
    client.release();
  }
}
