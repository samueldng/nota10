// ═══════════════════════════════════════════════════════
// NOTA 10 EDUCACIONAL — Dados Mockados Centralizados
// Alimenta todas as telas do protótipo com dados consistentes
// ═══════════════════════════════════════════════════════

// ── Tipos ──

export type Acompanhamento = 'pre_cmt_5' | 'projeto_4' | 'reforco';
export type Presenca = 'presente' | 'atrasado' | 'faltou';
export type TriState = 'nao_fez' | 'metade' | 'fez';
export type Atencao = 'desinteressado' | 'distraido' | 'atento';
export type Pontualidade = 'atrasado' | 'pontual';
export type Comportamento = 'excelente' | 'bom' | 'agitado' | 'desatento';
export type CompreensaoReforco = 'dominou' | 'revisao_basica' | 'reforco_profundo';
export type AutonomiaReforco = 'sozinho' | 'ajuda' | 'dependente';
export type StatusLeitura = 'lendo' | 'concluido' | 'abandonou';
export type StatusRegistro = 'salvo' | 'pendente' | 'revisado';
export type OrigemRegistro = 'foto' | 'manual';
export type StatusAluno = 'ativo' | 'inativo';
export type StatusTurma = 'ativa' | 'inativa';

export interface Professor {
  id: string;
  nome: string;
  email: string;
  turmas: string[];
  status: 'ativo' | 'inativo';
}

export interface Turma {
  id: string;
  nome: string;
  acompanhamento: Acompanhamento;
  turno: string;
  dias: string;
  horario: string;
  disciplinas: string[];
  professores: string[];
  alunosCount: number;
  status: StatusTurma;
}

export interface Responsavel {
  nome: string;
  telefone: string;
}

export interface Aluno {
  id: string;
  numero: string;
  nome: string;
  turmaId: string;
  turma: string;
  acompanhamento: Acompanhamento;
  status: StatusAluno;
  responsavel1: Responsavel;
  responsavel2: Responsavel;
  endereco: {
    rua: string;
    bairro: string;
    cidade: string;
  };
}

// Registro Pré-CMT 5º Ano
export interface RegistroPreCMT5 {
  alunoId: string;
  presenca: Presenca;
  video: TriState;
  palavraChave: TriState;
  fixacao: TriState;
  praticar: TriState;
  nota: string;
  atencao: Atencao;
  participacao: 1 | 2 | 3;
  comportamento: 1 | 2 | 3;
  conteudoObservacao: string;
  pontualidade: Pontualidade;
}

// Registro Projeto 4º Ano  
export interface RegistroProjeto4 {
  alunoId: string;
  presenca: Presenca;
  fixacao: TriState;
  praticar: TriState;
  atencao: Atencao;
  participacao: 1 | 2 | 3;
  comportamento: 1 | 2 | 3;
  nota: string;
  conteudoObservacao: string;
  pontualidade: Pontualidade;
}

// Dados do dia (Reforço)
export interface DadosDiaReforco {
  frequencia: Presenca;
  comportamento: Comportamento;
  pontualidadePais: Pontualidade;
}

// Atividade do aluno (Reforço)
export interface AtividadeReforco {
  numero: number;
  origem: string;
  disciplina: string;
  conteudoAssunto: string;
  paginas: string;
  compreensao: CompreensaoReforco;
  autonomia: AutonomiaReforco;
  observacao: string;
}

// Leitura (Reforço)
export interface LeituraReforco {
  numero: number;
  tituloLivro: string;
  dataInicio: string;
  dataFim: string;
  status: StatusLeitura;
  observacao: string;
}

export interface RegistroReforco {
  alunoId: string;
  semana: string;
  periodo: string;
  dadosDia: {
    segunda: DadosDiaReforco;
    terca: DadosDiaReforco;
    quarta: DadosDiaReforco;
    quinta: DadosDiaReforco;
  };
  atividades: AtividadeReforco[];
  leituras: LeituraReforco[];
}

export interface RegistroLancado {
  id: number;
  data: string;
  acompanhamento: Acompanhamento;
  turma: string;
  aluno: string;
  disciplina: string;
  bloco: string;
  professor: string;
  origem: OrigemRegistro;
  status: StatusRegistro;
  lancadoPor: string;
  editadoPor?: string;
  dataEdicao?: string;
}

