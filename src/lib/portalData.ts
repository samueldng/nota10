// ═══════════════════════════════════════════════════════
// PORTAL DO ALUNO — Dados e Helpers do Portal (Persistência LocalStorage)
// ═══════════════════════════════════════════════════════

import type {
  PlanoAluno,
  ConquistaAluno,
  TarefaSemana,
  CronogramaSemana,
  ComunicadoEscola,
  MaterialDownload,
  Simulado,
  RegistroSemanal,
} from './mockData';
import { XP_VALUES } from './mockData';

// ── Interface Estendida de Videoaula ──
export interface Videoaula {
  id: string;
  titulo: string;
  disciplina: string;
  bloco: string;
  duracao: string;
  status: 'assistido' | 'disponivel' | 'bloqueado';
  xp: number;
  thumbnailColor: string;
  videoSource: 'youtube' | 'local';
  videoUrl?: string; // link do youtube ou nome do arquivo local
  turmaNome?: string;
}

// ── Configurações da Escola ──
export const ESCOLA_CONFIG = {
  whatsappSuporte: '5599988499016',
  nomeEscola: 'Nota 10 Educacional',
};

// ── Gamificação: Níveis e XP Dinâmico por Aluno (LocalStorage) ──
const XP_POR_NIVEL = 100;

export interface StudentProgress {
  xpTotal: number;
  streak: number;
  completas: string[]; // IDs de tarefas/vídeos completados
}

const DEFAULT_PROGRESS: Record<string, StudentProgress> = {
  'a1': { xpTotal: 385, streak: 7, completas: ['v1', 'v2', 'v6', 'v7', 't1', 't2'] },
  'a2': { xpTotal: 240, streak: 4, completas: ['v1', 'v6', 't1'] },
  'a4': { xpTotal: 150, streak: 2, completas: ['v2', 't2'] },
  'a12': { xpTotal: 320, streak: 5, completas: ['v1', 'v2', 'v6', 't1'] },
  'a9': { xpTotal: 90, streak: 1, completas: [] },
};

