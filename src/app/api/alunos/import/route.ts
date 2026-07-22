import { NextResponse } from 'next/server';
import { getClient } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const client = await getClient();

  try {
    const body = await request.json();
    const { students } = body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: 'Lista de alunos para importação é obrigatória.' }, { status: 400 });
    }

    const inserted: any[] = [];
    const errors: any[] = [];

    for (const [index, item] of students.entries()) {
      try {
        await client.query('BEGIN');

        const {
          numero,
          nome,
          turmaId,
          turmaNome,
          acompanhamento,
          plano,
          responsavel1,
          responsavel2,
          endereco,
        } = item;

        if (!nome) {
          errors.push({ index, error: 'Nome do aluno é obrigatório.' });
          await client.query('ROLLBACK');
          continue;
        }

        // Senha inicial: últimos 4 dígitos do telefone do responsável 1 ou '123456'
        const phoneDigits = (responsavel1?.telefone || '').replace(/\D/g, '');
        const senhaInicial = phoneDigits.length >= 4 ? phoneDigits.slice(-4) : '123456';

        const resolvedAcompanhamento = (
          Array.isArray(acompanhamento)
            ? acompanhamento
            : (acompanhamento ? [acompanhamento] : ['pre_cmt_5'])
        ).filter(Boolean);

        // Inserir Aluno
        const resAluno = await client.query(
          `INSERT INTO alunos (
            numero, nome, acompanhamento, plano, senha_inicial, primeiro_acesso,
            responsavel1_nome, responsavel1_telefone, responsavel2_nome, responsavel2_telefone,
            endereco_rua, endereco_bairro, endereco_cidade
          ) VALUES ($1, $2, $3::text[], $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
          [
            numero || String(Date.now()).slice(-4),
            nome,
            resolvedAcompanhamento,
            plano || 'padrao',
            senhaInicial,
            true,
            responsavel1?.nome || '',
            responsavel1?.telefone || '',
            responsavel2?.nome || null,
            responsavel2?.telefone || null,
            endereco?.rua || null,
            endereco?.bairro || null,
            endereco?.cidade || null,
          ]
        );

        const alunoRow = resAluno.rows[0];

        // Tentar resolver Turma por ID ou por Nome se turmaId for fornecido
        let targetTurmaId = turmaId;
        if (!targetTurmaId && turmaNome) {
          const tRes = await client.query(`SELECT id FROM turmas WHERE nome ILIKE $1 LIMIT 1`, [turmaNome]);
          if (tRes.rows.length > 0) {
            targetTurmaId = tRes.rows[0].id;
          }
        }

        if (targetTurmaId) {
          await client.query(
            `INSERT INTO matriculas (aluno_id, turma_id, status) VALUES ($1, $2, 'ativo') ON CONFLICT DO NOTHING`,
            [alunoRow.id, targetTurmaId]
          );
        }

        await client.query('COMMIT');
        inserted.push({
          id: alunoRow.id,
          nome: alunoRow.nome,
          numero: alunoRow.numero,
          senhaInicial,
        });
      } catch (err: any) {
        await client.query('ROLLBACK').catch(() => {});
        errors.push({ index, nome: item.nome, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      totalProcessed: students.length,
      totalInserted: inserted.length,
      inserted,
      errors,
    });
  } catch (err: any) {
    console.error('Erro na importação em lote de alunos:', err);
    return NextResponse.json({ error: err.message || 'Erro interno no servidor.' }, { status: 500 });
  } finally {
    client.release();
  }
}