export interface FolhaGerada {
  id: string;
  acompanhamento: Acompanhamento;
  turma: string;
  aluno?: string;
  data: string;
  disciplina: string;
  bloco: string;
  professor: string;
  geradaPor: string;
  dataGeracao: string;
}

export interface LogAuditoria {
  data: string;
  usuario: string;
  acao: string;
  detalhe: string;
}

// ── Labels ──

export const acompanhamentoLabels: Record<Acompanhamento, string> = {
  pre_cmt_5: 'Pré-CMT 5º Ano',
  projeto_4: 'Projeto 4º Ano',
  reforco: 'Reforço',
};

export const presencaLabels: Record<Presenca, string> = {
  presente: 'Presente',
  atrasado: 'Atrasado',
  faltou: 'Faltou',
};

export const triStateLabels: Record<TriState, string> = {
  nao_fez: 'Não Fez',
  metade: 'Metade',
  fez: 'Fez',
};

export const atencaoLabels: Record<Atencao, string> = {
  desinteressado: 'Desinteressado',
  distraido: 'Distraído',
  atento: 'Atento',
};

export const pontualidadeLabels: Record<Pontualidade, string> = {
  atrasado: 'Atrasado',
  pontual: 'Pontual',
};

export const comportamentoReforcoLabels: Record<Comportamento, string> = {
  excelente: 'Excelente',
  bom: 'Bom',
  agitado: 'Agitado',
  desatento: 'Desatento',
};

// ── Frases Motivacionais ──

export const frasesMotivacionais = [
  'Ensinar é tocar vidas para sempre.',
  'Cada registro é um passo a mais na jornada do aluno.',
  'Acompanhar de perto é fazer a diferença.',
  'O progresso nasce do cuidado com cada detalhe.',
  'Educação de qualidade começa com acompanhamento de qualidade.',
  'Cada aluno é uma história que merece atenção.',
  'Registrar é cuidar. Acompanhar é transformar.',
  'Pequenos passos diários constroem grandes resultados.',
  'A constância do professor é o maior exemplo para o aluno.',
  'Dados bem registrados geram decisões que transformam.',
];

// ── Dados Mockados ──

export const professores: Professor[] = [
  { id: 'p1', nome: 'João Silva', email: 'joao.silva@nota10.edu.br', turmas: ['T001', 'T007'], status: 'ativo' },
  { id: 'p2', nome: 'Maria Lucia', email: 'maria.lucia@nota10.edu.br', turmas: ['T002'], status: 'ativo' },
  { id: 'p3', nome: 'Ana Paula', email: 'ana.paula@nota10.edu.br', turmas: ['T003', 'T004'], status: 'ativo' },
  { id: 'p4', nome: 'Carlos Roberto', email: 'carlos.roberto@nota10.edu.br', turmas: ['T005', 'T006'], status: 'ativo' },
  { id: 'p5', nome: 'Fernanda Souza', email: 'fernanda.souza@nota10.edu.br', turmas: [], status: 'inativo' },
];

export const turmas: Turma[] = [
  { id: 'T001', nome: '5A Manhã', acompanhamento: 'pre_cmt_5', turno: 'Manhã', dias: 'Seg, Qua', horario: '08:00 - 12:00', disciplinas: ['Português', 'Matemática'], professores: ['p1'], alunosCount: 16, status: 'ativa' },
  { id: 'T002', nome: '5B Tarde', acompanhamento: 'pre_cmt_5', turno: 'Tarde', dias: 'Ter, Qui', horario: '13:00 - 17:00', disciplinas: ['Português', 'Matemática'], professores: ['p2'], alunosCount: 16, status: 'ativa' },
  { id: 'T003', nome: '5C Manhã', acompanhamento: 'pre_cmt_5', turno: 'Manhã', dias: 'Sex', horario: '08:00 - 12:00', disciplinas: ['Português', 'Matemática'], professores: ['p3'], alunosCount: 14, status: 'ativa' },
  { id: 'T004', nome: '4A Manhã', acompanhamento: 'projeto_4', turno: 'Manhã', dias: 'Seg, Qua', horario: '08:00 - 12:00', disciplinas: ['Português', 'Matemática'], professores: ['p3'], alunosCount: 12, status: 'ativa' },
  { id: 'T005', nome: '4B Tarde', acompanhamento: 'projeto_4', turno: 'Tarde', dias: 'Ter, Qui', horario: '13:00 - 17:00', disciplinas: ['Português', 'Matemática'], professores: ['p4'], alunosCount: 10, status: 'ativa' },
  { id: 'T006', nome: 'Reforço Geral', acompanhamento: 'reforco', turno: 'Tarde', dias: 'Seg - Qui', horario: '14:00 - 17:00', disciplinas: ['Multidisciplinar'], professores: ['p4'], alunosCount: 8, status: 'ativa' },
  { id: 'T007', nome: '5A Manhã 2025', acompanhamento: 'pre_cmt_5', turno: 'Manhã', dias: 'Seg, Qua', horario: '08:00 - 12:00', disciplinas: ['Português', 'Matemática'], professores: ['p1'], alunosCount: 16, status: 'inativa' },
];

