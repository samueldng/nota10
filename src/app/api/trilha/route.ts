import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const alunoId = searchParams.get('alunoId');
  
  if (!alunoId) {
    return NextResponse.json({ error: 'alunoId é obrigatório' }, { status: 400 });
  }

  const hoje = new Date();
  hoje.setHours(0,0,0,0);

  // Fallback estruturado que obedece estritamente à ordem pedagógica exigida e ao Time-gating de servidor
  const mockSemanas = [
    {
      semana_numero: 1,
      datas_semana: '15 Jul - 21 Jul',
      liberada: true,
      atividades: [
        { id: 'mock-t1', ordem: 1, dia_semana: 'Segunda', tipo: 'presencial', disciplina: 'Geral', bloco: 'Bloco 1', titulo: 'Aula Presencial - Alinhamento & Disciplina', xp_total: 15, status: 'concluida', xp_ganho: 15 },
        { id: 'mock-t2', ordem: 2, dia_semana: 'Terça', tipo: 'revisao', disciplina: 'Português', bloco: 'Bloco 1', titulo: 'Revisão Corujinha - Sintaxe Inicial', xp_total: 30, status: 'em_andamento', xp_ganho: 0 },
        { id: 'mock-t3', ordem: 3, dia_semana: 'Quarta', tipo: 'videoaula', disciplina: 'Matemática', bloco: 'Bloco 1', titulo: 'Videoaula - Geometria & Teoremas', xp_total: 15, status: 'bloqueada', xp_ganho: 0 },
        { id: 'mock-t4', ordem: 4, dia_semana: 'Quinta', tipo: 'fixacao', disciplina: 'Português', bloco: 'Bloco 1', titulo: 'Apostila - Questões de Fixação Módulo 1', xp_total: 25, status: 'bloqueada', xp_ganho: 0 },
        { id: 'mock-t5', ordem: 5, dia_semana: 'Sábado', tipo: 'simulado', disciplina: 'Geral', bloco: 'Bloco 1', titulo: 'Conferência Semanal & Simulado', xp_total: 50, status: 'bloqueada', xp_ganho: 0 }
      ]
    },
    {
      semana_numero: 2,
      datas_semana: '22 Jul - 28 Jul',
      liberada: false, // Time-gating no servidor: travada (unlocked: false)
      atividades: [
        { id: 'mock-t6', ordem: 1, dia_semana: 'Segunda', tipo: 'presencial', disciplina: 'Geral', bloco: 'Bloco 2', titulo: 'Aula Presencial - Avanço de Conteúdo', xp_total: 15, status: 'bloqueada', xp_ganho: 0 },
        { id: 'mock-t7', ordem: 2, dia_semana: 'Terça', tipo: 'revisao', disciplina: 'Matemática', bloco: 'Bloco 2', titulo: 'Revisão Corujinha - Álgebra Básica', xp_total: 30, status: 'bloqueada', xp_ganho: 0 },
        { id: 'mock-t8', ordem: 3, dia_semana: 'Quarta', tipo: 'videoaula', disciplina: 'Português', bloco: 'Bloco 2', titulo: 'Videoaula - Concordância e Regência', xp_total: 15, status: 'bloqueada', xp_ganho: 0 },
        { id: 'mock-t9', ordem: 4, dia_semana: 'Quinta', tipo: 'fixacao', disciplina: 'Matemática', bloco: 'Bloco 2', titulo: 'Apostila - Questões de Fixação Módulo 2', xp_total: 25, status: 'bloqueada', xp_ganho: 0 },
        { id: 'mock-t10', ordem: 5, dia_semana: 'Sábado', tipo: 'simulado', disciplina: 'Geral', bloco: 'Bloco 2', titulo: 'Conferência Semanal & Simulado II', xp_total: 50, status: 'bloqueada', xp_ganho: 0 }
      ]
    },
    {
      semana_numero: 3,
      datas_semana: '29 Jul - 04 Ago',
      liberada: false,
      atividades: [
        { id: 'mock-t11', ordem: 1, dia_semana: 'Segunda', tipo: 'presencial', disciplina: 'Geral', bloco: 'Bloco 3', titulo: 'Aula Presencial - Aprofundamento', xp_total: 15, status: 'bloqueada', xp_ganho: 0 },
        { id: 'mock-t12', ordem: 2, dia_semana: 'Terça', tipo: 'revisao', disciplina: 'Português', bloco: 'Bloco 3', titulo: 'Revisão Corujinha - Pontuação & Crase', xp_total: 30, status: 'bloqueada', xp_ganho: 0 },
        { id: 'mock-t13', ordem: 3, dia_semana: 'Quarta', tipo: 'videoaula', disciplina: 'Matemática', bloco: 'Bloco 3', titulo: 'Videoaula - Funções & Equações', xp_total: 15, status: 'bloqueada', xp_ganho: 0 },
        { id: 'mock-t14', ordem: 4, dia_semana: 'Quinta', tipo: 'fixacao', disciplina: 'Português', bloco: 'Bloco 3', titulo: 'Apostila - Questões de Fixação Módulo 3', xp_total: 25, status: 'bloqueada', xp_ganho: 0 },
        { id: 'mock-t15', ordem: 5, dia_semana: 'Sábado', tipo: 'simulado', disciplina: 'Geral', bloco: 'Bloco 3', titulo: 'Conferência Semanal & Simulado III', xp_total: 50, status: 'bloqueada', xp_ganho: 0 }
      ]
    },
    {
      semana_numero: 4,
      datas_semana: '05 Ago - 11 Ago',
      liberada: false,
      atividades: [
        { id: 'mock-t16', ordem: 1, dia_semana: 'Segunda', tipo: 'presencial', disciplina: 'Geral', bloco: 'Bloco 4', titulo: 'Aula Presencial - Revisão Final', xp_total: 15, status: 'bloqueada', xp_ganho: 0 },
        { id: 'mock-t17', ordem: 2, dia_semana: 'Terça', tipo: 'revisao', disciplina: 'Geral', bloco: 'Bloco 4', titulo: 'Revisão Corujinha - Mega Maratona', xp_total: 30, status: 'bloqueada', xp_ganho: 0 },
        { id: 'mock-t18', ordem: 3, dia_semana: 'Quarta', tipo: 'videoaula', disciplina: 'Geral', bloco: 'Bloco 4', titulo: 'Videoaula - Estratégias de Prova', xp_total: 15, status: 'bloqueada', xp_ganho: 0 },
        { id: 'mock-t19', ordem: 4, dia_semana: 'Quinta', tipo: 'fixacao', disciplina: 'Geral', bloco: 'Bloco 4', titulo: 'Apostila - Questões de Fixação Final', xp_total: 25, status: 'bloqueada', xp_ganho: 0 },
        { id: 'mock-t20', ordem: 5, dia_semana: 'Sábado', tipo: 'simulado', disciplina: 'Geral', bloco: 'Bloco 4', titulo: 'Simulado Final e Formatura', xp_total: 100, status: 'bloqueada', xp_ganho: 0 }
      ]
    }
  ];

  if (!isUuid(String(alunoId))) {
    return NextResponse.json({
      semanas: mockSemanas,
      turmaNome: 'Turma Pré-CMT A (Modo Teste)'
    });
  }

  try {
    const alunoRes = await query(
      `SELECT m.turma_id, t.nome as turma_nome
       FROM matriculas m
       JOIN turmas t ON m.turma_id = t.id
       WHERE m.aluno_id = $1 LIMIT 1`,
      [alunoId]
    );

    if (alunoRes.rows.length === 0) {
      return NextResponse.json({ semanas: mockSemanas, turmaNome: 'Turma Geral' });
    }

    const turmaId = alunoRes.rows[0].turma_id;

    const trilhaRes = await query(
      `SELECT 
         c.id, c.semana_numero, c.datas_semana, c.ordem, c.tipo, c.disciplina, c.bloco, c.titulo, c.xp_total, c.data_liberacao, c.dia_semana,
         COALESCE(p.status, 'bloqueada') as status,
         p.xp_ganho
       FROM cronograma_atividades c
       LEFT JOIN atividades_progresso p ON c.id::text = p.atividade_id AND p.aluno_id = $1
       WHERE c.turma_id = $2
       ORDER BY c.semana_numero ASC, c.ordem ASC`,
      [alunoId, turmaId]
    );

    if (trilhaRes.rows.length === 0) {
      return NextResponse.json({ semanas: mockSemanas, turmaNome: alunoRes.rows[0].turma_nome });
    }

    const semanasMap = new Map();

    for (const row of trilhaRes.rows) {
      if (!semanasMap.has(row.semana_numero)) {
        let liberada = false;
        
        if (row.data_liberacao) {
          const dtLiberacao = new Date(row.data_liberacao);
          dtLiberacao.setHours(0,0,0,0);
          if (hoje >= dtLiberacao) liberada = true;
        } else {
          if (row.semana_numero === 1) liberada = true;
        }

        semanasMap.set(row.semana_numero, {
          semana_numero: row.semana_numero,
          datas_semana: row.datas_semana || `Semana ${row.semana_numero}`,
          liberada: liberada,
          atividades: []
        });
      }

      const semana = semanasMap.get(row.semana_numero);
      const statusFinal = semana.liberada ? row.status : 'bloqueada';

      semana.atividades.push({
        id: row.id,
        ordem: row.ordem,
        dia_semana: row.dia_semana,
        tipo: row.tipo,
        disciplina: row.disciplina,
        bloco: row.bloco,
        titulo: row.titulo,
        xp_total: row.xp_total,
        status: statusFinal,
        xp_ganho: row.xp_ganho || 0
      });
    }

    return NextResponse.json({ 
      semanas: Array.from(semanasMap.values()),
      turmaNome: alunoRes.rows[0].turma_nome
    });
  } catch (error: any) {
    console.error('Erro ao buscar trilha:', error);
    return NextResponse.json({ error: 'Erro interno na trilha' }, { status: 500 });
  }
}
