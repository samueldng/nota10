import { supabase } from './supabase';
import type { Professor, Turma, Aluno, RegistroLancado, FolhaGerada, LogAuditoria } from './mockData'; // we can reuse the types from mockData
import * as mock from './mockData';

const useMock = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

export async function getProfessores(): Promise<Professor[]> {
  if (useMock) {
    console.log("Using mock data for getProfessores");
    return mock.professores;
  }
  try {
    const { data, error } = await supabase.from('professores').select('*').order('nome');
    if (error) throw error;
    return data as Professor[];
  } catch (err) {
    console.warn("Supabase getProfessores failed, falling back to mock data:", err);
    return mock.professores;
  }
}

export async function getTurmas(): Promise<Turma[]> {
  if (useMock) {
    console.log("Using mock data for getTurmas");
    return mock.turmas;
  }
  try {
    const { data, error } = await supabase.from('turmas').select('*').order('nome');
    if (error) throw error;
    return data.map(d => ({
      ...d,
      alunosCount: d.alunos_count
    })) as Turma[];
  } catch (err) {
    console.warn("Supabase getTurmas failed, falling back to mock data:", err);
    return mock.turmas;
  }
}

export async function getAlunos(): Promise<Aluno[]> {
  if (useMock) {
    console.log("Using mock data for getAlunos");
    return mock.alunos;
  }
  try {
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
  } catch (err) {
    console.warn("Supabase getAlunos failed, falling back to mock data:", err);
    return mock.alunos;
  }
}

export async function getRegistros(): Promise<RegistroLancado[]> {
  if (useMock) {
    console.log("Using mock data for getRegistros");
    return mock.registrosLancados;
  }
  try {
    const { data, error } = await supabase.from('registros_lancados').select('*').order('id', { ascending: false });
    if (error) throw error;
    return data.map(d => ({
      ...d,
      lancadoPor: d.lancado_por,
      editadoPor: d.editado_por,
      dataEdicao: d.data_edicao
    })) as RegistroLancado[];
  } catch (err) {
    console.warn("Supabase getRegistros failed, falling back to mock data:", err);
    return mock.registrosLancados;
  }
}

export async function getLogs(): Promise<LogAuditoria[]> {
  if (useMock) {
    console.log("Using mock data for getLogs");
    return mock.logAuditoria;
  }
  try {
    const { data, error } = await supabase.from('log_auditoria').select('*').order('id', { ascending: false });
    if (error) throw error;
    return data as LogAuditoria[];
  } catch (err) {
    console.warn("Supabase getLogs failed, falling back to mock data:", err);
    return mock.logAuditoria;
  }
}