export const alunos: Aluno[] = [
  { id: 'a1', numero: '0123', nome: 'Ana Clara Pereira da Silva', turmaId: 'T001', turma: '5A Manhã', acompanhamento: 'pre_cmt_5', status: 'ativo', responsavel1: { nome: 'Maria Pereira da Silva', telefone: '(11) 99999-1234' }, responsavel2: { nome: 'José Carlos Silva', telefone: '(11) 99999-5678' }, endereco: { rua: 'Rua das Flores, 123', bairro: 'Jardim Primavera', cidade: 'São Paulo' } },
  { id: 'a2', numero: '0124', nome: 'Bruno Santos Lima', turmaId: 'T001', turma: '5A Manhã', acompanhamento: 'pre_cmt_5', status: 'ativo', responsavel1: { nome: 'Cláudia Santos', telefone: '(11) 99999-2345' }, responsavel2: { nome: 'Ricardo Lima', telefone: '(11) 99999-6789' }, endereco: { rua: 'Av. Brasil, 456', bairro: 'Centro', cidade: 'São Paulo' } },
  { id: 'a3', numero: '0125', nome: 'Carla Beatriz Rocha', turmaId: 'T002', turma: '5B Tarde', acompanhamento: 'pre_cmt_5', status: 'inativo', responsavel1: { nome: 'Fernanda Rocha', telefone: '(11) 99999-3456' }, responsavel2: { nome: 'Paulo Rocha', telefone: '(11) 99999-7890' }, endereco: { rua: 'Rua do Comércio, 789', bairro: 'Vila Nova', cidade: 'São Paulo' } },
  { id: 'a4', numero: '0126', nome: 'Davi Fernandes Costa', turmaId: 'T001', turma: '5A Manhã', acompanhamento: 'pre_cmt_5', status: 'ativo', responsavel1: { nome: 'José Costa', telefone: '(11) 99999-4567' }, responsavel2: { nome: 'Mariana Fernandes', telefone: '(11) 99999-8901' }, endereco: { rua: 'Rua São José, 321', bairro: 'Bela Vista', cidade: 'São Paulo' } },
  { id: 'a5', numero: '0127', nome: 'Eduarda Martins Souza', turmaId: 'T004', turma: '4A Manhã', acompanhamento: 'projeto_4', status: 'ativo', responsavel1: { nome: 'Rita Martins', telefone: '(11) 99999-5670' }, responsavel2: { nome: 'André Souza', telefone: '(11) 99999-9012' }, endereco: { rua: 'Rua da Escola, 654', bairro: 'Parque Industrial', cidade: 'São Paulo' } },
  { id: 'a6', numero: '0128', nome: 'Felipe Almeida Oliveira', turmaId: 'T004', turma: '4A Manhã', acompanhamento: 'projeto_4', status: 'ativo', responsavel1: { nome: 'Marcos Almeida', telefone: '(11) 99999-6781' }, responsavel2: { nome: 'Sandra Oliveira', telefone: '(11) 99999-0123' }, endereco: { rua: 'Av. Paulista, 987', bairro: 'Consolação', cidade: 'São Paulo' } },
  { id: 'a7', numero: '0129', nome: 'Gabriela Pereira Santos', turmaId: 'T006', turma: 'Reforço Geral', acompanhamento: 'reforco', status: 'ativo', responsavel1: { nome: 'Paula Pereira', telefone: '(11) 99999-7892' }, responsavel2: { nome: 'Fernando Santos', telefone: '(11) 99999-1230' }, endereco: { rua: 'Rua Esperança, 111', bairro: 'Liberdade', cidade: 'São Paulo' } },
  { id: 'a8', numero: '0130', nome: 'Henrique Ribeiro Gomes', turmaId: 'T002', turma: '5B Tarde', acompanhamento: 'pre_cmt_5', status: 'ativo', responsavel1: { nome: 'Luciana Ribeiro', telefone: '(11) 99999-8903' }, responsavel2: { nome: 'Roberto Gomes', telefone: '(11) 99999-2341' }, endereco: { rua: 'Rua das Palmeiras, 222', bairro: 'Vila Mariana', cidade: 'São Paulo' } },
  { id: 'a9', numero: '0131', nome: 'Isabela Ferreira Nunes', turmaId: 'T001', turma: '5A Manhã', acompanhamento: 'pre_cmt_5', status: 'ativo', responsavel1: { nome: 'Tatiana Ferreira', telefone: '(11) 99999-9014' }, responsavel2: { nome: 'Carlos Nunes', telefone: '(11) 99999-3452' }, endereco: { rua: 'Rua do Sol, 333', bairro: 'Pinheiros', cidade: 'São Paulo' } },
  { id: 'a10', numero: '0132', nome: 'João Pedro Araújo', turmaId: 'T005', turma: '4B Tarde', acompanhamento: 'projeto_4', status: 'ativo', responsavel1: { nome: 'Ana Araújo', telefone: '(11) 99999-0125' }, responsavel2: { nome: 'Pedro Araújo', telefone: '(11) 99999-4563' }, endereco: { rua: 'Rua Lírios, 444', bairro: 'Moema', cidade: 'São Paulo' } },
  { id: 'a11', numero: '0133', nome: 'Larissa Mendes Carvalho', turmaId: 'T006', turma: 'Reforço Geral', acompanhamento: 'reforco', status: 'ativo', responsavel1: { nome: 'Juliana Mendes', telefone: '(11) 99999-1236' }, responsavel2: { nome: 'Wagner Carvalho', telefone: '(11) 99999-5674' }, endereco: { rua: 'Av. Independência, 555', bairro: 'Ipiranga', cidade: 'São Paulo' } },
  { id: 'a12', numero: '0134', nome: 'Mateus Oliveira Lima', turmaId: 'T001', turma: '5A Manhã', acompanhamento: 'pre_cmt_5', status: 'ativo', responsavel1: { nome: 'Cristiane Oliveira', telefone: '(11) 99999-2347' }, responsavel2: { nome: 'Eduardo Lima', telefone: '(11) 99999-6785' }, endereco: { rua: 'Rua Harmonia, 666', bairro: 'Vila Madalena', cidade: 'São Paulo' } },
];

