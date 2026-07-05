import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await query(`
      SELECT id, numero, nome, turma_id, turma_nome, acompanhamento, status,
             responsavel1_nome, responsavel1_telefone,
             responsavel2_nome, responsavel2_telefone,
             endereco_rua, endereco_bairro, endereco_cidade,
             plano, senha_inicial, primeiro_acesso
      FROM alunos
      ORDER BY nome
    `);

    const formatted = result.rows.map(row => ({
      id: row.id,
      numero: row.numero,
      nome: row.nome,
      turmaId: row.turma_id,
      turma: row.turma_nome,
      acompanhamento: row.acompanhamento,
      plano: row.plano || 'padrao',
      status: row.status,
      senhaInicial: row.senha_inicial || '',
      primeiroAcesso: row.primeiro_acesso ?? false,
      responsavel1: {
        nome: row.responsavel1_nome,
        telefone: row.responsavel1_telefone,
      },
      responsavel2: {
        nome: row.responsavel2_nome || '',
        telefone: row.responsavel2_telefone || '',
      },
      endereco: {
        rua: row.endereco_rua || '',
        bairro: row.endereco_bairro || '',
        cidade: row.endereco_cidade || '',
      },
    }));

    return NextResponse.json(formatted);
  } catch (err: any) {
    console.error('Error fetching students:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      numero, 
      nome, 
      turmaId, 
      turma, 
      acompanhamento, 
      plano, 
      status, 
      senhaInicial,
      responsavel1, 
      responsavel2, 
      endereco
    } = body;

    if (!numero || !nome || !acompanhamento) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    // Resolve the actual UUID of the class from the database using class name or mock ID map
    let resolvedTurmaId: string | null = null;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (turmaId && uuidRegex.test(turmaId)) {
      resolvedTurmaId = turmaId;
    } else {
      let lookupName = turma || '';
      if (!lookupName && turmaId) {
        const mockToNameMap: Record<string, string> = {
          'T001': '5A Manhã',
          'T002': '5B Tarde',
          'T003': '5C Manhã',
          'T004': '4A Manhã',
          'T005': '4B Tarde',
          'T006': 'Reforço Geral',
          'T007': '5A Manhã 2025'
        };
        lookupName = mockToNameMap[turmaId] || '';
      }
      
      if (lookupName) {
        const turmaRes = await query(`SELECT id FROM turmas WHERE nome = $1 LIMIT 1`, [lookupName]);
        if (turmaRes.rows.length > 0) {
          resolvedTurmaId = turmaRes.rows[0].id;
        }
      }
    }

    const result = await query(
      `INSERT INTO alunos (
        numero, nome, turma_id, turma_nome, acompanhamento, status, plano, senha_inicial, primeiro_acesso,
        responsavel1_nome, responsavel1_telefone, responsavel2_nome, responsavel2_telefone,
        endereco_rua, endereco_bairro, endereco_cidade
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [
        numero,
        nome,
        resolvedTurmaId,
        turma || '',
        acompanhamento || 'pre_cmt_5',
        status || 'ativo',
        plano || 'padrao',
        senhaInicial || '123456',
        true, // primeiro_acesso
        responsavel1?.nome || '',
        responsavel1?.telefone || '',
        responsavel2?.nome || null,
        responsavel2?.telefone || null,
        endereco?.rua || null,
        endereco?.bairro || null,
        endereco?.cidade || null,
      ]
    );

    const row = result.rows[0];

    return NextResponse.json({
      id: row.id,
      numero: row.numero,
      nome: row.nome,
      turmaId: row.turma_id,
      turma: row.turma_nome,
      acompanhamento: row.acompanhamento,
      plano: row.plano || 'padrao',
      status: row.status,
      senhaInicial: row.senha_inicial || '',
      primeiroAcesso: row.primeiro_acesso ?? false,
      responsavel1: {
        nome: row.responsavel1_nome,
        telefone: row.responsavel1_telefone,
      },
      responsavel2: {
        nome: row.responsavel2_nome || '',
        telefone: row.responsavel2_telefone || '',
      },
      endereco: {
        rua: row.endereco_rua || '',
        bairro: row.endereco_bairro || '',
        cidade: row.endereco_cidade || '',
      },
    }, { status: 201 });
  } catch (err: any) {
    console.error('Erro no POST /api/alunos:', err);
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
      numero, 
      nome, 
      turmaId, 
      turma, 
      acompanhamento, 
      plano, 
      status, 
      senhaInicial, 
      primeiroAcesso,
      responsavel1, 
      responsavel2, 
      endereco
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Identificador do aluno ausente.' }, { status: 400 });
    }

    // Resolve the actual UUID of the class from the database using class name or mock ID map
    let resolvedTurmaId: string | null = null;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (turmaId && uuidRegex.test(turmaId)) {
      resolvedTurmaId = turmaId;
    } else {
      let lookupName = turma || '';
      if (!lookupName && turmaId) {
        const mockToNameMap: Record<string, string> = {
          'T001': '5A Manhã',
          'T002': '5B Tarde',
          'T003': '5C Manhã',
          'T004': '4A Manhã',
          'T005': '4B Tarde',
          'T006': 'Reforço Geral',
          'T007': '5A Manhã 2025'
        };
        lookupName = mockToNameMap[turmaId] || '';
      }
      
      if (lookupName) {
        const turmaRes = await query(`SELECT id FROM turmas WHERE nome = $1 LIMIT 1`, [lookupName]);
        if (turmaRes.rows.length > 0) {
          resolvedTurmaId = turmaRes.rows[0].id;
        }
      }
    }

    const result = await query(
      `UPDATE alunos SET
        numero = $1, 
        nome = $2, 
        turma_id = $3, 
        turma_nome = $4, 
        acompanhamento = $5, 
        status = $6, 
        plano = $7,
        senha_inicial = $8, 
        primeiro_acesso = $9, 
        responsavel1_nome = $10, 
        responsavel1_telefone = $11,
        responsavel2_nome = $12, 
        responsavel2_telefone = $13, 
        endereco_rua = $14, 
        endereco_bairro = $15,
        endereco_cidade = $16
      WHERE id = $17 RETURNING *`,
      [
        numero,
        nome,
        resolvedTurmaId,
        turma || '',
        acompanhamento,
        status,
        plano || 'padrao',
        senhaInicial || '123456',
        primeiroAcesso ?? false,
        responsavel1?.nome || '',
        responsavel1?.telefone || '',
        responsavel2?.nome || null,
        responsavel2?.telefone || null,
        endereco?.rua || null,
        endereco?.bairro || null,
        endereco?.cidade || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Aluno não encontrado.' }, { status: 404 });
    }

    const row = result.rows[0];

    return NextResponse.json({
      id: row.id,
      numero: row.numero,
      nome: row.nome,
      turmaId: row.turma_id,
      turma: row.turma_nome,
      acompanhamento: row.acompanhamento,
      plano: row.plano || 'padrao',
      status: row.status,
      senhaInicial: row.senha_inicial || '',
      primeiroAcesso: row.primeiro_acesso ?? false,
      responsavel1: {
        nome: row.responsavel1_nome,
        telefone: row.responsavel1_telefone,
      },
      responsavel2: {
        nome: row.responsavel2_nome || '',
        telefone: row.responsavel2_telefone || '',
      },
      endereco: {
        rua: row.endereco_rua || '',
        bairro: row.endereco_bairro || '',
        cidade: row.endereco_cidade || '',
      },
    });
  } catch (err: any) {
    console.error('Erro no PUT /api/alunos:', err);
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
      return NextResponse.json({ error: 'Identificador do aluno ausente.' }, { status: 400 });
    }

    await client.query('BEGIN');

    // Delete the student record
    const result = await client.query(`DELETE FROM alunos WHERE id = $1 RETURNING id`, [id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return NextResponse.json({ error: 'Aluno não encontrado.' }, { status: 404 });
    }

    await client.query('COMMIT');

    return NextResponse.json({ success: true, message: 'Aluno excluído com sucesso.' });
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erro no DELETE /api/alunos:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao excluir o registro no banco de dados.' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
