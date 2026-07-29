import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function ensureTable() {
  await query(`
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
  `);
  
  await query(`
    ALTER TABLE questoes ADD COLUMN IF NOT EXISTS acompanhamento VARCHAR(50);
    ALTER TABLE questoes ADD COLUMN IF NOT EXISTS semana VARCHAR(50);
  `);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const acompanhamento = searchParams.get('acompanhamento');
    const disciplina = searchParams.get('disciplina');
    const bloco = searchParams.get('bloco');
    const semana = searchParams.get('semana');
    const atividadeRef = searchParams.get('atividadeRef');

    await ensureTable();

    let sql = `SELECT * FROM questoes WHERE 1=1`;
    const params: any[] = [];
    let idx = 1;

    if (acompanhamento && acompanhamento !== 'todos') {
      sql += ` AND acompanhamento = $${idx++}`;
      params.push(acompanhamento);
    }
    if (disciplina && disciplina !== 'todas') {
      sql += ` AND disciplina = $${idx++}`;
      params.push(disciplina);
    }
    if (bloco && bloco !== 'todos') {
      sql += ` AND bloco = $${idx++}`;
      params.push(bloco);
    }
    if (semana && semana !== 'todas') {
      sql += ` AND semana = $${idx++}`;
      params.push(semana);
    }
    if (atividadeRef) {
      sql += ` AND atividade_ref = $${idx++}`;
      params.push(atividadeRef);
    }

    sql += ` ORDER BY ordem ASC, created_at DESC`;

    const res = await query(sql, params);
    return NextResponse.json(res.rows);
  } catch (error: any) {
    console.error('Erro ao listar questões:', error);
    return NextResponse.json({ error: 'Erro interno ao listar questões' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      acompanhamento,
      disciplina,
      bloco,
      semana,
      enunciado,
      tipo = 'multipla_escolha',
      alternativas,
      resposta_correta,
      explicacao,
      xp_valor = 10,
      ordem = 0,
      atividade_ref = null
    } = body;

    if (!disciplina || !enunciado || !alternativas || !resposta_correta) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    await ensureTable();

    const res = await query(
      `INSERT INTO questoes (acompanhamento, disciplina, bloco, semana, enunciado, tipo, alternativas, resposta_correta, explicacao, xp_valor, ordem, atividade_ref)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        acompanhamento || null,
        disciplina,
        bloco || null,
        semana || null,
        enunciado,
        tipo,
        typeof alternativas === 'string' ? alternativas : JSON.stringify(alternativas),
        resposta_correta,
        explicacao || null,
        xp_valor,
        ordem,
        atividade_ref
      ]
    );

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar questão:', error);
    return NextResponse.json({ error: 'Erro interno ao criar questão: ' + error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      acompanhamento,
      disciplina,
      bloco,
      semana,
      enunciado,
      tipo,
      alternativas,
      resposta_correta,
      explicacao,
      xp_valor,
      ordem,
      atividade_ref
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
    }

    await ensureTable();

    const res = await query(
      `UPDATE questoes SET
         acompanhamento = COALESCE($1, acompanhamento),
         disciplina = COALESCE($2, disciplina),
         bloco = COALESCE($3, bloco),
         semana = COALESCE($4, semana),
         enunciado = COALESCE($5, enunciado),
         tipo = COALESCE($6, tipo),
         alternativas = COALESCE($7, alternativas),
         resposta_correta = COALESCE($8, resposta_correta),
         explicacao = COALESCE($9, explicacao),
         xp_valor = COALESCE($10, xp_valor),
         ordem = COALESCE($11, ordem),
         atividade_ref = COALESCE($12, atividade_ref)
       WHERE id = $13
       RETURNING *`,
      [
        acompanhamento,
        disciplina,
        bloco,
        semana,
        enunciado,
        tipo,
        alternativas ? (typeof alternativas === 'string' ? alternativas : JSON.stringify(alternativas)) : null,
        resposta_correta,
        explicacao,
        xp_valor,
        ordem,
        atividade_ref,
        id
      ]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Questão não encontrada' }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (error: any) {
    console.error('Erro ao atualizar questão:', error);
    return NextResponse.json({ error: 'Erro interno ao atualizar questão' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
    }

    await ensureTable();

    const res = await query(`DELETE FROM questoes WHERE id = $1 RETURNING id`, [id]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Questão não encontrada para exclusão' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error('Erro ao excluir questão:', error);
    return NextResponse.json({ error: 'Erro interno ao excluir questão' }, { status: 500 });
  }
}
