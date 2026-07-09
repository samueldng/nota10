import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await query(`
      SELECT id, data, acompanhamento, turma, aluno, disciplina, bloco, professor, origem, status,
             lancado_por, editado_por, data_edicao
      FROM registros_lancados
      ORDER BY id DESC
    `);

    const formatted = result.rows.map(row => ({
      id: row.id,
      data: row.data,
      acompanhamento: row.acompanhamento,
      turma: row.turma,
      aluno: row.aluno,
      disciplina: row.disciplina,
      bloco: row.bloco,
      professor: row.professor,
      origem: row.origem,
      status: row.status,
      lancadoPor: row.lancado_por,
      editadoPor: row.editado_por || undefined,
      dataEdicao: row.data_edicao || undefined,
    }));

    return NextResponse.json(formatted);
  } catch (err: any) {
    console.error('Error fetching registrations:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { getClient } = require('@/lib/db');
  const client = await getClient();

  try {
    const body = await request.json();
    const {
      data,
      acompanhamento,
      turma,
      aluno,
      disciplina,
      bloco,
      professor,
      origem,
      status,
      lancadoPor,
      editadoPor,
      dataEdicao,
      alunos // Opcional array de alunos com notas
    } = body;

    if (!data || !acompanhamento || !turma || !aluno || !disciplina || !professor || !lancadoPor) {
      client.release();
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO registros_lancados (
        data, acompanhamento, turma, aluno, disciplina, bloco, professor, origem, status,
        lancado_por, editado_por, data_edicao
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        data,
        acompanhamento,
        turma,
        aluno,
        disciplina,
        bloco || null,
        professor,
        origem || 'manual',
        status || 'salvo',
        lancadoPor,
        editadoPor || null,
        dataEdicao || null,
      ]
    );

    const row = result.rows[0];

    // O array de alunos detalhados foi descontinuado neste fluxo 
    // já que a tabela registro_alunos não existe mais. A estrutura
    // agora é plana na tabela registros_lancados.

    await client.query('COMMIT');
    client.release();

    return NextResponse.json({
      id: row.id,
      data: row.data,
      acompanhamento: row.acompanhamento,
      turma: row.turma,
      aluno: row.aluno,
      disciplina: row.disciplina,
      bloco: row.bloco,
      professor: row.professor,
      origem: row.origem,
      status: row.status,
      lancadoPor: row.lancado_por,
      editadoPor: row.editado_por || undefined,
      dataEdicao: row.data_edicao || undefined,
    }, { status: 201 });
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    client.release();
    console.error('Erro no POST /api/registros:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao salvar o registro no banco de dados.' },
      { status: 500 }
    );
  }
}


export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      data,
      acompanhamento,
      turma,
      aluno,
      disciplina,
      bloco,
      professor,
      origem,
      status,
      lancadoPor,
      editadoPor,
      dataEdicao
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Identificador do registro ausente.' }, { status: 400 });
    }

    const result = await query(
      `UPDATE registros_lancados SET
        data = $1, 
        acompanhamento = $2, 
        turma = $3, 
        aluno = $4, 
        disciplina = $5, 
        bloco = $6, 
        professor = $7,
        origem = $8, 
        status = $9, 
        lancado_por = $10, 
        editado_por = $11, 
        data_edicao = $12
      WHERE id = $13 RETURNING *`,
      [
        data,
        acompanhamento,
        turma,
        aluno,
        disciplina,
        bloco,
        professor,
        origem,
        status,
        lancadoPor,
        editadoPor || null,
        dataEdicao || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Registro não encontrado.' }, { status: 404 });
    }

    const row = result.rows[0];

    return NextResponse.json({
      id: row.id,
      data: row.data,
      acompanhamento: row.acompanhamento,
      turma: row.turma,
      aluno: row.aluno,
      disciplina: row.disciplina,
      bloco: row.bloco,
      professor: row.professor,
      origem: row.origem,
      status: row.status,
      lancadoPor: row.lancado_por,
      editadoPor: row.editado_por || undefined,
      dataEdicao: row.data_edicao || undefined,
    });
  } catch (err: any) {
    console.error('Erro no PUT /api/registros:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao atualizar o registro no banco de dados.' },
      { status: 500 }
    );
  }
}
