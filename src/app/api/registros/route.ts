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

    // Se houver um array de alunos detalhados, faremos bulk insert na tabela registro_alunos
    if (alunos && Array.isArray(alunos) && alunos.length > 0) {
      const values = [];
      const params = [];
      let i = 1;
      
      for (const al of alunos) {
        values.push(`($${i}, $${i+1}, $${i+2}, $${i+3}, $${i+4}, $${i+5}, $${i+6}, $${i+7}, $${i+8}, $${i+9}, $${i+10}, $${i+11})`);
        params.push(
          row.id,
          al.alunoId,
          al.presenca || 'presente',
          al.video || null,
          al.palavraChave || null,
          al.fixacao || null,
          al.praticar || null,
          al.atencao || null,
          al.participacao || null,
          al.comportamento || null,
          al.pontualidade || null,
          al.observacao || null
        );
        i += 12;
      }

      await client.query(
        `INSERT INTO registro_alunos (
          registro_id, aluno_id, presenca, video, palavra_chave, fixacao, praticar,
          atencao, participacao, comportamento, pontualidade, observacao
        ) VALUES ${values.join(', ')}`,
        params
      );
    }

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