export const registrosLancados: RegistroLancado[] = [
  { id: 1, data: '06/06/2026', acompanhamento: 'pre_cmt_5', turma: '5A Manhã', aluno: 'Turma inteira', disciplina: 'Português', bloco: 'Bloco 3', professor: 'João Silva', origem: 'foto', status: 'salvo', lancadoPor: 'Prof. João' },
  { id: 2, data: '05/06/2026', acompanhamento: 'pre_cmt_5', turma: '5A Manhã', aluno: 'Turma inteira', disciplina: 'Matemática', bloco: 'Bloco 2', professor: 'João Silva', origem: 'manual', status: 'salvo', lancadoPor: 'Prof. João' },
  { id: 3, data: '04/06/2026', acompanhamento: 'projeto_4', turma: '4A Manhã', aluno: 'Turma inteira', disciplina: 'Português', bloco: 'Bloco 1', professor: 'Ana Paula', origem: 'foto', status: 'pendente', lancadoPor: 'Prof. Ana' },
  { id: 4, data: '04/06/2026', acompanhamento: 'projeto_4', turma: '4B Tarde', aluno: 'Turma inteira', disciplina: 'Matemática', bloco: 'Bloco 2', professor: 'Carlos Roberto', origem: 'manual', status: 'salvo', lancadoPor: 'Prof. Carlos' },
  { id: 5, data: '03/06/2026', acompanhamento: 'reforco', turma: 'Reforço Geral', aluno: 'Gabriela Pereira Santos', disciplina: 'Multidisciplinar', bloco: '—', professor: 'Carlos Roberto', origem: 'manual', status: 'revisado', lancadoPor: 'Prof. Carlos' },
  { id: 6, data: '02/06/2026', acompanhamento: 'pre_cmt_5', turma: '5B Tarde', aluno: 'Turma inteira', disciplina: 'Português', bloco: 'Bloco 3', professor: 'Maria Lucia', origem: 'foto', status: 'salvo', lancadoPor: 'Prof. Maria' },
  { id: 7, data: '01/06/2026', acompanhamento: 'reforco', turma: 'Reforço Geral', aluno: 'Larissa Mendes Carvalho', disciplina: 'Multidisciplinar', bloco: '—', professor: 'Carlos Roberto', origem: 'manual', status: 'salvo', lancadoPor: 'Prof. Carlos' },
  { id: 8, data: '30/05/2026', acompanhamento: 'pre_cmt_5', turma: '5A Manhã', aluno: 'Turma inteira', disciplina: 'Matemática', bloco: 'Bloco 1', professor: 'João Silva', origem: 'foto', status: 'salvo', lancadoPor: 'Prof. João', editadoPor: 'Prof. João', dataEdicao: '31/05/2026' },
];

