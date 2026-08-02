// ═══════════════════════════════════════════════════════
// NOTA 10 EDUCACIONAL — Dados Mockados Centralizados
// Alimenta todas as telas do protótipo com dados consistentes
// ═══════════════════════════════════════════════════════

import { z } from 'zod';

// ── Tipos ──

export type Acompanhamento = 'pre_cmt_5' | 'projeto_4' | 'reforco';
export type PlanoAluno = 'padrao' | 'acompanhamento' | 'elite';
export type Presenca = 'presente' | 'atrasado' | 'faltou';
export type TriState = 'nao_fez' | 'metade' | 'fez';
export type Atencao = 'desinteressado' | 'distraido' | 'atento';
export type Pontualidade = 'Pontual' | 'Atraso';
export type Comportamento = 'Exemplar' | 'Adequado' | 'Instável' | 'Disperso';

// Matrizes de Opções Oficiais (Escalas Pedagógicas)
export const OPCOES_PRESENCA = ['Presente', 'Faltou', 'Atrasado'] as const;
export const OPCOES_VIDEOAULA = ['Sim', 'Metade', 'Não'] as const;
export const OPCOES_P_CHAVE = ['Sim', 'Metade', 'Não'] as const;
export const OPCOES_DESEMPENHO = ['Excelente', 'Bom', 'Regular', 'Necessita Apoio', 'Crítico'] as const; // Serve para Fixação e Praticar
export const OPCOES_ATENCAO = ['Atento', 'Distraído', 'Desatento'] as const;
export const OPCOES_PARTICIPACAO = ['Engajado', 'Colaborativo', 'Passivo', 'Ausente'] as const;
export const OPCOES_COMPORTAMENTO = ['Exemplar', 'Adequado', 'Instável', 'Disperso'] as const;
export const OPCOES_PONTUALIDADE_PAIS = ['Pontual', 'Atraso'] as const;

