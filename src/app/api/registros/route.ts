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
      alunos: alunosRows // Array de avaliações por aluno
    } = body;

    if (!data || !acompanhamento || !turma || !disciplina || !professor || !lancadoPor) {
      client.release();
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    await client.query('BEGIN');

    const createdRecords: any[] = [];
    const faltasDisparar: any[] = [];

    // Se temos formRows por aluno
    if (Array.isArray(alunosRows) && alunosRows.length > 0) {
      for (const row of alunosRows) {
        const res = await client.query(
          `INSERT INTO registros_lancados (
            data, acompanhamento, turma, aluno, disciplina, bloco, professor, origem, status,
            lancado_por, editado_por, data_edicao, aluno_id, presenca, video, palavra_chave,
            fixacao, atencao, participacao, comportamento, observacoes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) RETURNING *`,
          [
            data,
            acompanhamento,
            turma,
            row.nome || aluno || 'Aluno',
            disciplina,
            bloco || null,
            professor,
            origem || 'manual',
            status || 'salvo',
            lancadoPor,
            editadoPor || null,
            dataEdicao || null,
            row.alunoId || null,
            row.presenca || 'presente',
            row.video === 'fez' ? 5 : (row.video === 'metade' ? 3 : 0),
            row.palavraChave === 'fez' ? 5 : (row.palavraChave === 'metade' ? 3 : 0),
            row.fixacao === 'fez' ? 5 : (row.fixacao === 'metade' ? 3 : 0),
            row.atencao === 'atento' ? 5 : (row.atencao === 'distraido' ? 3 : 1),
            Number(row.participacao) || 3,
            Number(row.comportamento) || 3,
            row.observacao || null
          ]
        );
        const record = res.rows[0];
        createdRecords.push(record);

        // ── Calculadora de XP por Desempenho na Folha Presencial ──
        let xpGained = 0;
        if (row.presenca === 'presente') xpGained += 20;
        if (row.fixacao === 'fez' || Number(row.fixacao) >= 4) xpGained += 50;
        else if (row.fixacao === 'metade' || Number(row.fixacao) === 3) xpGained += 25;
        if (Number(row.participacao) >= 3) xpGained += 30;

        if (row.alunoId && xpGained > 0) {
          const atvKey = `folha_${record.id}_${data}`;
          await client.query(
            `INSERT INTO aluno_progresso (aluno_id, atividade_id, tipo_acao, xp_ganho)
             VALUES ($1, $2, 'folha_presencial', $3)
             ON CONFLICT (aluno_id, atividade_id) WHERE atividade_id IS NOT NULL
             DO UPDATE SET xp_ganho = EXCLUDED.xp_ganho`,
            [row.alunoId, atvKey, xpGained]
          );

          // Recalcular xp_total e nivel em cache
          await client.query(
            `UPDATE alunos 
             SET xp_total = COALESCE((SELECT SUM(xp_ganho) FROM aluno_progresso WHERE aluno_id = $1::text), 0),
                 nivel = 1 + FLOOR(COALESCE((SELECT SUM(xp_ganho) FROM aluno_progresso WHERE aluno_id = $1::text), 0) / 500)
             WHERE id::text = $1::text`,
            [row.alunoId]
          );
        }

        // Se faltou, enfileirar para alerta WhatsApp
        if (row.presenca === 'faltou' && row.alunoId) {
          faltasDisparar.push({
            alunoId: row.alunoId,
            alunoNome: row.nome,
            turma,
            data,
            disciplina
          });
        }
      }
    } else {
      // Registro único (header ou resumo)
      const res = await client.query(
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
      createdRecords.push(res.rows[0]);
    }

    await client.query('COMMIT');
    client.release();

    // Disparar alertas de faltas de forma não-bloqueante se houver
    if (faltasDisparar.length > 0) {
      const originHost = request.headers.get('host') || 'localhost:3000';
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      fetch(`${protocol}://${originHost}/api/whatsapp/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'falta',
          faltas: faltasDisparar
        })
      }).catch(err => console.error('Erro ao disparar WhatsApp de faltas:', err));
    }

    return NextResponse.json({
      success: true,
      count: createdRecords.length,
      records: createdRecords
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
