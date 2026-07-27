import { getClient } from './db';

/**
 * Cronograma Oficial Pré-CMT Nota 10 — Ano 2026
 * Período: 03/08 a 19/09 (7 semanas, Blocos I a V + Revisão + Simulado)
 *
 * ATENÇÃO: Datas extraídas do calendário oficial entregue pela coordenação.
 * Qualquer alteração deve ser validada com o calendário físico.
 *
 * Dívida Técnica: Os renomes de turma estão hardcodados aqui.
 * Quando a tabela turmas tiver nomenclatura estável, remover os UPDATEs.
 */

// Mapeamento de nomes antigos → novos (UPDATE idempotente)
const TURMA_RENAMES: Record<string, string> = {
  '5A Manhã': 'T1 - Segunda-feira',
  '5B Tarde': 'T2 - Terça-feira',
  '5C Manhã': 'T3 - Quarta-feira',
  '5A Manhã 2025': 'T5 - Quarta-feira Manhã',
};

/**
 * Cronograma completo por turma: cada turma tem 7 semanas com datas exactas.
 * 
 * Estrutura por semana:
 *   abertura / data_inicio — dia de abertura ou aula presencial
 *   videoaula_port — quando a videoaula de Português é liberada
 *   videoaula_mat — quando a videoaula de Matemática é liberada
 *   revisao_port — revisão de Português
 *   revisao_mat — revisão de Matemática
 *   fixacao — exercícios de fixação/apostila
 */
interface SemanaCalendario {
  semana: number;
  label: string;
  bloco: string;
  abertura: string;           // Dia da aula presencial ou abertura
  videoaula_port?: string;    // Liberação da videoaula de Português
  videoaula_mat?: string;     // Liberação da videoaula de Matemática  
  revisao_port?: string;      // Revisão Português
  revisao_mat?: string;       // Revisão Matemática
  fixacao_port?: string;      // Fixação Português (apostila)
  fixacao_mat?: string;       // Fixação Matemática (apostila)
}