export const FRASES_OBSERVACAO = [
  'Compreendeu o conteúdo e realizou bem as atividades propostas.',
  'Apresentou excelente desempenho nas atividades propostas.',
  'Demonstrou bom domínio do conteúdo trabalhado.',
  'Compreendeu o conteúdo, mas precisa de pequenos ajustes.',
  'Compreendeu parte do conteúdo, mas ainda precisa de treino.',
  'Apresentou dificuldade inicial, mas evoluiu durante a aula.',
  'Apresentou dificuldade inicial, mas evoluiu após a explicação.',
  'Demonstrou avanço, mas ainda precisa de mais prática.',
  'Compreendeu o conteúdo de forma inicial, mas ainda não consolidou.',
  'Apresentou dificuldade na interpretação das questões.',
  'Teve dificuldade em compreender o que a questão solicitava.',
  'Teve dificuldade em identificar as informações importantes da questão.',
  'Não observou todos os dados apresentados no enunciado.',
  'Precisou reler com mais atenção antes de responder.',
  'Após reler ou revisar, conseguiu corrigir parte dos erros.',
  'Após nova tentativa, conseguiu melhorar o desempenho.',
  'Após a correção, demonstrou compreender melhor o conteúdo.',
  'Os erros foram ajustáveis após a explicação.',
  'Os erros indicam necessidade de revisão do conteúdo.',
  'Os erros indicam necessidade de treino com questões semelhantes.',
  'Apresentou dificuldade em aplicar o conteúdo nas questões.',
  'Compreendeu a explicação, mas teve dificuldade ao resolver sozinho.',
  'Compreendeu oralmente, mas teve dificuldade ao registrar ou resolver por escrito.',
  'Demonstrou dificuldade em transformar a explicação em resolução prática.',
  'Teve dificuldade em escolher o procedimento adequado.',
  'Confundiu os procedimentos durante a resolução.',
  'Apresentou dificuldade em escolher e aplicar o procedimento correto.',
  'Apresentou erro de procedimento durante a resolução.',
  'Confundiu etapas da resolução.',
  'Precisa organizar melhor as etapas antes de responder.',
  'Conseguiu iniciar a resolução, mas não concluiu o raciocínio.',
  'Teve dificuldade em sustentar o raciocínio até a resposta final.',
  'Apresentou dificuldade em questões que exigiam mais de uma etapa.',
  'Teve dificuldade quando a questão exigiu mais interpretação.',
  'Teve dificuldade quando a questão exigiu comparação entre informações.',
  'Teve dificuldade em relacionar o conteúdo com a situação apresentada.',
  'Apresentou dificuldade em transferir o que aprendeu para novas questões.',
  'Conseguiu resolver as questões mais simples, mas teve dificuldade nas mais complexas.',
  'Apresentou melhor desempenho nas questões diretas.',
  'Apresentou dificuldade maior nas questões de aplicação.',
  'Precisou de orientação para desenvolver parte das questões.',
  'Conseguiu desenvolver parte das questões com orientação do professor.',
  'Conseguiu resolver com apoio, mas ainda precisa ganhar segurança.',
  'Demonstrou dependência de orientação para avançar nas questões.',
  'Ainda precisa desenvolver mais autonomia na resolução.',
  'Resolveu as atividades com autonomia.',
  'Resolveu as atividades com pouca intervenção do professor.',
  'Apresentou dificuldade em justificar o raciocínio utilizado.',
  'Não conseguiu explicar o raciocínio utilizado na resposta.',
  'A resposta estava correta, mas faltou justificar o raciocínio.',
  'A resolução ficou incompleta.',
  'Respondeu algumas questões sem apresentar cálculo ou justificativa.',
  'Marcou respostas sem desenvolver o raciocínio necessário.',
  'A marcação da resposta não foi acompanhada de desenvolvimento.',
  'A atividade não permitiu avaliar totalmente o raciocínio do aluno.',
  'Trouxe a atividade respondida de casa, comprometendo a avaliação em sala.',
  'Apresentou dificuldade relacionada à base necessária para o conteúdo.',
  'Precisa retomar pré-requisitos para acompanhar melhor o conteúdo.',
  'A dificuldade em cálculos básicos interferiu na resolução das questões.',
  'A dificuldade de leitura interferiu na compreensão das questões.',
  'Faltou em aula anterior, o que interferiu no acompanhamento do conteúdo.',
  'Não havia estudado esse conteúdo anteriormente na escola.',
  'Era o primeiro contato com o conteúdo e ainda está em desenvolvimento.',
  'Não estava com o material necessário, dificultando a avaliação completa.',
  'Conseguiu acompanhar mesmo sem estar com todo o material.',
  'Demonstrou esforço, mesmo apresentando dificuldade.',
  'Persistiu na atividade, mesmo diante dos erros.',
  'Precisou de incentivo para continuar tentando.',
  'Demonstrou insegurança diante das questões mais difíceis.',
  'Demonstrou ansiedade ou nervosismo durante a atividade.',
  'Demonstrou dificuldade em lidar com questões mais desafiadoras.',
  'Ficou frustrado diante das questões mais difíceis, mas tentou continuar.',
  'Teve rendimento inferior ao padrão apresentado anteriormente.',
  'Apresentou dificuldade maior neste bloco em comparação aos anteriores.',
  'Demonstrou evolução em comparação às aulas anteriores.',
  'Demonstrou mais segurança em comparação às aulas anteriores.'
] as const;

// Schema Estrito para o "Lançar Registro"
export const registroAulaSchema = z.object({
  alunoId: z.string().uuid('ID do aluno inválido.'),
  presenca: z.enum(OPCOES_PRESENCA),
  videoAula: z.enum(OPCOES_VIDEOAULA),
  palavraChave: z.enum(OPCOES_P_CHAVE),
  fixacao: z.enum(OPCOES_DESEMPENHO),
  praticar: z.enum(OPCOES_DESEMPENHO),
  atencao: z.enum(OPCOES_ATENCAO),
  participacao: z.enum(OPCOES_PARTICIPACAO),
  comportamento: z.enum(OPCOES_COMPORTAMENTO),
  observacao: z.string().optional(),
  pontualidadePais: z.enum(OPCOES_PONTUALIDADE_PAIS)
});

