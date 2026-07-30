'use server';

import { query } from '@/lib/db';

export async function getKpisGlobais() {
  // 1. XP Global Gerado na Semana (Últimos 7 dias)
  const xpRes = await query(`
    SELECT COALESCE(SUM(xp_ganho), 0) as total_xp
    FROM aluno_progresso
    WHERE created_at >= NOW() - INTERVAL '7 days'
  `);
  
  const totalXp = parseInt(xpRes.rows[0]?.total_xp || 0, 10);

  // 2. Taxa de Assiduidade Ativa no Mês Corrente
  // A coluna data em registros_lancados é YYYY-MM-DD text
  const d = new Date();
  const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  
  const presencaRes = await query(`
    SELECT presenca, COUNT(*) as qtd
    FROM registros_lancados
    WHERE data >= $1
    GROUP BY presenca
  `, [firstDay]);

  let presentes = 0;
  let faltas = 0;

  presencaRes.rows.forEach(r => {
    if (r.presenca === 'Presente') presentes += parseInt(r.qtd, 10);
    else if (r.presenca === 'Falta') faltas += parseInt(r.qtd, 10);
  });

  const totalAulas = presentes + faltas;
  const taxaAssiduidade = totalAulas > 0 ? Math.round((presentes / totalAulas) * 100) : 0;

  return {
    xpSemana: totalXp,
    taxaAssiduidade
  };
}

export async function getMetricasTurma() {
  // Ranking de XP por Turma
  const res = await query(`
    SELECT t.nome as name, COALESCE(SUM(a.xp_total), 0) as xp
    FROM turmas t
    LEFT JOIN alunos a ON a.turma_id = t.id
    GROUP BY t.nome
    ORDER BY xp DESC
    LIMIT 10
  `);

  return res.rows.map(r => ({
    name: r.name,
    xp: parseInt(r.xp, 10)
  }));
}

export async function getDistribuicaoPraticar() {
  // Distribuição qualitativa (Excelente, Bom, Regular, etc) na coluna praticar
  const res = await query(`
    SELECT praticar as name, COUNT(*) as value
    FROM registros_lancados
    WHERE praticar IS NOT NULL AND praticar != ''
    GROUP BY praticar
    ORDER BY value DESC
  `);

  return res.rows.map(r => ({
    name: r.name,
    value: parseInt(r.value, 10)
  }));
}

export async function getEvolucaoPresencas() {
  // Tendência temporal de faltas e presenças (Agrupado por Data e Presenca)
  const res = await query(`
    SELECT data, presenca, COUNT(*) as qtd
    FROM registros_lancados
    WHERE data IS NOT NULL
    GROUP BY data, presenca
    ORDER BY data ASC
    LIMIT 100
  `);

  // Transform to time series format expected by Recharts: { data: '2026-06-01', Presente: 10, Falta: 2 }
  const timeSeries: Record<string, any> = {};
  
  res.rows.forEach(r => {
    if (!timeSeries[r.data]) {
      timeSeries[r.data] = { date: r.data, Presente: 0, Falta: 0 };
    }
    if (r.presenca === 'Presente') timeSeries[r.data].Presente += parseInt(r.qtd, 10);
    if (r.presenca === 'Falta') timeSeries[r.data].Falta += parseInt(r.qtd, 10);
  });

  return Object.values(timeSeries).sort((a: any, b: any) => a.date.localeCompare(b.date));
}