const CRONOGRAMA: Record<string, SemanaCalendario[]> = {
  'T1 - Segunda-feira': [
    { semana: 1, label: '03 Ago - 09 Ago', bloco: 'Abertura', abertura: '2026-08-03', videoaula_port: '2026-08-04', fixacao_port: '2026-08-05', videoaula_mat: '2026-08-06', fixacao_mat: '2026-08-07' },
    { semana: 2, label: '10 Ago - 16 Ago', bloco: 'Bloco I', abertura: '2026-08-10', revisao_port: '2026-08-11', revisao_mat: '2026-08-12', videoaula_port: '2026-08-13', fixacao_port: '2026-08-14', videoaula_mat: '2026-08-15', fixacao_mat: '2026-08-15' },
    { semana: 3, label: '17 Ago - 23 Ago', bloco: 'Bloco II', abertura: '2026-08-17', revisao_port: '2026-08-18', revisao_mat: '2026-08-19', videoaula_port: '2026-08-20', fixacao_port: '2026-08-21', videoaula_mat: '2026-08-22', fixacao_mat: '2026-08-22' },
    { semana: 4, label: '24 Ago - 30 Ago', bloco: 'Bloco III', abertura: '2026-08-24', revisao_port: '2026-08-25', revisao_mat: '2026-08-26', videoaula_port: '2026-08-27', fixacao_port: '2026-08-28', videoaula_mat: '2026-08-29', fixacao_mat: '2026-08-29' },
    { semana: 5, label: '31 Ago - 06 Set', bloco: 'Bloco IV', abertura: '2026-08-31', revisao_port: '2026-09-01', revisao_mat: '2026-09-02', videoaula_port: '2026-09-03', videoaula_mat: '2026-09-04', fixacao_port: '2026-09-03', fixacao_mat: '2026-09-04' },
    { semana: 6, label: '05 Set - 13 Set', bloco: 'Bloco V / Revisão', abertura: '2026-09-05', revisao_port: '2026-09-08', revisao_mat: '2026-09-09', fixacao_port: '2026-09-10', fixacao_mat: '2026-09-11', videoaula_port: '2026-09-10', videoaula_mat: '2026-09-12' },
    { semana: 7, label: '14 Set', bloco: 'Simulado', abertura: '2026-09-14' },
  ],
  'T2 - Terça-feira': [
    { semana: 1, label: '04 Ago - 10 Ago', bloco: 'Abertura', abertura: '2026-08-04', videoaula_port: '2026-08-05', fixacao_port: '2026-08-06', videoaula_mat: '2026-08-07', fixacao_mat: '2026-08-08' },
    { semana: 2, label: '11 Ago - 17 Ago', bloco: 'Bloco I', abertura: '2026-08-11', revisao_port: '2026-08-12', revisao_mat: '2026-08-13', videoaula_port: '2026-08-14', fixacao_port: '2026-08-15', videoaula_mat: '2026-08-15', fixacao_mat: '2026-08-17' },
    { semana: 3, label: '18 Ago - 24 Ago', bloco: 'Bloco II', abertura: '2026-08-18', revisao_port: '2026-08-19', revisao_mat: '2026-08-20', videoaula_port: '2026-08-21', fixacao_port: '2026-08-22', videoaula_mat: '2026-08-22', fixacao_mat: '2026-08-24' },
    { semana: 4, label: '25 Ago - 31 Ago', bloco: 'Bloco III', abertura: '2026-08-25', revisao_port: '2026-08-26', revisao_mat: '2026-08-27', videoaula_port: '2026-08-28', fixacao_port: '2026-08-29', videoaula_mat: '2026-08-29', fixacao_mat: '2026-08-31' },
    { semana: 5, label: '01 Set - 07 Set', bloco: 'Bloco IV', abertura: '2026-09-01', revisao_port: '2026-09-02', revisao_mat: '2026-09-03', videoaula_port: '2026-09-04', fixacao_port: '2026-09-05', videoaula_mat: '2026-09-05', fixacao_mat: '2026-09-07' },
    { semana: 6, label: '08 Set - 14 Set', bloco: 'Bloco V / Revisão', abertura: '2026-09-08', revisao_port: '2026-09-09', revisao_mat: '2026-09-10', fixacao_port: '2026-09-11', fixacao_mat: '2026-09-12', videoaula_port: '2026-09-11', videoaula_mat: '2026-09-14' },
    { semana: 7, label: '15 Set', bloco: 'Simulado', abertura: '2026-09-15' },
  ],
  'T3 - Quarta-feira': [
    { semana: 1, label: '05 Ago - 11 Ago', bloco: 'Abertura', abertura: '2026-08-05', videoaula_port: '2026-08-06', fixacao_port: '2026-08-07', videoaula_mat: '2026-08-08', fixacao_mat: '2026-08-08' },
    { semana: 2, label: '12 Ago - 18 Ago', bloco: 'Bloco I', abertura: '2026-08-12', revisao_port: '2026-08-13', revisao_mat: '2026-08-14', videoaula_port: '2026-08-15', fixacao_port: '2026-08-15', videoaula_mat: '2026-08-17', fixacao_mat: '2026-08-18' },
    { semana: 3, label: '19 Ago - 25 Ago', bloco: 'Bloco II', abertura: '2026-08-19', revisao_port: '2026-08-20', revisao_mat: '2026-08-21', videoaula_port: '2026-08-22', fixacao_port: '2026-08-22', videoaula_mat: '2026-08-24', fixacao_mat: '2026-08-25' },
    { semana: 4, label: '26 Ago - 01 Set', bloco: 'Bloco III', abertura: '2026-08-26', revisao_port: '2026-08-27', revisao_mat: '2026-08-28', videoaula_port: '2026-08-29', fixacao_port: '2026-08-29', videoaula_mat: '2026-08-31', fixacao_mat: '2026-09-01' },
    { semana: 5, label: '02 Set - 08 Set', bloco: 'Bloco IV', abertura: '2026-09-02', revisao_port: '2026-09-03', revisao_mat: '2026-09-04', videoaula_port: '2026-09-05', fixacao_port: '2026-09-05', videoaula_mat: '2026-09-07', fixacao_mat: '2026-09-08' },
    { semana: 6, label: '09 Set - 15 Set', bloco: 'Bloco V / Revisão', abertura: '2026-09-09', revisao_port: '2026-09-10', revisao_mat: '2026-09-11', fixacao_port: '2026-09-12', fixacao_mat: '2026-09-12', videoaula_port: '2026-09-14', videoaula_mat: '2026-09-15' },
    { semana: 7, label: '16 Set', bloco: 'Simulado', abertura: '2026-09-16' },
  ],
  'T5 - Quarta-feira Manhã': [
    { semana: 1, label: '05 Ago - 11 Ago', bloco: 'Abertura', abertura: '2026-08-05', videoaula_port: '2026-08-06', fixacao_port: '2026-08-07', videoaula_mat: '2026-08-08', fixacao_mat: '2026-08-08' },
    { semana: 2, label: '12 Ago - 18 Ago', bloco: 'Bloco I', abertura: '2026-08-12', revisao_port: '2026-08-13', revisao_mat: '2026-08-14', videoaula_port: '2026-08-15', fixacao_port: '2026-08-15', videoaula_mat: '2026-08-17', fixacao_mat: '2026-08-18' },
    { semana: 3, label: '19 Ago - 25 Ago', bloco: 'Bloco II', abertura: '2026-08-19', revisao_port: '2026-08-20', revisao_mat: '2026-08-21', videoaula_port: '2026-08-22', fixacao_port: '2026-08-22', videoaula_mat: '2026-08-24', fixacao_mat: '2026-08-25' },
    { semana: 4, label: '26 Ago - 01 Set', bloco: 'Bloco III', abertura: '2026-08-26', revisao_port: '2026-08-27', revisao_mat: '2026-08-28', videoaula_port: '2026-08-29', fixacao_port: '2026-08-29', videoaula_mat: '2026-08-31', fixacao_mat: '2026-09-01' },
    { semana: 5, label: '02 Set - 08 Set', bloco: 'Bloco IV', abertura: '2026-09-02', revisao_port: '2026-09-03', revisao_mat: '2026-09-04', videoaula_port: '2026-09-05', fixacao_port: '2026-09-05', videoaula_mat: '2026-09-07', fixacao_mat: '2026-09-08' },
    { semana: 6, label: '09 Set - 15 Set', bloco: 'Bloco V / Revisão', abertura: '2026-09-09', revisao_port: '2026-09-10', revisao_mat: '2026-09-11', fixacao_port: '2026-09-12', fixacao_mat: '2026-09-12', videoaula_port: '2026-09-14', videoaula_mat: '2026-09-15' },
    { semana: 7, label: '16 Set', bloco: 'Simulado', abertura: '2026-09-16' },
  ],
  'Turma de Quinta-feira': [
    { semana: 1, label: '06 Ago - 12 Ago', bloco: 'Abertura', abertura: '2026-08-06', videoaula_port: '2026-08-07', fixacao_port: '2026-08-08', videoaula_mat: '2026-08-10', fixacao_mat: '2026-08-11' },
    { semana: 2, label: '13 Ago - 19 Ago', bloco: 'Bloco I', abertura: '2026-08-13', revisao_port: '2026-08-14', revisao_mat: '2026-08-15', videoaula_port: '2026-08-17', fixacao_port: '2026-08-18', videoaula_mat: '2026-08-19', fixacao_mat: '2026-08-19' },
    { semana: 3, label: '20 Ago - 26 Ago', bloco: 'Bloco II', abertura: '2026-08-20', revisao_port: '2026-08-21', revisao_mat: '2026-08-22', videoaula_port: '2026-08-24', fixacao_port: '2026-08-25', videoaula_mat: '2026-08-26', fixacao_mat: '2026-08-26' },
    { semana: 4, label: '27 Ago - 02 Set', bloco: 'Bloco III', abertura: '2026-08-27', revisao_port: '2026-08-28', revisao_mat: '2026-08-29', videoaula_port: '2026-08-31', fixacao_port: '2026-09-01', videoaula_mat: '2026-09-02', fixacao_mat: '2026-09-02' },
    { semana: 5, label: '03 Set - 09 Set', bloco: 'Bloco IV', abertura: '2026-09-03', revisao_port: '2026-09-04', revisao_mat: '2026-09-05', videoaula_port: '2026-09-07', fixacao_port: '2026-09-08', videoaula_mat: '2026-09-09', fixacao_mat: '2026-09-09' },
    { semana: 6, label: '10 Set - 16 Set', bloco: 'Bloco V / Revisão', abertura: '2026-09-10', revisao_port: '2026-09-11', revisao_mat: '2026-09-12', fixacao_port: '2026-09-14', fixacao_mat: '2026-09-15', videoaula_port: '2026-09-16', videoaula_mat: '2026-09-16' },
    { semana: 7, label: '17 Set', bloco: 'Simulado', abertura: '2026-09-17' },
  ],
  'T6, T7 e T8 - Sexta-feira Tarde': [
    { semana: 1, label: '07 Ago - 13 Ago', bloco: 'Abertura', abertura: '2026-08-07', videoaula_port: '2026-08-08', fixacao_port: '2026-08-10', videoaula_mat: '2026-08-11', fixacao_mat: '2026-08-12' },
    { semana: 2, label: '14 Ago - 20 Ago', bloco: 'Bloco I', abertura: '2026-08-14', revisao_port: '2026-08-15', revisao_mat: '2026-08-17', videoaula_port: '2026-08-18', fixacao_port: '2026-08-19', videoaula_mat: '2026-08-20', fixacao_mat: '2026-08-20' },
    { semana: 3, label: '21 Ago - 27 Ago', bloco: 'Bloco II', abertura: '2026-08-21', revisao_port: '2026-08-22', revisao_mat: '2026-08-24', videoaula_port: '2026-08-25', fixacao_port: '2026-08-26', videoaula_mat: '2026-08-27', fixacao_mat: '2026-08-27' },
    { semana: 4, label: '28 Ago - 03 Set', bloco: 'Bloco III', abertura: '2026-08-28', revisao_port: '2026-08-29', revisao_mat: '2026-08-31', videoaula_port: '2026-09-01', fixacao_port: '2026-09-02', videoaula_mat: '2026-09-03', fixacao_mat: '2026-09-03' },
    { semana: 5, label: '04 Set - 10 Set', bloco: 'Bloco IV', abertura: '2026-09-04', revisao_port: '2026-09-05', revisao_mat: '2026-09-07', videoaula_port: '2026-09-08', fixacao_port: '2026-09-09', videoaula_mat: '2026-09-10', fixacao_mat: '2026-09-10' },
    { semana: 6, label: '11 Set - 17 Set', bloco: 'Bloco V / Revisão', abertura: '2026-09-11', revisao_port: '2026-09-12', revisao_mat: '2026-09-14', fixacao_port: '2026-09-15', fixacao_mat: '2026-09-16', videoaula_port: '2026-09-17', videoaula_mat: '2026-09-17' },
    { semana: 7, label: '18 Set', bloco: 'Simulado', abertura: '2026-09-18' },
  ],
  'T9, T10 e T11 - Sábado Manhã': [
    { semana: 1, label: '08 Ago - 14 Ago', bloco: 'Abertura', abertura: '2026-08-08', videoaula_port: '2026-08-10', fixacao_port: '2026-08-11', videoaula_mat: '2026-08-12', fixacao_mat: '2026-08-13' },
    { semana: 2, label: '15 Ago - 21 Ago', bloco: 'Bloco I', abertura: '2026-08-15', revisao_port: '2026-08-17', revisao_mat: '2026-08-18', videoaula_port: '2026-08-19', fixacao_port: '2026-08-20', videoaula_mat: '2026-08-21', fixacao_mat: '2026-08-21' },
    { semana: 3, label: '22 Ago - 28 Ago', bloco: 'Bloco II', abertura: '2026-08-22', revisao_port: '2026-08-24', revisao_mat: '2026-08-25', videoaula_port: '2026-08-26', fixacao_port: '2026-08-27', videoaula_mat: '2026-08-28', fixacao_mat: '2026-08-28' },
    { semana: 4, label: '29 Ago - 04 Set', bloco: 'Bloco III', abertura: '2026-08-29', revisao_port: '2026-08-31', revisao_mat: '2026-09-01', videoaula_port: '2026-09-02', fixacao_port: '2026-09-03', videoaula_mat: '2026-09-04', fixacao_mat: '2026-09-04' },
    { semana: 5, label: '05 Set - 11 Set', bloco: 'Bloco IV', abertura: '2026-09-05', revisao_port: '2026-09-07', revisao_mat: '2026-09-08', videoaula_port: '2026-09-09', fixacao_port: '2026-09-10', videoaula_mat: '2026-09-11', fixacao_mat: '2026-09-11' },
    { semana: 6, label: '12 Set - 18 Set', bloco: 'Bloco V / Revisão', abertura: '2026-09-12', revisao_port: '2026-09-14', revisao_mat: '2026-09-15', fixacao_port: '2026-09-16', fixacao_mat: '2026-09-17', videoaula_port: '2026-09-18', videoaula_mat: '2026-09-18' },
    { semana: 7, label: '19 Set', bloco: 'Simulado', abertura: '2026-09-19' },
  ],
};