export type RegistroAulaData = z.infer<typeof registroAulaSchema>;
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
  acompanhamento: Acompanhamento[] | Acompanhamento;
  plano: PlanoAluno;
  status: StatusAluno;
  senhaInicial?: string;
  primeiroAcesso?: boolean;
  responsavel1: Responsavel;
  responsavel2: Responsavel;
  endereco: {
    rua: string;
    bairro: string;
    cidade: string;
  };
  matriculas?: any[];
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
  Atraso: 'Atraso',
  Pontual: 'Pontual',
};

export const comportamentoReforcoLabels: Record<Comportamento, string> = {
  Exemplar: 'Exemplar',
  Adequado: 'Adequado',
  Instável: 'Instável',
  Disperso: 'Disperso',
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
  { id: 'a1', numero: '0123', nome: 'Ana Clara Pereira da Silva', turmaId: 'T001', turma: '5A Manhã', acompanhamento: 'pre_cmt_5', plano: 'elite', status: 'ativo', senhaInicial: '1234', primeiroAcesso: false, responsavel1: { nome: 'Maria Pereira da Silva', telefone: '(11) 99999-1234' }, responsavel2: { nome: 'José Carlos Silva', telefone: '(11) 99999-5678' }, endereco: { rua: 'Rua das Flores, 123', bairro: 'Jardim Primavera', cidade: 'São Paulo' } },
  { id: 'a2', numero: '0124', nome: 'Bruno Santos Lima', turmaId: 'T001', turma: '5A Manhã', acompanhamento: 'pre_cmt_5', plano: 'acompanhamento', status: 'ativo', senhaInicial: '2345', primeiroAcesso: false, responsavel1: { nome: 'Cláudia Santos', telefone: '(11) 99999-2345' }, responsavel2: { nome: 'Ricardo Lima', telefone: '(11) 99999-6789' }, endereco: { rua: 'Av. Brasil, 456', bairro: 'Centro', cidade: 'São Paulo' } },
  { id: 'a3', numero: '0125', nome: 'Carla Beatriz Rocha', turmaId: 'T002', turma: '5B Tarde', acompanhamento: 'pre_cmt_5', plano: 'padrao', status: 'inativo', senhaInicial: '3456', primeiroAcesso: true, responsavel1: { nome: 'Fernanda Rocha', telefone: '(11) 99999-3456' }, responsavel2: { nome: 'Paulo Rocha', telefone: '(11) 99999-7890' }, endereco: { rua: 'Rua do Comércio, 789', bairro: 'Vila Nova', cidade: 'São Paulo' } },
  { id: 'a4', numero: '0126', nome: 'Davi Fernandes Costa', turmaId: 'T001', turma: '5A Manhã', acompanhamento: 'pre_cmt_5', plano: 'padrao', status: 'ativo', senhaInicial: '4567', primeiroAcesso: false, responsavel1: { nome: 'José Costa', telefone: '(11) 99999-4567' }, responsavel2: { nome: 'Mariana Fernandes', telefone: '(11) 99999-8901' }, endereco: { rua: 'Rua São José, 321', bairro: 'Bela Vista', cidade: 'São Paulo' } },
  { id: 'a5', numero: '0127', nome: 'Eduarda Martins Souza', turmaId: 'T004', turma: '4A Manhã', acompanhamento: 'projeto_4', plano: 'acompanhamento', status: 'ativo', senhaInicial: '5670', primeiroAcesso: false, responsavel1: { nome: 'Rita Martins', telefone: '(11) 99999-5670' }, responsavel2: { nome: 'André Souza', telefone: '(11) 99999-9012' }, endereco: { rua: 'Rua da Escola, 654', bairro: 'Parque Industrial', cidade: 'São Paulo' } },
  { id: 'a6', numero: '0128', nome: 'Felipe Almeida Oliveira', turmaId: 'T004', turma: '4A Manhã', acompanhamento: 'projeto_4', plano: 'elite', status: 'ativo', senhaInicial: '6781', primeiroAcesso: false, responsavel1: { nome: 'Marcos Almeida', telefone: '(11) 99999-6781' }, responsavel2: { nome: 'Sandra Oliveira', telefone: '(11) 99999-0123' }, endereco: { rua: 'Av. Paulista, 987', bairro: 'Consolação', cidade: 'São Paulo' } },
  { id: 'a7', numero: '0129', nome: 'Gabriela Pereira Santos', turmaId: 'T006', turma: 'Reforço Geral', acompanhamento: 'reforco', plano: 'padrao', status: 'ativo', senhaInicial: '7892', primeiroAcesso: false, responsavel1: { nome: 'Paula Pereira', telefone: '(11) 99999-7892' }, responsavel2: { nome: 'Fernando Santos', telefone: '(11) 99999-1230' }, endereco: { rua: 'Rua Esperança, 111', bairro: 'Liberdade', cidade: 'São Paulo' } },
  { id: 'a8', numero: '0130', nome: 'Henrique Ribeiro Gomes', turmaId: 'T002', turma: '5B Tarde', acompanhamento: 'pre_cmt_5', plano: 'acompanhamento', status: 'ativo', senhaInicial: '8903', primeiroAcesso: false, responsavel1: { nome: 'Luciana Ribeiro', telefone: '(11) 99999-8903' }, responsavel2: { nome: 'Roberto Gomes', telefone: '(11) 99999-2341' }, endereco: { rua: 'Rua das Palmeiras, 222', bairro: 'Vila Mariana', cidade: 'São Paulo' } },
  { id: 'a9', numero: '0131', nome: 'Isabela Ferreira Nunes', turmaId: 'T001', turma: '5A Manhã', acompanhamento: 'pre_cmt_5', plano: 'padrao', status: 'ativo', senhaInicial: '9014', primeiroAcesso: true, responsavel1: { nome: 'Tatiana Ferreira', telefone: '(11) 99999-9014' }, responsavel2: { nome: 'Carlos Nunes', telefone: '(11) 99999-3452' }, endereco: { rua: 'Rua do Sol, 333', bairro: 'Pinheiros', cidade: 'São Paulo' } },
  { id: 'a10', numero: '0132', nome: 'João Pedro Araújo', turmaId: 'T005', turma: '4B Tarde', acompanhamento: 'projeto_4', plano: 'padrao', status: 'ativo', senhaInicial: '0125', primeiroAcesso: false, responsavel1: { nome: 'Ana Araújo', telefone: '(11) 99999-0125' }, responsavel2: { nome: 'Pedro Araújo', telefone: '(11) 99999-4563' }, endereco: { rua: 'Rua Lírios, 444', bairro: 'Moema', cidade: 'São Paulo' } },
  { id: 'a11', numero: '0133', nome: 'Larissa Mendes Carvalho', turmaId: 'T006', turma: 'Reforço Geral', acompanhamento: 'reforco', plano: 'acompanhamento', status: 'ativo', senhaInicial: '1236', primeiroAcesso: false, responsavel1: { nome: 'Juliana Mendes', telefone: '(11) 99999-1236' }, responsavel2: { nome: 'Wagner Carvalho', telefone: '(11) 99999-5674' }, endereco: { rua: 'Av. Independência, 555', bairro: 'Ipiranga', cidade: 'São Paulo' } },
  { id: 'a12', numero: '0134', nome: 'Mateus Oliveira Lima', turmaId: 'T001', turma: '5A Manhã', acompanhamento: 'pre_cmt_5', plano: 'elite', status: 'ativo', senhaInicial: '2347', primeiroAcesso: false, responsavel1: { nome: 'Cristiane Oliveira', telefone: '(11) 99999-2347' }, responsavel2: { nome: 'Eduardo Lima', telefone: '(11) 99999-6785' }, endereco: { rua: 'Rua Harmonia, 666', bairro: 'Vila Madalena', cidade: 'São Paulo' } },
];