export const folhasGeradas: FolhaGerada[] = [
  { id: 'F001', acompanhamento: 'pre_cmt_5', turma: '5A Manhã', data: '06/06/2026', disciplina: 'Português', bloco: 'Bloco 3', professor: 'João Silva', geradaPor: 'Prof. João', dataGeracao: '06/06/2026 08:15' },
  { id: 'F002', acompanhamento: 'pre_cmt_5', turma: '5A Manhã', data: '05/06/2026', disciplina: 'Matemática', bloco: 'Bloco 2', professor: 'João Silva', geradaPor: 'Prof. João', dataGeracao: '05/06/2026 07:50' },
  { id: 'F003', acompanhamento: 'projeto_4', turma: '4A Manhã', data: '04/06/2026', disciplina: 'Português', bloco: 'Bloco 1', professor: 'Ana Paula', geradaPor: 'Prof. Ana', dataGeracao: '04/06/2026 08:00' },
  { id: 'F004', acompanhamento: 'reforco', turma: 'Reforço Geral', aluno: 'Gabriela Pereira Santos', data: '02/06/2026', disciplina: 'Multidisciplinar', bloco: '—', professor: 'Carlos Roberto', geradaPor: 'Prof. Carlos', dataGeracao: '02/06/2026 13:30' },
];

export const logAuditoria: LogAuditoria[] = [
  { data: '06/06 14:32', usuario: 'Prof. João', acao: 'Lançou registro #1', detalhe: 'Via foto — Pré-CMT 5º Ano, 5A Manhã, Português' },
  { data: '05/06 09:15', usuario: 'Prof. João', acao: 'Lançou registro #2', detalhe: 'Via formulário — Pré-CMT 5º Ano, 5A Manhã, Matemática' },
  { data: '04/06 16:45', usuario: 'Prof. Ana', acao: 'Lançou registro #3', detalhe: 'Via foto — Projeto 4º Ano, 4A Manhã, Português — Pendente de conferência' },
  { data: '04/06 11:20', usuario: 'Prof. Carlos', acao: 'Lançou registro #4', detalhe: 'Via formulário — Projeto 4º Ano, 4B Tarde, Matemática' },
  { data: '03/06 15:00', usuario: 'Prof. Carlos', acao: 'Editou registro #5', detalhe: 'Comportamento segunda: Bom → Excelente' },
  { data: '31/05 10:30', usuario: 'Prof. João', acao: 'Editou registro #8', detalhe: 'Fixação aluno Ana Clara: Metade → Fez' },
];

export const disciplinas = ['Português', 'Matemática'];
export const blocos = ['Bloco 1', 'Bloco 2', 'Bloco 3', 'Bloco 4'];

// ── Helpers ──

export function getAlunosByTurma(turmaId: string): Aluno[] {
  return alunos.filter(a => a.turmaId === turmaId);
}

export function getTurmasByAcompanhamento(acomp: Acompanhamento): Turma[] {
  return turmas.filter(t => t.acompanhamento === acomp && t.status === 'ativa');
}

export function getProfessorNome(id: string): string {
  return professores.find(p => p.id === id)?.nome || id;
}

export function getFraseMotivacional(): string {
  const idx = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % frasesMotivacionais.length;
  return frasesMotivacionais[idx];
}

export function getAcompanhamentoLabel(a: Acompanhamento): string {
  return acompanhamentoLabels[a];
}
