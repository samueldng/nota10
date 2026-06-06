import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { professores, turmas, alunos, registrosLancados, folhasGeradas, logAuditoria } from '@/lib/mockData';

export async function GET() {
  try {
    console.log('Iniciando o Seed do Supabase...');

    // 1. Limpar tabelas (A ordem importa por causa das FKs)
    console.log('Limpando tabelas...');
    await supabase.from('log_auditoria').delete().neq('id', 0);
    await supabase.from('folhas_geradas').delete().neq('id', '');
    await supabase.from('registros_lancados').delete().neq('id', 0);
    await supabase.from('alunos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('turma_professores').delete().neq('turma_id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('turmas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('professores').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 2. Inserir Professores (mapeando id de string para uuid fake ou gerando novos e atualizando referências)
    // Para simplificar no MVP, vamos deixar o Supabase gerar os UUIDs e nós apenas inserimos os dados sem UUID, 
    // ou usamos um mapeamento. Como mockData usa 'p1', 'p2', não são UUIDs válidos para o Postgres.
    // Vamos criar um mapeamento na memória.
    
    console.log('Inserindo professores...');
    const profMap = new Map<string, string>();
    for (const p of professores) {
      const { data, error } = await supabase.from('professores').insert({
        nome: p.nome,
        email: p.email,
        status: p.status
      }).select('id').single();
      
      if (error) throw new Error(`Erro ao inserir prof ${p.nome}: ${error.message}`);
      profMap.set(p.id, data.id);
    }

    console.log('Inserindo turmas...');
    const turmaMap = new Map<string, string>();
    for (const t of turmas) {
      const { data, error } = await supabase.from('turmas').insert({
        nome: t.nome,
        acompanhamento: t.acompanhamento,
        turno: t.turno,
        dias: t.dias,
        horario: t.horario,
        disciplinas: t.disciplinas,
        alunos_count: t.alunosCount,
        status: t.status
      }).select('id').single();

      if (error) throw new Error(`Erro ao inserir turma ${t.nome}: ${error.message}`);
      turmaMap.set(t.id, data.id);

      // Inserir vinculo turma_professores
      for (const pId of t.professores) {
        const dbProfId = profMap.get(pId);
        if (dbProfId) {
          await supabase.from('turma_professores').insert({
            turma_id: data.id,
            professor_id: dbProfId
          });
        }
      }
    }

    console.log('Inserindo alunos...');
    const alunoMap = new Map<string, string>();
    for (const a of alunos) {
      const { data, error } = await supabase.from('alunos').insert({
        numero: a.numero,
        nome: a.nome,
        turma_id: turmaMap.get(a.turmaId),
        turma_nome: a.turma,
        acompanhamento: a.acompanhamento,
        status: a.status,
        responsavel1_nome: a.responsavel1.nome,
        responsavel1_telefone: a.responsavel1.telefone,
        responsavel2_nome: a.responsavel2.nome || null,
        responsavel2_telefone: a.responsavel2.telefone || null,
        endereco_rua: a.endereco.rua,
        endereco_bairro: a.endereco.bairro,
        endereco_cidade: a.endereco.cidade
      }).select('id').single();

      if (error) throw new Error(`Erro ao inserir aluno ${a.nome}: ${error.message}`);
      alunoMap.set(a.id, data.id);
    }

    console.log('Inserindo registros lançados...');
    for (const r of registrosLancados) {
      const { error } = await supabase.from('registros_lancados').insert({
        data: r.data,
        acompanhamento: r.acompanhamento,
        turma: r.turma,
        aluno: r.aluno,
        disciplina: r.disciplina,
        bloco: r.bloco,
        professor: r.professor,
        origem: r.origem,
        status: r.status,
        lancado_por: r.lancadoPor,
        editado_por: r.editadoPor,
        data_edicao: r.dataEdicao
      });
      if (error) throw new Error(`Erro ao inserir registro ${r.id}: ${error.message}`);
    }

    console.log('Inserindo folhas...');
    for (const f of folhasGeradas) {
      const { error } = await supabase.from('folhas_geradas').insert({
        id: f.id,
        acompanhamento: f.acompanhamento,
        turma: f.turma,
        aluno: f.aluno,
        data: f.data,
        disciplina: f.disciplina,
        bloco: f.bloco,
        professor: f.professor,
        gerada_por: f.geradaPor,
        data_geracao: f.dataGeracao
      });
      if (error) throw new Error(`Erro ao inserir folha ${f.id}: ${error.message}`);
    }

    console.log('Inserindo logs...');
    for (const l of logAuditoria) {
      const { error } = await supabase.from('log_auditoria').insert({
        data: l.data,
        usuario: l.usuario,
        acao: l.acao,
        detalhe: l.detalhe
      });
      if (error) throw new Error(`Erro ao inserir log: ${error.message}`);
    }

    return NextResponse.json({ success: true, message: 'Seed concluído com sucesso!' });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