// ── Labels de Plano ──
export const planoLabels: Record<PlanoAluno, string> = {
  padrao: 'Padrão',
  acompanhamento: 'Acompanhamento',
  elite: 'Elite',
};

export const planoBadgeColors: Record<PlanoAluno, { bg: string; text: string; border: string }> = {
  padrao: { bg: '#e8eef7', text: '#1A3A6B', border: '#1A3A6B' },
  acompanhamento: { bg: '#fdf5d3', text: '#92400E', border: '#F5C800' },
  elite: { bg: 'linear-gradient(135deg, #fdf5d3, #fef3c7)', text: '#78350F', border: '#D97706' },
};

export const registrosLancados: RegistroLancado[] = [];

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

// ── Matriz de Acesso por Plano ──
// true = liberado, false = bloqueado
export const PLAN_ACCESS: Record<string, Record<PlanoAluno, boolean>> = {
  'inicio_registro_semana': { padrao: false, acompanhamento: true, elite: true },
  'acompanhamento': { padrao: false, acompanhamento: true, elite: true },
  'relatorio_mensal': { padrao: false, acompanhamento: true, elite: true },
  'relatorio_simulado': { padrao: false, acompanhamento: false, elite: true },
};

// ── XP Config ──
export const XP_VALUES = {
  revisao_bloco: 10,
  assistir_videoaula: 15,
  fazer_palavra_chave: 20,
  aula_presencial: 30,
  fazer_fixacao: 15,
  completar_simulado: 50,
};

