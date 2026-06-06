import { supabase } from './supabase';
import type { Professor, Turma, Aluno, RegistroLancado, FolhaGerada, LogAuditoria } from './mockData'; // we can reuse the types from mockData

export async function getProfessores(): Promise<Professor[]> {
  const { data, error } = await supabase.from('professores').select('*').order('nome');
  if (error) throw error;
  // Map fields if necessary, e.g. turmas. In this simple MVP, we might need to fetch the relationships if required, 
  // but for the table list, basic info is enough. For full fidelity we'd fetch turma_professores.
  return data as Professor[];
}

export async function getTurmas(): Promise<Turma[]> {
  const { data, error } = await supabase.from('turmas').select('*').order('nome');
  if (error) throw error;
  return data.map(d => ({
    ...d,
    alunosCount: d.alunos_count
  })) as Turma[];
}

export async function getAlunos(): Promise<Aluno[]> {
  const { data, error } = await supabase.from('alunos').select('*').order('nome');
  if (error) throw error;
  return data.map(d => ({
    id: d.id,
    numero: d.numero,
    nome: d.nome,
    turmaId: d.turma_id,
    turma: d.turma_nome,
    acompanhamento: d.acompanhamento,
    status: d.status,
    responsavel1: { nome: d.responsavel1_nome, telefone: d.responsavel1_telefone },
    responsavel2: { nome: d.responsavel2_nome, telefone: d.responsavel2_telefone },
    endereco: { rua: d.endereco_rua, bairro: d.endereco_bairro, cidade: d.endereco_cidade }
  })) as Aluno[];
}

export async function getRegistros(): Promise<RegistroLancado[]> {
  const { data, error } = await supabase.from('registros_lancados').select('*').order('id', { ascending: false });
  if (error) throw error;
  return data.map(d => ({
    ...d,
    lancadoPor: d.lancado_por,
    editadoPor: d.editado_por,
    dataEdicao: d.data_edicao
  })) as RegistroLancado[];
}

export async function getLogs(): Promise<LogAuditoria[]> {
  const { data, error } = await supabase.from('log_auditoria').select('*').order('id', { ascending: false });
  if (error) throw error;
  return data as LogAuditoria[];
}
