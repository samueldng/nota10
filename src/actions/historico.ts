'use server';

import { query } from '@/lib/db';

export type HistoricoParams = {
  page?: number;
  limit?: number;
  filtroAcomp?: string;
  filtroTurma?: string;
  filtroAluno?: string;
  filtroProfessor?: string;
  filtroDisciplina?: string;
  filtroStatus?: string;
};

// Dicionário mantido 100% no servidor
const getAcompLabel = (raw: string) => {
  if (!raw) return '';
  const map: Record<string, string> = {
    'pre_cmt_5': 'Pré-CMT 5º Ano',
    'projeto_4': 'Projeto 4º Ano',
    'reforco': 'Reforço Geral',
    'reforco_geral': 'Reforço Geral'
  };
  return map[raw.toLowerCase()] || raw;
};

export async function getHistoricoOptions() {
  const [resAcomp, resTurma, resAluno, resProf, resDisc, resStatus] = await Promise.all([
    query(`SELECT DISTINCT acompanhamento FROM registros_lancados WHERE acompanhamento IS NOT NULL ORDER BY acompanhamento`),
    query(`SELECT DISTINCT turma FROM registros_lancados WHERE turma IS NOT NULL ORDER BY turma`),
    query(`SELECT DISTINCT aluno FROM registros_lancados WHERE aluno IS NOT NULL ORDER BY aluno`),
    query(`SELECT DISTINCT professor FROM registros_lancados WHERE professor IS NOT NULL ORDER BY professor`),
    query(`SELECT DISTINCT disciplina FROM registros_lancados WHERE disciplina IS NOT NULL ORDER BY disciplina`),
    query(`SELECT DISTINCT status FROM registros_lancados WHERE status IS NOT NULL ORDER BY status`),
  ]);

  return {
    acompanhamentos: resAcomp.rows.map(r => ({ value: r.acompanhamento, label: getAcompLabel(r.acompanhamento) })),
    turmas: resTurma.rows.map(r => r.turma),
    alunos: resAluno.rows.map(r => r.aluno),
    professores: resProf.rows.map(r => r.professor),
    disciplinas: resDisc.rows.map(r => r.disciplina),
    status: resStatus.rows.map(r => r.status),
  };
}

export async function getHistoricoPaginado(params: HistoricoParams) {
  const page = params.page || 1;
  const limit = params.limit || 50;
  const offset = (page - 1) * limit;

  // Construção dinâmica de WHERE clauses parametrizadas (Prevenção de SQL Injection)
  const conditions = [];
  const values: any[] = [];
  let index = 1;

  if (params.filtroAcomp) {
    conditions.push(`acompanhamento = $${index++}`);
    values.push(params.filtroAcomp);
  }
  if (params.filtroTurma) {
    conditions.push(`turma = $${index++}`);
    values.push(params.filtroTurma);
  }
  if (params.filtroAluno) {
    conditions.push(`aluno = $${index++}`);
    values.push(params.filtroAluno);
  }
  if (params.filtroProfessor) {
    conditions.push(`professor = $${index++}`);
    values.push(params.filtroProfessor);
  }
  if (params.filtroDisciplina) {
    conditions.push(`disciplina = $${index++}`);
    values.push(params.filtroDisciplina);
  }
  if (params.filtroStatus) {
    conditions.push(`status = $${index++}`);
    values.push(params.filtroStatus);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sqlData = `
    SELECT 
      id, data, acompanhamento, turma, aluno, disciplina, bloco, professor, origem, status
    FROM registros_lancados
    ${whereClause}
    ORDER BY data DESC, id DESC
    LIMIT $${index} OFFSET $${index + 1};
  `;

  const sqlCount = `
    SELECT COUNT(*) as total
    FROM registros_lancados
    ${whereClause};
  `;

  const dataValues = [...values, limit, offset];
  
  const [dataRes, countRes] = await Promise.all([
    query(sqlData, dataValues),
    query(sqlCount, values)
  ]);

  const totalRegistros = parseInt(countRes.rows[0].total, 10);
  const totalPages = Math.ceil(totalRegistros / limit);

  // Data Transformation: Enviar strings já prontas para UI
  const registrosFormatados = dataRes.rows.map(row => ({
    ...row,
    acompanhamento: getAcompLabel(row.acompanhamento)
  }));

  return {
    registros: registrosFormatados,
    totalRegistros,
    totalPages,
    currentPage: page
  };
}