// ── Portal Types ──

export interface ConquistaAluno {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  desbloqueada: boolean;
  dataDesbloqueio?: string;
}

export interface TarefaSemana {
  id: string;
  ordem: number;
  titulo: string;
  tipo: 'revisao' | 'pre_aula' | 'aula_presencial' | 'simulado' | 'atividade';
  disciplina?: string;
  bloco?: string;
  xp: number;
  status: 'concluido' | 'em_andamento' | 'pendente' | 'bloqueada';
  subTarefas?: {
    id: string;
    titulo: string;
    tipo: 'videoaula' | 'apostila' | 'fixacao';
    status: 'concluido' | 'em_andamento' | 'pendente';
    xp: number;
  }[];
}

export interface CronogramaSemana {
  turmaId: string;
  semana: string;
  periodo: string;
  tarefas: TarefaSemana[];
}

export interface Videoaula {
  id: string;
  titulo: string;
  disciplina: string;
  bloco: string;
  duracao: string;
  status: 'assistido' | 'disponivel' | 'bloqueado';
  xp: number;
  thumbnailColor: string;
  turmaNome?: string;
  dataLiberacao?: string | null;
}

export interface Simulado {
  id: string;
  titulo: string;
  data: string;
  status: 'realizado' | 'pendente' | 'agendado';
  totalQuestoes?: number;
  acertos?: number;
  temGabarito: boolean;
  temCorrecaoVideo: boolean;
  resultadoPorBloco?: {
    bloco: string;
    disciplina: string;
    acertos: number;
    total: number;
    classificacao: 'muito_bom' | 'regular' | 'precisa_revisar';
  }[];
  turmaNome?: string;
}

export interface RegistroSemanal {
  semana: string;
  presenca: boolean;
  palavraChave: boolean;
  fixacao: boolean;
  atencao: 'atento' | 'distraido' | 'desinteressado';
  comportamento: 'excelente' | 'bom' | 'agitado';
  pontualidade: boolean;
  observacaoProfessora?: string;
}

export interface ComunicadoEscola {
  id: string;
  titulo: string;
  conteudo: string;
  tipo: 'urgente' | 'informativo' | 'aviso';
  data: string;
  turmas: string[];
}

export interface MaterialDownload {
  id: string;
  titulo: string;
  tipo: 'apostila' | 'cronograma' | 'revisao' | 'combinados';
  turmaId: string;
  tamanho: string;
  dataUpload: string;
}

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

export function canAccessFeature(feature: string, plano: PlanoAluno): boolean {
  return PLAN_ACCESS[feature]?.[plano] ?? true;
}