function getStudentProgress(alunoId: string): StudentProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS[alunoId] || { xpTotal: 100, streak: 3, completas: [] };
  const key = `nota10_student_progress_${alunoId}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }
  const initial = DEFAULT_PROGRESS[alunoId] || { xpTotal: 100, streak: 3, completas: [] };
  localStorage.setItem(key, JSON.stringify(initial));
  return initial;
}

function saveStudentProgress(alunoId: string, progress: StudentProgress) {
  if (typeof window === 'undefined') return;
  const key = `nota10_student_progress_${alunoId}`;
  localStorage.setItem(key, JSON.stringify(progress));
  // Emit event to update components
  window.dispatchEvent(new Event('nota10_progress_updated'));
}

export function getXPTotal(alunoId: string): number {
  return getStudentProgress(alunoId).xpTotal;
}

export function getNivel(xpTotal: number): number {
  return Math.floor(xpTotal / XP_POR_NIVEL) + 1;
}

export function getXPParaProximoNivel(xpTotal: number): { atual: number; proximo: number; progresso: number } {
  const atual = xpTotal % XP_POR_NIVEL;
  return {
    atual,
    proximo: XP_POR_NIVEL,
    progresso: Math.round((atual / XP_POR_NIVEL) * 100),
  };
}

export function getStreak(alunoId: string): number {
  return getStudentProgress(alunoId).streak;
}

// Dar XP e marcar tarefa/vídeo como completo
export function completeTask(alunoId: string, itemId: string, xpPoints: number): { leveledUp: boolean; newLevel: number } {
  const progress = getStudentProgress(alunoId);
  if (progress.completas.includes(itemId)) {
    return { leveledUp: false, newLevel: getNivel(progress.xpTotal) };
  }

  const oldLevel = getNivel(progress.xpTotal);
  progress.completas.push(itemId);
  progress.xpTotal += xpPoints;
  const newLevel = getNivel(progress.xpTotal);

  saveStudentProgress(alunoId, progress);

  return {
    leveledUp: newLevel > oldLevel,
    newLevel,
  };
}

export function isItemCompleted(alunoId: string, itemId: string): boolean {
  return getStudentProgress(alunoId).completas.includes(itemId);
}

// ── Avatares ──
const AVATAR_COLORS = [
  '#1A3A6B', '#8B5CF6', '#22C55E', '#EF4444', '#F59E0B',
  '#3B82F6', '#EC4899', '#14B8A6', '#F97316', '#6366F1',
];

export function getAvatarColor(nome: string): string {
  const hash = nome.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function getIniciais(nome: string): string {
  const partes = nome.split(' ').filter(p => p.length > 2);
  if (partes.length >= 2) {
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }
  return nome.substring(0, 2).toUpperCase();
}

// ── Conquistas ──
export function getConquistas(alunoId: string): ConquistaAluno[] {
  const progress = getStudentProgress(alunoId);
  const completions = progress.completas;

  return [
    { id: 'c1', nome: 'Primeira Aula', descricao: 'Participou da primeira aula presencial', icone: '🎓', desbloqueada: true, dataDesbloqueio: '05/03/2026' },
    { id: 'c2', nome: 'Palavra-chave Perfeita', descricao: 'Completou 100% da palavra-chave na primeira tentativa', icone: '🔑', desbloqueada: true, dataDesbloqueio: '12/03/2026' },
    { id: 'c3', nome: 'Sem Faltas no Mês', descricao: 'Nenhuma falta registrada durante um mês inteiro', icone: '🏆', desbloqueada: true, dataDesbloqueio: '31/03/2026' },
    { id: 'c4', nome: 'Sequência de 5 Semanas', descricao: '5 semanas seguidas sem falta', icone: '🔥', desbloqueada: progress.streak >= 5, dataDesbloqueio: progress.streak >= 5 ? '02/05/2026' : undefined },
    { id: 'c5', nome: 'Maratonista de Vídeos', descricao: 'Assistiu 5 ou mais videoaulas completas', icone: '📺', desbloqueada: completions.filter(c => c.startsWith('v')).length >= 5, dataDesbloqueio: '15/04/2026' },
    { id: 'c6', nome: 'Explorador de Blocos', descricao: 'Completou atividades em todos os 4 blocos', icone: '🗺️', desbloqueada: completions.includes('v3') && completions.includes('v8'), dataDesbloqueio: completions.includes('v3') && completions.includes('v8') ? '01/07/2026' : undefined },
    { id: 'c7', nome: 'Mestre do Simulado', descricao: 'Acertou mais de 80% em um simulado', icone: '⭐', desbloqueada: alunoId === 'a1', dataDesbloqueio: alunoId === 'a1' ? '15/04/2026' : undefined },
    { id: 'c8', nome: 'Dedicação Total', descricao: 'Completou 8 ou mais missões na Trilha', icone: '💎', desbloqueada: completions.length >= 8 },
  ];
}

// ── Progresso por disciplina ──
export function getProgressoDisciplina(alunoId: string): { disciplina: string; blocosTotal: number; blocosCompletos: number; blocoAtual: number }[] {
  const completions = getStudentProgress(alunoId).completas;

  const portCompletas = completions.filter(c => c.startsWith('v') && ['v1', 'v2', 'v3', 'v4'].includes(c)).length;
  const matCompletas = completions.filter(c => c.startsWith('v') && ['v6', 'v7', 'v8', 'v9'].includes(c)).length;

  return [
    {
      disciplina: 'Português',
      blocosTotal: 4,
      blocosCompletos: portCompletas >= 3 ? 3 : portCompletas >= 1 ? 1 : 0,
      blocoAtual: portCompletas >= 3 ? 4 : portCompletas >= 1 ? 2 : 1,
    },
    {
      disciplina: 'Matemática',
      blocosTotal: 4,
      blocosCompletos: matCompletas >= 2 ? 2 : matCompletas >= 1 ? 1 : 0,
      blocoAtual: matCompletas >= 2 ? 3 : matCompletas >= 1 ? 2 : 1,
    },
  ];
}

// ── Cronograma da Semana ──
export function getCronogramaSemana(turmaId: string): CronogramaSemana {
  // Retorna cronograma básico
  return {
    turmaId,
    semana: 'Semana 12',
    periodo: '30/06 a 04/07/2026',
    tarefas: [
      {
        id: 't1', ordem: 1, titulo: 'Revisão do Bloco I — Português', tipo: 'revisao',
        disciplina: 'Português', bloco: 'Bloco 1', xp: XP_VALUES.revisao_bloco,
        status: 'concluido',
      },
      {
        id: 't2', ordem: 2, titulo: 'Revisão do Bloco I — Matemática', tipo: 'revisao',
        disciplina: 'Matemática', bloco: 'Bloco 1', xp: XP_VALUES.revisao_bloco,
        status: 'concluido',
      },
      {
        id: 't3', ordem: 3, titulo: 'Pré-aula Bloco II — Português', tipo: 'pre_aula',
        disciplina: 'Português', bloco: 'Bloco 2', xp: XP_VALUES.assistir_videoaula + XP_VALUES.revisao_bloco + XP_VALUES.fazer_fixacao,
        status: 'em_andamento',
        subTarefas: [
          { id: 'st1', titulo: 'Assistir videoaula', tipo: 'videoaula', status: 'concluido', xp: XP_VALUES.assistir_videoaula },
          { id: 'st2', titulo: 'Ler apostila', tipo: 'apostila', status: 'em_andamento', xp: XP_VALUES.revisao_bloco },
          { id: 'st3', titulo: 'Fazer questão de fixação', tipo: 'fixacao', status: 'pendente', xp: XP_VALUES.fazer_fixacao },
        ],
      },
      {
        id: 't4', ordem: 4, titulo: 'Pré-aula Bloco II — Matemática', tipo: 'pre_aula',
        disciplina: 'Matemática', bloco: 'Bloco 2', xp: XP_VALUES.assistir_videoaula + XP_VALUES.revisao_bloco + XP_VALUES.fazer_fixacao,
        status: 'pendente',
        subTarefas: [
          { id: 'st4', titulo: 'Assistir videoaula', tipo: 'videoaula', status: 'pendente', xp: XP_VALUES.assistir_videoaula },
          { id: 'st5', titulo: 'Ler apostila', tipo: 'apostila', status: 'pendente', xp: XP_VALUES.revisao_bloco },
          { id: 'st6', titulo: 'Fazer questão de fixação', tipo: 'fixacao', status: 'pendente', xp: XP_VALUES.fazer_fixacao },
        ],
      },
      {
        id: 't5', ordem: 5, titulo: 'Aula Presencial', tipo: 'aula_presencial',
        xp: XP_VALUES.aula_presencial,
        status: 'pendente',
      },
    ],
  };
}

export function getProximaAula(turmaId: string) {
  return {
    data: '02/07/2026',
    diaSemana: 'Quarta-feira',
    horario: '08:00 - 12:00',
    local: 'Presencial — Sede',
    blocos: [
      { disciplina: 'Português', bloco: 'Bloco II' },
      { disciplina: 'Matemática', bloco: 'Bloco II' },
    ],
  };
}

// ── PERSISTÊNCIA: VIDEOAULAS ──

const DEFAULT_VIDEOAULAS: Videoaula[] = [
  { id: 'v1', titulo: 'Interpretação de Texto — Bloco I', disciplina: 'Português', bloco: 'Bloco 1', duracao: '12:30', status: 'assistido', xp: 15, thumbnailColor: '#3B82F6', videoSource: 'youtube', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { id: 'v2', titulo: 'Gramática Básica — Bloco I', disciplina: 'Português', bloco: 'Bloco 1', duracao: '15:00', status: 'assistido', xp: 15, thumbnailColor: '#3B82F6', videoSource: 'youtube', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { id: 'v3', titulo: 'Produção de Texto — Bloco II', disciplina: 'Português', bloco: 'Bloco 2', duracao: '18:45', status: 'disponivel', xp: 15, thumbnailColor: '#8B5CF6', videoSource: 'youtube', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { id: 'v4', titulo: 'Figuras de Linguagem — Bloco II', disciplina: 'Português', bloco: 'Bloco 2', duracao: '14:20', status: 'disponivel', xp: 15, thumbnailColor: '#8B5CF6', videoSource: 'youtube', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { id: 'v5', titulo: 'Análise Textual — Bloco III', disciplina: 'Português', bloco: 'Bloco 3', duracao: '20:00', status: 'bloqueado', xp: 15, thumbnailColor: '#64748B', videoSource: 'local', videoUrl: 'video_aula_local_01.mp4' },
  { id: 'v6', titulo: 'Operações Fundamentais — Bloco I', disciplina: 'Matemática', bloco: 'Bloco 1', duracao: '16:30', status: 'assistido', xp: 15, thumbnailColor: '#22C55E', videoSource: 'youtube', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { id: 'v7', titulo: 'Frações e Decimais — Bloco I', disciplina: 'Matemática', bloco: 'Bloco 1', duracao: '19:00', status: 'assistido', xp: 15, thumbnailColor: '#22C55E', videoSource: 'youtube', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { id: 'v8', titulo: 'Geometria Básica — Bloco II', disciplina: 'Matemática', bloco: 'Bloco 2', duracao: '17:15', status: 'disponivel', xp: 15, thumbnailColor: '#F59E0B', videoSource: 'local', videoUrl: 'video_aula_local_02.mp4' },
  { id: 'v9', titulo: 'Problemas e Raciocínio — Bloco II', disciplina: 'Matemática', bloco: 'Bloco 2', duracao: '21:00', status: 'bloqueado', xp: 15, thumbnailColor: '#64748B', videoSource: 'youtube', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { id: 'v10', titulo: 'Medidas e Unidades — Bloco III', disciplina: 'Matemática', bloco: 'Bloco 3', duracao: '18:00', status: 'bloqueado', xp: 15, thumbnailColor: '#64748B', videoSource: 'youtube', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
];

export function getVideoaulas(alunoId?: string): Videoaula[] {
  if (typeof window === 'undefined') return DEFAULT_VIDEOAULAS;
  const stored = localStorage.getItem('nota10_videoaulas');
  let list = DEFAULT_VIDEOAULAS;
  if (stored) {
    try {
      list = JSON.parse(stored);
    } catch {
      // ignore
    }
  } else {
    localStorage.setItem('nota10_videoaulas', JSON.stringify(DEFAULT_VIDEOAULAS));
  }

  // Se o alunoId for fornecido, marcar dinamicamente os vídeos assistidos com base no progresso dele
  if (alunoId) {
    const progress = getStudentProgress(alunoId);
    return list.map(v => ({
      ...v,
      status: progress.completas.includes(v.id)
        ? 'assistido'
        : v.status === 'assistido'
        ? 'disponivel'
        : v.status,
    }));
  }

  return list;
}

export function addVideoaula(video: Videoaula) {
  if (typeof window === 'undefined') return;
  const list = getVideoaulas();
  list.push(video);
  localStorage.setItem('nota10_videoaulas', JSON.stringify(list));
}

export function deleteVideoaula(id: string) {
  if (typeof window === 'undefined') return;
  const list = getVideoaulas().filter(v => v.id !== id);
  localStorage.setItem('nota10_videoaulas', JSON.stringify(list));
}

// ── PERSISTÊNCIA: MATERIAIS ──

const DEFAULT_MATERIAIS: MaterialDownload[] = [
  { id: 'm1', titulo: 'Apostila Pré-CMT 5º Ano — Volume 1', tipo: 'apostila', turmaId: 'T001', tamanho: '12.4 MB', dataUpload: '01/03/2026' },
  { id: 'm2', titulo: 'Cronograma Mensal — Julho 2026', tipo: 'cronograma', turmaId: 'T001', tamanho: '1.2 MB', dataUpload: '28/06/2026' },
  { id: 'm3', titulo: 'Lista de Revisão — Bloco I Português', tipo: 'revisao', turmaId: 'T001', tamanho: '3.5 MB', dataUpload: '15/06/2026' },
  { id: 'm4', titulo: 'Lista de Revisão — Bloco I Matemática', tipo: 'revisao', turmaId: 'T001', tamanho: '2.8 MB', dataUpload: '15/06/2026' },
  { id: 'm5', titulo: 'Combinados e Regras da Turma 2026', tipo: 'combinados', turmaId: 'T001', tamanho: '0.8 MB', dataUpload: '01/03/2026' },
  { id: 'm6', titulo: 'Calendário de Simulados — 2º Semestre', tipo: 'cronograma', turmaId: 'T001', tamanho: '0.5 MB', dataUpload: '28/06/2026' },
];

export function getMateriais(turmaId?: string): MaterialDownload[] {
  if (typeof window === 'undefined') return DEFAULT_MATERIAIS;
  const stored = localStorage.getItem('nota10_materiais');
  let list = DEFAULT_MATERIAIS;
  if (stored) {
    try {
      list = JSON.parse(stored);
    } catch {
      // ignore
    }
  } else {
    localStorage.setItem('nota10_materiais', JSON.stringify(DEFAULT_MATERIAIS));
  }

  if (turmaId) {
    return list.filter(m => m.turmaId === turmaId || m.turmaId === 'todas');
  }
  return list;
}

export function addMaterial(material: MaterialDownload) {
  if (typeof window === 'undefined') return;
  const list = getMateriais();
  list.push(material);
  localStorage.setItem('nota10_materiais', JSON.stringify(list));
}

export function deleteMaterial(id: string) {
  if (typeof window === 'undefined') return;
  const list = getMateriais().filter(m => m.id !== id);
  localStorage.setItem('nota10_materiais', JSON.stringify(list));
}

// ── PERSISTÊNCIA: COMUNICADOS ──

const DEFAULT_COMUNICADOS: ComunicadoEscola[] = [
  { id: 'com1', titulo: '🚨 Alteração de Horário — Aula de Quarta', tipo: 'urgente', conteudo: 'Informamos que a aula de quarta-feira (02/07) será antecipada para às 07:30 devido à reunião pedagógica no período da tarde. Pedimos que os alunos cheguem pontualmente.', data: '30/06/2026', turmas: ['T001', 'T002', 'T003'] },
  { id: 'com2', titulo: 'Calendário de Simulados — 2º Semestre', tipo: 'informativo', conteudo: 'O calendário de simulados do 2º semestre já está disponível na aba Materiais. As datas são: 15/08, 26/09 e 21/11. Preparem-se!', data: '28/06/2026', turmas: ['T001', 'T002', 'T003', 'T004', 'T005'] },
  { id: 'com3', titulo: 'Lembrete: Uniforme Obrigatório', tipo: 'aviso', conteudo: 'Reforçamos que o uso do uniforme completo é obrigatório em todas as aulas presenciais. Alunos sem uniforme poderão ser orientados a retornar para buscar.', data: '25/06/2026', turmas: ['T001', 'T002', 'T003', 'T004', 'T005', 'T006'] },
  { id: 'com4', titulo: 'Reunião de Pais — Julho', tipo: 'informativo', conteudo: 'A reunião de pais e responsáveis do mês de julho será realizada no dia 12/07 (sábado) às 09:00 na sede. Contamos com a presença de todos!', data: '20/06/2026', turmas: ['T001', 'T002', 'T003', 'T004', 'T005', 'T006'] },
];

export function getComunicados(turmaId?: string): ComunicadoEscola[] {
  if (typeof window === 'undefined') return DEFAULT_COMUNICADOS;
  const stored = localStorage.getItem('nota10_comunicados');
  let list = DEFAULT_COMUNICADOS;
  if (stored) {
    try {
      list = JSON.parse(stored);
    } catch {
      // ignore
    }
  } else {
    localStorage.setItem('nota10_comunicados', JSON.stringify(DEFAULT_COMUNICADOS));
  }

  if (turmaId) {
    return list.filter(c => c.turmas.includes(turmaId) || c.turmas.includes('todas'));
  }
  return list;
}

export function addComunicado(comunicado: ComunicadoEscola) {
  if (typeof window === 'undefined') return;
  const list = getComunicados();
  list.push(comunicado);
  localStorage.setItem('nota10_comunicados', JSON.stringify(list));
}

export function deleteComunicado(id: string) {
  if (typeof window === 'undefined') return;
  const list = getComunicados().filter(c => c.id !== id);
  localStorage.setItem('nota10_comunicados', JSON.stringify(list));
}

// ── Simulados Mock ──
export function getSimulados(alunoId: string): Simulado[] {
  const isAdvanced = alunoId === 'a1' || alunoId === 'a12';
  if (!isAdvanced) {
    return [
      {
        id: 's1', titulo: '1º Simulado Preparatório', data: '15/08/2026',
        status: 'agendado', temGabarito: false, temCorrecaoVideo: false,
      },
    ];
  }
  return [
    {
      id: 's1', titulo: '1º Simulado Diagnóstico', data: '15/04/2026',
      status: 'realizado', totalQuestoes: 40, acertos: 28, temGabarito: true, temCorrecaoVideo: true,
      resultadoPorBloco: [
        { bloco: 'Bloco 1', disciplina: 'Português', acertos: 8, total: 10, classificacao: 'muito_bom' },
        { bloco: 'Bloco 2', disciplina: 'Português', acertos: 6, total: 10, classificacao: 'regular' },
        { bloco: 'Bloco 1', disciplina: 'Matemática', acertos: 9, total: 10, classificacao: 'muito_bom' },
        { bloco: 'Bloco 2', disciplina: 'Matemática', acertos: 5, total: 10, classificacao: 'precisa_revisar' },
      ],
    },
    {
      id: 's2', titulo: '2º Simulado Preparatório', data: '15/08/2026',
      status: 'agendado', temGabarito: false, temCorrecaoVideo: false,
    },
  ];
}

// ── Registro Semanal Mock ──
export function getRegistroSemanal(alunoId: string): RegistroSemanal {
  return {
    semana: 'Semana 11 — 23/06 a 27/06',
    presenca: true,
    palavraChave: true,
    fixacao: alunoId === 'a1',
    atencao: alunoId === 'a1' ? 'atento' : 'distraido',
    comportamento: alunoId === 'a1' || alunoId === 'a12' ? 'excelente' : 'bom',
    pontualidade: true,
    observacaoProfessora: 'O(a) aluno(a) demonstrou boa participação nas atividades desta semana. Recomenda-se continuar a rotina de estudos em casa com foco na revisão de conteúdos do Bloco II de Matemática.',
  };
}

// ── Conteúdo Bem-vindos ──
export const conteudoBemVindos = {
  metodo: {
    titulo: 'O que é o Método Pré-CMT?',
    texto: 'O Pré-CMT (Colégio Militar) é um programa de preparação intensiva para alunos do 5º ano que desejam ingressar no Colégio Militar. Nosso método combina aulas presenciais, videoaulas, exercícios de fixação e simulados para garantir a melhor preparação possível.',
  },
  familia: {
    titulo: 'O Papel da Família',
    texto: 'A participação da família é fundamental. Acompanhe as atividades semanais, incentive a rotina de estudos, e mantenha contato com a equipe pedagógica. Juntos, construímos o futuro do seu filho!',
  },
  plataforma: {
    titulo: 'Como Usar a Plataforma',
    passos: [
      'Acesse o Portal do Aluno com sua matrícula ou WhatsApp',
      'Confira as missões da semana na aba "Início"',
      'Assista às videoaulas na ordem indicada pela Trilha de Estudos',
      'Complete os exercícios de fixação após cada videoaula',
      'Acompanhe o progresso e as conquistas do seu filho',
    ],
  },
  apostila: {
    titulo: 'Como Usar a Apostila',
    texto: 'A apostila deve ser utilizada como material de apoio às videoaulas. Recomendamos ler o conteúdo antes da aula presencial para melhor aproveitamento. Marque os pontos de dúvida para discutir com o professor.',
  },
  rotina: {
    titulo: 'Rotina de Estudos Recomendada',
    passos: [
      { dia: 'Segunda', atividade: 'Revisão do bloco anterior + Videoaula novo bloco (Português)' },
      { dia: 'Terça', atividade: 'Exercícios de fixação Português + Leitura da apostila' },
      { dia: 'Quarta', atividade: 'AULA PRESENCIAL — levar apostila e caderno' },
      { dia: 'Quinta', atividade: 'Videoaula novo bloco (Matemática) + Exercícios' },
      { dia: 'Sexta', atividade: 'Revisão geral da semana + Simulado prático' },
      { dia: 'Sábado', atividade: 'Dia de descanso — leitura livre recomendada' },
    ],
  },
  combinados: {
    titulo: 'Combinados e Regras da Turma',
    regras: [
      'Pontualidade: chegar pelo menos 10 minutos antes do início da aula',
      'Uniforme completo obrigatório em todas as aulas presenciais',
      'Celular desligado durante as aulas — só com autorização do professor',
      'Material completo: apostila, caderno e estojo',
      'Respeito aos colegas e professores — zero tolerância para bullying',
      'Faltas devem ser justificadas até 24h após a aula',
    ],
  },
};

// ── Textos de Upgrade ──
export const upgradeTexts = {
  acompanhamento: {
    titulo: 'Acompanhe de Perto a Evolução do Seu Filho',
    subtitulo: 'Plano Acompanhamento',
    argumento: 'Famílias que acompanham de perto o desempenho escolar dos filhos aumentam em até 40% as chances de aprovação. Com o Plano Acompanhamento, você recebe relatórios detalhados, frequência, comportamento e a observação semanal da professora.',
    bullets: [
      'Frequência e pontualidade detalhada',
      'Atividades concluídas e engajamento',
      'Comportamento e atenção em sala de aula',
      'Observação semanal escrita pela professora',
      'Relatório mensal completo em PDF',
    ],
    provaSocial: '87% das famílias com Plano Acompanhamento relatam se sentir mais seguras sobre o processo de preparação.',
    ctaPrimario: 'Quero o Plano Acompanhamento',
    ctaWhatsApp: 'Falar com a Escola pelo WhatsApp',
  },
  elite: {
    titulo: 'O Máximo de Acompanhamento e Análise',
    subtitulo: 'Plano Elite',
    argumento: 'O Plano Elite oferece tudo do Plano Acompanhamento, mais o relatório detalhado de cada simulado — bloco a bloco, questão a questão. Saiba exatamente onde seu filho precisa focar para garantir a aprovação.',
    bullets: [
      'Tudo do Plano Acompanhamento',
      'Relatório detalhado de simulados por bloco e disciplina',
      'Classificação de desempenho: Muito Bom / Regular / Precisa Revisar',
      'Análise comparativa com a média da turma',
    ],
    provaSocial: 'Alunos do Plano Elite tiveram 30% mais acertos no último simulado em comparação à média geral.',
    ctaPrimario: 'Quero o Plano Elite',
    ctaWhatsApp: 'Falar com a Escola pelo WhatsApp',
  },
  relatorioMensal: {
    titulo: 'Relatório Mensal do Aluno',
    descricao: 'Relatório completo com a evolução do seu filho em cada bloco de Português e Matemática, dificuldades identificadas, evolução de atenção e participação, e recomendação de revisão personalizada.',
    conteudo: [
      'Progresso por bloco de Português e Matemática',
      'Dificuldades identificadas pela professora',
      'Evolução de atenção e participação ao longo do mês',
      'Recomendações de revisão personalizadas',
    ],
  },
  relatorioSimulado: {
    titulo: 'Relatório Detalhado do Simulado',
    descricao: 'Análise completa do desempenho no simulado: total de questões, acertos, erros, e detalhamento bloco a bloco com classificação de desempenho.',
    conteudo: [
      'Total de questões, acertos e erros',
      'Percentual de aproveitamento geral',
      'Detalhamento bloco a bloco — Português e Matemática',
      'Classificação: Muito Bom / Regular / Precisa Revisar',
    ],
  },
};

// ── Helper: gerar mensagem de WhatsApp ──
export function getWhatsAppUrl(nomeAluno: string, mensagem?: string): string {
  const texto = mensagem || `Olá! Sou responsável pelo(a) aluno(a) ${nomeAluno} e gostaria de mais informações.`;
  return `https://wa.me/${ESCOLA_CONFIG.whatsappSuporte}?text=${encodeURIComponent(texto)}`;
}

export function getWhatsAppUpgradeUrl(nomeAluno: string, plano: string): string {
  const texto = `Olá! Sou responsável pelo(a) aluno(a) ${nomeAluno} e gostaria de saber mais sobre o Plano ${plano}.`;
  return `https://wa.me/${ESCOLA_CONFIG.whatsappSuporte}?text=${encodeURIComponent(texto)}`;
}