export async function seedCronogramaOficial() {
  console.log('🌱 [Seed Cronograma] Iniciando o povoamento oficial — Calendário Pré-CMT 03/08 a 19/09/2026...');

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 0. Garantir estrutura da tabela
    await client.query(`
      ALTER TABLE turmas ADD COLUMN IF NOT EXISTS data_inicio DATE DEFAULT '2026-08-03';
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

    // Garantir colunas que podem faltar em tabelas criadas por migrações anteriores
    await client.query(`ALTER TABLE cronograma_atividades ADD COLUMN IF NOT EXISTS data_liberacao DATE;`);
    await client.query(`ALTER TABLE cronograma_atividades ADD COLUMN IF NOT EXISTS dia_semana VARCHAR(20);`);
    await client.query(`ALTER TABLE cronograma_atividades ADD COLUMN IF NOT EXISTS subtarefas JSONB DEFAULT '[]'::jsonb;`);

    // 1. Renomear turmas (tolerante a espaços invisíveis e variações com TRIM e ILIKE)
    console.log('📝 [Seed Cronograma] Atualizando nomenclatura das turmas (TRIM + ILIKE)...');
    const updates = [
      { newName: 'T5 - Quarta-feira Manhã', where: "TRIM(nome) ILIKE '%5A Manhã 2025%'" },
      { newName: 'T1 - Segunda-feira', where: "TRIM(nome) ILIKE '%5A Manhã%' AND TRIM(nome) NOT ILIKE '%2025%'" },
      { newName: 'T2 - Terça-feira', where: "TRIM(nome) ILIKE '%5B Tarde%'" },
      { newName: 'T3 - Quarta-feira', where: "TRIM(nome) ILIKE '%5C Manhã%'" },
    ];

    for (const u of updates) {
      const res = await client.query(`UPDATE turmas SET nome = $1 WHERE ${u.where}`, [u.newName]);
      if (res.rowCount && res.rowCount > 0) {
        console.log(`  ✅ Atualizado para "${u.newName}" (${res.rowCount} turma(s))`);
      }
    }

    for (const [oldName, newName] of Object.entries(TURMA_RENAMES)) {
      const res = await client.query(
        `UPDATE turmas SET nome = $1 WHERE TRIM(nome) = $2`,
        [newName, oldName]
      );
      if (res.rowCount && res.rowCount > 0) {
        console.log(`  ✅ "${oldName}" → "${newName}"`);
      }
    }

    // 2. Buscar turmas cadastradas
    const turmasRes = await client.query(`SELECT id, nome FROM turmas`);
    if (turmasRes.rows.length === 0) {
      console.warn('⚠️ [Seed Cronograma] Nenhuma turma encontrada.');
      await client.query('ROLLBACK');
      return { success: false, message: 'Nenhuma turma encontrada na tabela turmas.' };
    }

    console.log(`📌 Encontradas ${turmasRes.rows.length} turmas: ${turmasRes.rows.map((t: any) => t.nome).join(', ')}`);

    // 3. Limpar cronogramas antigos
    await client.query(`DELETE FROM cronograma_atividades`);

    // 4. Para cada turma no banco, verificar se temos cronograma definido
    const relatorio: string[] = [];

    for (const turma of turmasRes.rows) {
      const semanas = CRONOGRAMA[turma.nome as string];

      if (!semanas) {
        console.warn(`⚠️ Turma "${turma.nome}" não tem cronograma mapeado — pulando.`);
        relatorio.push(`⚠️ Turma "${turma.nome}" sem cronograma definido.`);
        continue;
      }

      // Atualizar data_inicio da turma (primeiro dia da semana 1)
      const dataInicio = semanas[0].abertura;
      await client.query(`UPDATE turmas SET data_inicio = $1 WHERE id = $2`, [dataInicio, turma.id]);

      let atividadesInseridas = 0;

      for (const sem of semanas) {
        const atividades = buildAtividades(sem);
        for (const ativ of atividades) {
          await client.query(
            `INSERT INTO cronograma_atividades (
              turma_id, semana_numero, datas_semana, ordem, tipo, disciplina,
              bloco, titulo, xp_total, subtarefas, data_liberacao, dia_semana
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12)`,
            [
              turma.id,
              sem.semana,
              sem.label,
              ativ.ordem,
              ativ.tipo,
              ativ.disciplina,
              sem.bloco,
              ativ.titulo,
              ativ.xp,
              JSON.stringify(ativ.subtarefas),
              ativ.data_liberacao,
              ativ.dia_semana,
            ]
          );
          atividadesInseridas++;
        }
      }

      relatorio.push(`✅ "${turma.nome}" — ${atividadesInseridas} atividades injetadas (7 semanas).`);
      console.log(`✅ "${turma.nome}" — ${atividadesInseridas} atividades.`);
    }

    await client.query('COMMIT');
    console.log('🎉 [Seed Cronograma] Povoamento concluído com sucesso!');
    return { success: true, relatorio };
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('❌ [Seed Cronograma] Erro:', err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Gera a lista de atividades para uma semana com base nas datas do calendário.
 * Cada atividade tem data_liberacao individual para drip content preciso.
 */
function buildAtividades(sem: SemanaCalendario) {
  const atividades: Array<{
    ordem: number;
    tipo: string;
    disciplina: string;
    titulo: string;
    xp: number;
    subtarefas: any[];
    data_liberacao: string;
    dia_semana: string;
  }> = [];

  const w = sem.semana;

  if (sem.bloco === 'Simulado') {
    atividades.push({
      ordem: 1,
      tipo: 'simulado',
      disciplina: 'Geral',
      titulo: 'Simulado Final — Blocos I a V (Português e Matemática)',
      xp: 50,
      subtarefas: [
        { id: `s${w}-sim1`, titulo: 'Realizar o Simulado no tempo oficial', status: 'pendente' },
        { id: `s${w}-sim2`, titulo: 'Entregar folha de respostas', status: 'pendente' },
      ],
      data_liberacao: sem.abertura,
      dia_semana: getDiaSemana(sem.abertura),
    });
    return atividades;
  }

  // Bloco identificador para títulos
  const blocoLabel = sem.bloco === 'Abertura' ? '' : ` — ${sem.bloco}`;
  let ordem = 0;

  // 1. Aula Presencial / Abertura
  ordem++;
  atividades.push({
    ordem,
    tipo: 'presencial',
    disciplina: 'Geral',
    titulo: sem.bloco === 'Abertura'
      ? 'Abertura do Curso — Apresentação e Entrega da Apostila'
      : `Aula Presencial${blocoLabel} — Português e Matemática`,
    xp: 15,
    subtarefas: [
      { id: `s${w}-pres1`, titulo: 'Presença e Pontualidade Confirmadas', status: 'pendente' },
      { id: `s${w}-pres2`, titulo: 'Anotações no Caderno de Bordo', status: 'pendente' },
    ],
    data_liberacao: sem.abertura,
    dia_semana: getDiaSemana(sem.abertura),
  });

  // 2. Videoaula Português (se existir data)
  if (sem.videoaula_port) {
    ordem++;
    atividades.push({
      ordem,
      tipo: 'videoaula',
      disciplina: 'Português',
      titulo: sem.bloco === 'Abertura'
        ? 'Preparação — Videoaula Português, Bloco I'
        : sem.bloco.includes('Revisão')
          ? 'Revisão para o Simulado — Videoaula Português'
          : `Preparação — Videoaula Português, ${sem.bloco}`,
      xp: 15,
      subtarefas: [
        { id: `s${w}-vp1`, titulo: 'Assistir à Videoaula Completa (80%+)', status: 'pendente' },
        { id: `s${w}-vp2`, titulo: 'Fazer os registros solicitados', status: 'pendente' },
      ],
      data_liberacao: sem.videoaula_port,
      dia_semana: getDiaSemana(sem.videoaula_port),
    });
  }

  // 3. Fixação/Apostila Português (se existir)
  if (sem.fixacao_port) {
    ordem++;
    atividades.push({
      ordem,
      tipo: 'fixacao',
      disciplina: 'Português',
      titulo: sem.bloco === 'Abertura'
        ? 'Preparação — Apostila Português, Bloco I'
        : sem.bloco.includes('Revisão')
          ? 'Revisão para o Simulado — Apostila Português'
          : `Apostila e Questões — Português, ${sem.bloco}`,
      xp: 25,
      subtarefas: [
        { id: `s${w}-fp1`, titulo: 'Estudar a apostila', status: 'pendente' },
        { id: `s${w}-fp2`, titulo: 'Responder às questões', status: 'pendente' },
      ],
      data_liberacao: sem.fixacao_port,
      dia_semana: getDiaSemana(sem.fixacao_port),
    });
  }

  // 4. Videoaula Matemática (se existir)
  if (sem.videoaula_mat) {
    ordem++;
    atividades.push({
      ordem,
      tipo: 'videoaula',
      disciplina: 'Matemática',
      titulo: sem.bloco === 'Abertura'
        ? 'Preparação — Videoaula Matemática, Bloco I'
        : sem.bloco.includes('Revisão')
          ? 'Revisão para o Simulado — Videoaula Matemática'
          : `Preparação — Videoaula Matemática, ${sem.bloco}`,
      xp: 15,
      subtarefas: [
        { id: `s${w}-vm1`, titulo: 'Assistir à Videoaula Completa (80%+)', status: 'pendente' },
        { id: `s${w}-vm2`, titulo: 'Fazer os registros solicitados', status: 'pendente' },
      ],
      data_liberacao: sem.videoaula_mat,
      dia_semana: getDiaSemana(sem.videoaula_mat),
    });
  }

  // 5. Fixação/Apostila Matemática (se existir)
  if (sem.fixacao_mat) {
    ordem++;
    atividades.push({
      ordem,
      tipo: 'fixacao',
      disciplina: 'Matemática',
      titulo: sem.bloco === 'Abertura'
        ? 'Preparação — Apostila Matemática, Bloco I'
        : sem.bloco.includes('Revisão')
          ? 'Revisão para o Simulado — Apostila Matemática'
          : `Apostila e Questões — Matemática, ${sem.bloco}`,
      xp: 25,
      subtarefas: [
        { id: `s${w}-fm1`, titulo: 'Estudar a apostila', status: 'pendente' },
        { id: `s${w}-fm2`, titulo: 'Responder às questões', status: 'pendente' },
      ],
      data_liberacao: sem.fixacao_mat,
      dia_semana: getDiaSemana(sem.fixacao_mat),
    });
  }

  // 6. Revisão Português (se existir)
  if (sem.revisao_port) {
    ordem++;
    atividades.push({
      ordem,
      tipo: 'revisao',
      disciplina: 'Português',
      titulo: sem.bloco.includes('Revisão')
        ? 'Revisão Final para o Simulado — Português (Blocos I a V)'
        : `Revisão — Português, ${sem.bloco}`,
      xp: 30,
      subtarefas: [
        { id: `s${w}-rp1`, titulo: 'Revisar o conteúdo estudado', status: 'pendente' },
        { id: `s${w}-rp2`, titulo: 'Analisar e compreender os erros', status: 'pendente' },
      ],
      data_liberacao: sem.revisao_port,
      dia_semana: getDiaSemana(sem.revisao_port),
    });
  }

  // 7. Revisão Matemática (se existir)
  if (sem.revisao_mat) {
    ordem++;
    atividades.push({
      ordem,
      tipo: 'revisao',
      disciplina: 'Matemática',
      titulo: sem.bloco.includes('Revisão')
        ? 'Revisão Final para o Simulado — Matemática (Blocos I a V)'
        : `Revisão — Matemática, ${sem.bloco}`,
      xp: 30,
      subtarefas: [
        { id: `s${w}-rm1`, titulo: 'Revisar o conteúdo estudado', status: 'pendente' },
        { id: `s${w}-rm2`, titulo: 'Analisar e compreender os erros', status: 'pendente' },
      ],
      data_liberacao: sem.revisao_mat,
      dia_semana: getDiaSemana(sem.revisao_mat),
    });
  }

  return atividades;
}

/** Helper: converte 'YYYY-MM-DD' para o nome do dia da semana em português */
function getDiaSemana(dateStr: string): string {
  const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const d = new Date(dateStr + 'T12:00:00'); // noon to avoid timezone issues
  return dias[d.getDay()];
}
