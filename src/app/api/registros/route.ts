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
  try {
    const body = await request.json();
    const {
      data, acompanhamento, turma, aluno, disciplina, bloco, professor, origem, status,
      lancadoPor, editadoPor, dataEdicao
    } = body;

    const result = await query(
      `INSERT INTO registros_lancados (
        data, acompanhamento, turma, aluno, disciplina, bloco, professor, origem, status,
        lancado_por, editado_por, data_edicao
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [
        data,
        acompanhamento,
        turma,
        aluno,
        disciplina,
        bloco,
        professor,
        origem || 'manual',
        status || 'salvo',
        lancadoPor,
        editadoPor || null,
        dataEdicao || null,
      ]
    );

    const insertedId = result.rows[0].id;

    return NextResponse.json({
      id: insertedId,
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
    });
  } catch (err: any) {
    console.error('Error creating registration:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id, data, acompanhamento, turma, aluno, disciplina, bloco, professor, origem, status,
      lancadoPor, editadoPor, dataEdicao
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing registration ID' }, { status: 400 });
    }

    await query(
      `UPDATE registros_lancados SET
        data = $1, acompanhamento = $2, turma = $3, aluno = $4, disciplina = $5, bloco = $6, professor = $7,
        origem = $8, status = $9, lancado_por = $10, editado_por = $11, data_edicao = $12
      WHERE id = $13`,
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

    return NextResponse.json({
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
      dataEdicao,
    });
  } catch (err: any) {
    console.error('Error updating registration:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
