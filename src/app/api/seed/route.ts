import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { professores, turmas, alunos, registrosLancados, folhasGeradas, logAuditoria } from '@/lib/mockData';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Iniciando o Seed do PostgreSQL Local...');

    // 1. Limpar tabelas (A ordem importa por causa das FKs)
    console.log('Limpando tabelas...');
    await query('DELETE FROM log_auditoria');
    await query('DELETE FROM folhas_geradas');
    await query('DELETE FROM registros_lancados');
    await query('DELETE FROM cronograma_atividades');
    await query('DELETE FROM alunos');
    await query('DELETE FROM turma_professores');
    await query('DELETE FROM turmas');
    await query('DELETE FROM professores');

    // 2. Inserir Professores
    console.log('Inserindo professores...');
    const profMap = new Map<string, string>();
    for (const p of professores) {
      const res = await query(
        `INSERT INTO professores (nome, email, status) VALUES ($1, $2, $3) RETURNING id`,
        [p.nome, p.email, p.status]
      );
      if (res.rows.length > 0) {
        profMap.set(p.id, res.rows[0].id);
      }
    }

    // 3. Inserir Turmas e Vínculos
    console.log('Inserindo turmas...');
    const turmaMap = new Map<string, string>();
    for (const t of turmas) {
      const res = await query(
        `INSERT INTO turmas (nome, acompanhamento, turno, dias, horario, disciplinas, alunos_count, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [t.nome, t.acompanhamento, t.turno, t.dias, t.horario, t.disciplinas, t.alunosCount, t.status]
      );
      
      if (res.rows.length > 0) {
        const dbTurmaId = res.rows[0].id;
        turmaMap.set(t.id, dbTurmaId);

        // Inserir vinculo turma_professores
        for (const pId of t.professores) {
          const dbProfId = profMap.get(pId);
          if (dbProfId) {
            await query(
              `INSERT INTO turma_professores (turma_id, professor_id) VALUES ($1, $2)`,
              [dbTurmaId, dbProfId]
            );
          }
        }
      }
    }

    // 4. Inserir Alunos
    console.log('Inserindo alunos...');
    for (const a of alunos) {
      const dbTurmaId = turmaMap.get(a.turmaId) || null;
      await query(
        `INSERT INTO alunos (
          numero, nome, turma_id, turma_nome, acompanhamento, status,
          responsavel1_nome, responsavel1_telefone, responsavel2_nome, responsavel2_telefone,
          endereco_rua, endereco_bairro, endereco_cidade, plano, senha_inicial, primeiro_acesso
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          a.numero,
          a.nome,
          dbTurmaId,
          a.turma,
          a.acompanhamento,
          a.status,
          a.responsavel1.nome,
          a.responsavel1.telefone,
          a.responsavel2.nome || null,
          a.responsavel2.telefone || null,
          a.endereco.rua,
          a.endereco.bairro,
          a.endereco.cidade,
          a.plano || 'padrao',
          a.senhaInicial || '123456',
          a.primeiroAcesso || false
        ]
      );
    }

    // 5. Inserir Registros Lançados
    console.log('Inserindo registros lançados...');
    for (const r of registrosLancados) {
      await query(
        `INSERT INTO registros_lancados (
          data, acompanhamento, turma, aluno, disciplina, bloco, professor, origem, status,
          lancado_por, editado_por, data_edicao
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          r.data,
          r.acompanhamento,
          r.turma,
          r.aluno,
          r.disciplina,
          r.bloco,
          r.professor,
          r.origem,
          r.status,
          r.lancadoPor,
          r.editadoPor || null,
          r.dataEdicao || null
        ]
      );
    }

    // 6. Inserir Folhas Geradas
    console.log('Inserindo folhas...');
    for (const f of folhasGeradas) {
      await query(
        `INSERT INTO folhas_geradas (
          id, acompanhamento, turma, aluno, data, disciplina, bloco, professor, gerada_por, data_geracao
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          f.id,
          f.acompanhamento,
          f.turma,
          f.aluno || null,
          f.data,
          f.disciplina,
          f.bloco || null,
          f.professor,
          f.geradaPor,
          f.dataGeracao
        ]
      );
    }

    // 7. Inserir Logs de Auditoria
    console.log('Inserindo logs...');
    for (const l of logAuditoria) {
      await query(
        `INSERT INTO log_auditoria (data, usuario, acao, detalhe) VALUES ($1, $2, $3, $4)`,
        [l.data, l.usuario, l.acao, l.detalhe]
      );
    }

    console.log('Seed concluído com sucesso no PostgreSQL!');
    return NextResponse.json({ success: true, message: 'Seed concluído com sucesso no PostgreSQL!' });

  } catch (err: any) {
    console.error('Erro durante o seed:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
