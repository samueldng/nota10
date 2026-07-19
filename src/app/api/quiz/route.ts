import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function ensureTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS questoes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      disciplina VARCHAR(100) NOT NULL,
      bloco VARCHAR(50),
      enunciado TEXT NOT NULL,
      tipo VARCHAR(30) NOT NULL DEFAULT 'multipla_escolha',
      alternativas JSONB NOT NULL,
      resposta_correta VARCHAR(10) NOT NULL,
      explicacao TEXT,
      xp_valor INT NOT NULL DEFAULT 10,
      ordem INT DEFAULT 0,
      atividade_ref VARCHAR(150),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

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
  `);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const disciplina = searchParams.get('disciplina');
    const bloco = searchParams.get('bloco');
    const limite = parseInt(searchParams.get('limite') || '5', 10);

    await ensureTables();

    // 1. Verificar se há questões cadastradas para o critério
    let sql = `SELECT id, disciplina, bloco, enunciado, tipo, alternativas, resposta_correta, explicacao, xp_valor 
               FROM questoes WHERE 1=1`;
    const params: any[] = [];
    let idx = 1;

    if (disciplina && disciplina !== 'todas') {
      sql += ` AND disciplina = $${idx++}`;
      params.push(disciplina);
    }
    if (bloco && bloco !== 'todos') {
      sql += ` AND bloco = $${idx++}`;
      params.push(bloco);
    }

    sql += ` ORDER BY RANDOM() LIMIT $${idx}`;
    params.push(limite);

    const res = await query(sql, params);

    // Se o banco tiver questões, retorne-as prontas para o quiz
    if (res.rows.length > 0) {
      return NextResponse.json({
        id: 'quiz-dinamico-' + Date.now(),
        titulo: disciplina && disciplina !== 'todas' ? `Revisão de ${disciplina}` : 'Desafio Geral Corujinha',
        disciplina: disciplina || 'Geral',
        xp_base: res.rows.reduce((acc: number, q: any) => acc + (q.xp_valor || 10), 0),
        questoes: res.rows
      });
    }

    // Se não houver questões cadastradas no banco ainda, retorne um set inicial de fallback estruturado para a UI não ficar vazia
    const fallbackQuestoes = [
      {
        id: 'mock-q1',
        disciplina: disciplina || 'Português',
        bloco: bloco || 'Bloco 1',
        enunciado: 'Em "O militar instruiu a tropa com precisão", qual é a função sintática do termo "com precisão"?',
        tipo: 'multipla_escolha',
        alternativas: [
          { id: 'A', texto: 'Objeto indireto' },
          { id: 'B', texto: 'Adjunto adverbial de modo' },
          { id: 'C', texto: 'Complemento nominal' },
          { id: 'D', texto: 'Predicativo do sujeito' }
        ],
        resposta_correta: 'B',
        explicacao: 'O termo "com precisão" indica o modo como a instrução foi dada, classificando-se como adjunto adverbial de modo.',
        xp_valor: 15
      },
      {
        id: 'mock-q2',
        disciplina: disciplina || 'Português',
        bloco: bloco || 'Bloco 1',
        enunciado: 'A palavra "EXCELÊNCIA" possui três sílabas e é classificada como paroxítona.',
        tipo: 'verdadeiro_falso',
        alternativas: [
          { id: 'V', texto: 'Verdadeiro' },
          { id: 'F', texto: 'Falso' }
        ],
        resposta_correta: 'F',
        explicacao: 'Falso. A separação silábica correta é EX-CE-LÊN-CIA (4 sílabas ou 5 se considerada proparoxítona eventual), sendo paroxítona ou proparoxítona, mas nunca trissílaba.',
        xp_valor: 10
      },
      {
        id: 'mock-q3',
        disciplina: disciplina || 'Matemática',
        bloco: bloco || 'Bloco 1',
        enunciado: 'Um pelotão com 40 cadetes realiza uma marcha. Se 35% deles possuem medalha de honra, quantos cadetes não possuem medalha?',
        tipo: 'multipla_escolha',
        alternativas: [
          { id: 'A', texto: '14 cadetes' },
          { id: 'B', texto: '26 cadetes' },
          { id: 'C', texto: '24 cadetes' },
          { id: 'D', texto: '30 cadetes' }
        ],
        resposta_correta: 'B',
        explicacao: 'Se 35% têm medalha, então 65% não têm. 65% de 40 = 0,65 * 40 = 26 cadetes.',
        xp_valor: 20
      }
    ];

    return NextResponse.json({
      id: 'quiz-fallback-corujinha',
      titulo: `Revisão Gamificada (${disciplina && disciplina !== 'todas' ? disciplina : 'Multidisciplinar'})`,
      disciplina: disciplina || 'Geral',
      xp_base: 45,
      questoes: fallbackQuestoes
    });
  } catch (error: any) {
    console.error('Erro ao gerar quiz Corujinha:', error);
    return NextResponse.json({ error: 'Erro interno na geração do quiz' }, { status: 500 });
  }
}
