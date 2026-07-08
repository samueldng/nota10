import { NextResponse } from 'next/server';
import { query, getClient } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const result = await query(`
        SELECT id, numero, nome, acompanhamento,
               responsavel1_nome, responsavel1_telefone,
               responsavel2_nome, responsavel2_telefone,
               endereco_rua, endereco_bairro, endereco_cidade,
               plano, senha_inicial, primeiro_acesso,
               xp_total, nivel,
               COALESCE(
                 (SELECT json_agg(json_build_object(
                    'id', m.id,
                    'turmaId', m.turma_id,
                    'turmaNome', t.nome,
                    'status', m.status
                  ))
                  FROM matriculas m
                  JOIN turmas t ON m.turma_id = t.id
                  WHERE m.aluno_id = alunos.id),
                 '[]'::json
               ) as matriculas
        FROM alunos
        WHERE id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 });
      }

      const row = result.rows[0];
      const matriculas = typeof row.matriculas === 'string' ? JSON.parse(row.matriculas) : (row.matriculas || []);
      const primaryMatricula = matriculas.find((m: any) => m.status === 'ativo') || matriculas[0];

      return NextResponse.json({
        id: row.id,
        numero: row.numero,
        nome: row.nome,
        turmaId: primaryMatricula?.turmaId || '',
        turma: primaryMatricula?.turmaNome || '',
        status: primaryMatricula?.status || 'inativo',
        acompanhamento: row.acompanhamento,
        plano: row.plano || 'padrao',
        senhaInicial: row.senha_inicial || '',
        primeiroAcesso: row.primeiro_acesso ?? false,
        xpTotal: row.xp_total || 0,
        nivel: row.nivel || 1,
        matriculas,
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
    }

    const result = await query(`
      SELECT id, numero, nome, acompanhamento,
             responsavel1_nome, responsavel1_telefone,
             responsavel2_nome, responsavel2_telefone,
             endereco_rua, endereco_bairro, endereco_cidade,
             plano, senha_inicial, primeiro_acesso,
             xp_total, nivel,
             COALESCE(
               (SELECT json_agg(json_build_object(
                  'id', m.id,
                  'turmaId', m.turma_id,
                  'turmaNome', t.nome,
                  'status', m.status
                ))
                FROM matriculas m
                JOIN turmas t ON m.turma_id = t.id
                WHERE m.aluno_id = alunos.id),
               '[]'::json
             ) as matriculas
      FROM alunos
      ORDER BY nome
    `);

    const formatted = result.rows.map(row => {
      const matriculas = typeof row.matriculas === 'string' ? JSON.parse(row.matriculas) : (row.matriculas || []);
      const primaryMatricula = matriculas.find((m: any) => m.status === 'ativo') || matriculas[0];

      return {
        id: row.id,
        numero: row.numero,
        nome: row.nome,
        turmaId: primaryMatricula?.turmaId || '',
        turma: primaryMatricula?.turmaNome || '',
        status: primaryMatricula?.status || 'inativo',
        acompanhamento: row.acompanhamento,
        plano: row.plano || 'padrao',
        senhaInicial: row.senha_inicial || '',
        primeiroAcesso: row.primeiro_acesso ?? false,
        xpTotal: row.xp_total || 0,
        nivel: row.nivel || 1,
        matriculas,
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
      };
    });

    return NextResponse.json(formatted);
  } catch (err: any) {
    console.error('[API Alunos GET Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const client = await getClient();
  try {
    const body = await request.json();
    const {
      numero, 
      nome, 
      turmaId, 
      turmasIds,
      acompanhamento, 
      plano, 
      status, 
      senhaInicial,
      responsavel1, 
      responsavel2, 
      endereco
    } = body;

    const resolvedAcompanhamento = (
      Array.isArray(acompanhamento)
        ? acompanhamento
        : (acompanhamento ? [acompanhamento] : ['pre_cmt_5'])
    ).filter(Boolean);

    await client.query('BEGIN');

    // 1. Inserir o aluno (com cast explícito para text[])
    const result = await client.query(
      `INSERT INTO alunos (
        numero, nome, acompanhamento, plano, senha_inicial, primeiro_acesso,
        responsavel1_nome, responsavel1_telefone, responsavel2_nome, responsavel2_telefone,
        endereco_rua, endereco_bairro, endereco_cidade
      ) VALUES ($1, $2, $3::text[], $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        numero || null,
        nome || '',
        resolvedAcompanhamento,
        plano || 'padrao',
        senhaInicial || '123456',
        true, // primeiro_acesso
        responsavel1?.nome || '',
        responsavel1?.telefone || '',
        responsavel2?.nome || null,
        responsavel2?.telefone || null,
        endereco?.rua || null,
        endereco?.bairro || null,
        endereco?.cidade || endereco?.city || null,
      ]
    );
    const row = result.rows[0];

    // 2. Inserir as matrículas
    const resolvedTurmas: string[] = [];
    if (turmasIds && Array.isArray(turmasIds) && turmasIds.length > 0) {
      resolvedTurmas.push(...turmasIds);
    } else if (turmaId) {
      resolvedTurmas.push(turmaId);
    }

    for (const tId of resolvedTurmas) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      let finalTurmaId = tId;
      if (!uuidRegex.test(tId)) {
        const mockToNameMap: Record<string, string> = {
          'T001': '5A Manhã',
          'T002': '5B Tarde',
          'T003': '5C Manhã',
          'T004': '4A Manhã',
          'T005': '4B Tarde',
          'T006': 'Reforço Geral',
          'T007': '5A Manhã 2025'
        };
        const lookupName = mockToNameMap[tId] || tId;
        const lookupRes = await client.query(`SELECT id FROM turmas WHERE nome = $1 LIMIT 1`, [lookupName]);
        if (lookupRes.rows.length > 0) {
          finalTurmaId = lookupRes.rows[0].id;
        } else {
          continue;
        }
      }

      // Validar integridade referencial da turma antes de inserir
      const checkTurma = await client.query('SELECT id FROM turmas WHERE id = $1', [finalTurmaId]);
      if (checkTurma.rows.length === 0) {
        continue;
      }

      await client.query(
        `INSERT INTO matriculas (aluno_id, turma_id, status) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [row.id, finalTurmaId, status || 'ativo']
      );
    }

    await client.query('COMMIT');

    // Buscar as matrículas inseridas
    const freshMatriculas = await query(`
      SELECT m.id, m.turma_id as "turmaId", t.nome as "turmaNome", m.status
      FROM matriculas m
      JOIN turmas t ON m.turma_id = t.id
      WHERE m.aluno_id = $1
    `, [row.id]);

    const matriculasList = freshMatriculas.rows;
    const primaryMatricula = matriculasList.find(m => m.status === 'ativo') || matriculasList[0];

    return NextResponse.json({
      id: row.id,
      numero: row.numero,
      nome: row.nome,
      turmaId: primaryMatricula?.turmaId || '',
      turma: primaryMatricula?.turmaNome || '',
      status: primaryMatricula?.status || 'inativo',
      acompanhamento: row.acompanhamento,
      plano: row.plano || 'padrao',
      senhaInicial: row.senha_inicial || '',
      primeiroAcesso: row.primeiro_acesso ?? false,
      matriculas: matriculasList,
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
    await client.query('ROLLBACK').catch(() => {});
    console.error('[API Alunos POST Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao salvar o registro no banco de dados.' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function PUT(request: Request) {
  const client = await getClient();
  try {
    const body = await request.json();
    const {
      id, 
      numero, 
      nome, 
      turmaId, 
      turmasIds,
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

    const resolvedAcompanhamento = (
      Array.isArray(acompanhamento)
        ? acompanhamento
        : (acompanhamento ? [acompanhamento] : ['pre_cmt_5'])
    ).filter(Boolean);

    // Evitar undefined no parâmetro numero se o front não enviar na edição
    let finalNumero = numero;
    if (!finalNumero) {
      const currentRes = await client.query('SELECT numero FROM alunos WHERE id = $1', [id]);
      if (currentRes.rows.length > 0) {
        finalNumero = currentRes.rows[0].numero;
      } else {
        return NextResponse.json({ error: 'Aluno não encontrado.' }, { status: 404 });
      }
    }

    await client.query('BEGIN');

    // 1. Atualizar o aluno (com cast explícito para text[])
    const result = await client.query(
      `UPDATE alunos SET
        numero = $1, 
        nome = $2, 
        acompanhamento = $3::text[], 
        plano = $4,
        senha_inicial = $5, 
        primeiro_acesso = $6, 
        responsavel1_nome = $7, 
        responsavel1_telefone = $8,
        responsavel2_nome = $9, 
        responsavel2_telefone = $10, 
        endereco_rua = $11, 
        endereco_bairro = $12,
        endereco_cidade = $13
      WHERE id = $14 RETURNING *`,
      [
        finalNumero,
        nome || '',
        resolvedAcompanhamento,
        plano || 'padrao',
        senhaInicial || '123456',
        primeiroAcesso ?? false,
        responsavel1?.nome || '',
        responsavel1?.telefone || '',
        responsavel2?.nome || null,
        responsavel2?.telefone || null,
        endereco?.rua || null,
        endereco?.bairro || null,
        endereco?.cidade || endereco?.city || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Aluno não encontrado no update.' }, { status: 404 });
    }

    const row = result.rows[0];

    // 2. Atualizar as matrículas (excluir antigas e inserir novas)
    await client.query(`DELETE FROM matriculas WHERE aluno_id = $1`, [id]);

    const resolvedTurmas: string[] = [];
    if (turmasIds && Array.isArray(turmasIds) && turmasIds.length > 0) {
      resolvedTurmas.push(...turmasIds);
    } else if (turmaId) {
      resolvedTurmas.push(turmaId);
    }

    for (const tId of resolvedTurmas) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      let finalTurmaId = tId;
      if (!uuidRegex.test(tId)) {
        const mockToNameMap: Record<string, string> = {
          'T001': '5A Manhã',
          'T002': '5B Tarde',
          'T003': '5C Manhã',
          'T004': '4A Manhã',
          'T005': '4B Tarde',
          'T006': 'Reforço Geral',
          'T007': '5A Manhã 2025'
        };
        const lookupName = mockToNameMap[tId] || tId;
        const lookupRes = await client.query(`SELECT id FROM turmas WHERE nome = $1 LIMIT 1`, [lookupName]);
        if (lookupRes.rows.length > 0) {
          finalTurmaId = lookupRes.rows[0].id;
        } else {
          continue;
        }
      }

      // Validar integridade referencial da turma antes de inserir
      const checkTurma = await client.query('SELECT id FROM turmas WHERE id = $1', [finalTurmaId]);
      if (checkTurma.rows.length === 0) {
        continue;
      }

      await client.query(
        `INSERT INTO matriculas (aluno_id, turma_id, status) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [row.id, finalTurmaId, status || 'ativo']
      );
    }

    await client.query('COMMIT');

    // Buscar as matrículas recém gravadas
    const freshMatriculas = await query(`
      SELECT m.id, m.turma_id as "turmaId", t.nome as "turmaNome", m.status
      FROM matriculas m
      JOIN turmas t ON m.turma_id = t.id
      WHERE m.aluno_id = $1
    `, [row.id]);

    const matriculasList = freshMatriculas.rows;
    const primaryMatricula = matriculasList.find(m => m.status === 'ativo') || matriculasList[0];

    return NextResponse.json({
      id: row.id,
      numero: row.numero,
      nome: row.nome,
      turmaId: primaryMatricula?.turmaId || '',
      turma: primaryMatricula?.turmaNome || '',
      status: primaryMatricula?.status || 'inativo',
      acompanhamento: row.acompanhamento,
      plano: row.plano || 'padrao',
      senhaInicial: row.senha_inicial || '',
      primeiroAcesso: row.primeiro_acesso ?? false,
      matriculas: matriculasList,
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
    await client.query('ROLLBACK').catch(() => {});
    console.error('[API Alunos PUT Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao atualizar o registro no banco de dados.' },
      { status: 500 }
    );
  } finally {
    client.release();
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

    // Remover registros em matriculas
    await client.query(`DELETE FROM matriculas WHERE aluno_id = $1`, [id]);

    // Remover o registro de aluno
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
    console.error('[API Alunos DELETE Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao excluir o registro no banco de dados.' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
