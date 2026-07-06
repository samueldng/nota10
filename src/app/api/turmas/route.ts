import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await query(`
      SELECT t.id, t.nome, t.acompanhamento, t.turno, t.dias, t.horario, t.disciplinas, t.status,
             (SELECT COUNT(*)::int FROM alunos a WHERE a.turma_id = t.id) as alunos_count,
             COALESCE(
               array_to_json(array_remove(array_agg(tp.professor_id), NULL)),
               '[]'::json
             ) as professores
      FROM turmas t
      LEFT JOIN turma_professores tp ON t.id = tp.turma_id
      GROUP BY t.id, t.nome, t.acompanhamento, t.turno, t.dias, t.horario, t.disciplinas, t.status
      ORDER BY t.nome
    `);

    const formatted = result.rows.map(row => ({
      id: row.id,
      nome: row.nome,
      acompanhamento: row.acompanhamento,
      turno: row.turno,
      dias: row.dias,
      horario: row.horario,
      disciplinas: row.disciplinas || [],
      alunosCount: row.alunos_count,
      status: row.status,
      professores: typeof row.professores === 'string' ? JSON.parse(row.professores) : (row.professores || []),
    }));

    return NextResponse.json(formatted);
  } catch (err: any) {
    console.error('Error fetching classes:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      nome, 
      acompanhamento, 
      turno, 
      dias, 
      horario, 
      disciplinas, 
      status, 
      professores: linkedProfs 
    } = body;

    if (!nome || !acompanhamento || !turno) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    // 1. Insert class
    const result = await query(
      `INSERT INTO turmas (nome, acompanhamento, turno, dias, horario, disciplinas, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [nome, acompanhamento, turno, dias, horario, disciplinas || [], status || 'ativa']
    );
    const row = result.rows[0];

    // 2. Insert links to professors
    if (linkedProfs && Array.isArray(linkedProfs) && linkedProfs.length > 0) {
      for (const pId of linkedProfs) {
        await query(
          `INSERT INTO turma_professores (turma_id, professor_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [row.id, pId]
        );
      }
    }

    return NextResponse.json({
      id: row.id,
      nome: row.nome,
      acompanhamento: row.acompanhamento,
      turno: row.turno,
      dias: row.dias,
      horario: row.horario,
      disciplinas: row.disciplinas || [],
      alunosCount: row.alunos_count || 0,
      status: row.status,
      professores: linkedProfs || [],
    }, { status: 201 });
  } catch (err: any) {
    console.error('Erro no POST /api/turmas:', err);
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
      nome, 
      acompanhamento, 
      turno, 
      dias, 
      horario, 
      disciplinas, 
      status, 
      professores: linkedProfs 
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Identificador da turma ausente.' }, { status: 400 });
    }

    // 1. Update class
    const result = await query(
      `UPDATE turmas SET 
        nome = $1, 
        acompanhamento = $2, 
        turno = $3, 
        dias = $4, 
        horario = $5, 
        disciplinas = $6, 
        status = $7 
      WHERE id = $8 RETURNING *`,
      [nome, acompanhamento, turno, dias, horario, disciplinas || [], status, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Turma não encontrada.' }, { status: 404 });
    }

    const row = result.rows[0];

    // 2. Update links (delete old, insert new)
    await query(`DELETE FROM turma_professores WHERE turma_id = $1`, [row.id]);

    if (linkedProfs && Array.isArray(linkedProfs) && linkedProfs.length > 0) {
      for (const pId of linkedProfs) {
        await query(
          `INSERT INTO turma_professores (turma_id, professor_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [row.id, pId]
        );
      }
    }

    // Get current student count
    const countRes = await query(`SELECT COUNT(*)::int as count FROM alunos WHERE turma_id = $1`, [row.id]);
    const count = countRes.rows[0]?.count || 0;

    return NextResponse.json({
      id: row.id,
      nome: row.nome,
      acompanhamento: row.acompanhamento,
      turno: row.turno,
      dias: row.dias,
      horario: row.horario,
      disciplinas: row.disciplinas || [],
      alunosCount: count,
      status: row.status,
      professores: linkedProfs || [],
    });
  } catch (err: any) {
    console.error('Erro no PUT /api/turmas:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao atualizar o registro no banco de dados.' },
      { status: 500 }
    );
  }
}


export async function DELETE(request: Request) {
  const client = await getClient();

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      client.release();
      return NextResponse.json({ error: 'Identificador da turma ausente.' }, { status: 400 });
    }

    await client.query('BEGIN');

    // Step A: Remove professor links from junction table
    await client.query(`DELETE FROM turma_professores WHERE turma_id = $1`, [id]);

    // Step B: Remove cronograma atividades for this turma
    await client.query(`DELETE FROM cronograma_atividades WHERE turma_id = $1`, [id]);

    // Step B2: Remove comunicados específicos desta turma
    await client.query(`DELETE FROM comunicados WHERE turma_id = $1`, [id]);

    // Step B3: Remove conteúdos de mídia desta turma
    await client.query(`DELETE FROM conteudos_midia WHERE turma_id = $1`, [id]);

    // Step C: Detach students (set turma_id to NULL) — alunos FK has NO cascade
    await client.query(`UPDATE alunos SET turma_id = NULL WHERE turma_id = $1`, [id]);

    // Step D: Delete the turma record
    const result = await client.query(`DELETE FROM turmas WHERE id = $1 RETURNING id`, [id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return NextResponse.json({ error: 'Turma não encontrada.' }, { status: 404 });
    }

    await client.query('COMMIT');

    return NextResponse.json({ success: true, message: 'Turma excluída com sucesso.' });
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erro no DELETE /api/turmas:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao excluir o registro no banco de dados.' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
