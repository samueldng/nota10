'use client';

import { useState } from 'react';
import {
  Search, FileText, Edit3, Star, AlertTriangle, Lightbulb,
  UserCheck, XCircle, Clock, PlayCircle, Target, Info, TrendingUp,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { alunos, turmas, disciplinas, acompanhamentoLabels, type Acompanhamento } from '@/lib/mockData';

const atencaoData = [
  { date: '01/04', aluno: 1.5, turma: 1.8 },
  { date: '15/04', aluno: 1.8, turma: 1.9 },
  { date: '29/04', aluno: 2.2, turma: 2.0 },
  { date: '13/05', aluno: 2.5, turma: 2.2 },
  { date: '27/05', aluno: 2.8, turma: 2.4 },
];

const participacaoData = [
  { date: '01/04', aluno: 1.0, turma: 1.5 },
  { date: '15/04', aluno: 1.5, turma: 1.8 },
  { date: '29/04', aluno: 2.0, turma: 2.0 },
  { date: '13/05', aluno: 2.2, turma: 2.2 },
  { date: '27/05', aluno: 2.8, turma: 2.5 },
];

const comportamentoData = [
  { date: '01/04', aluno: 2.5, turma: 2.6 },
  { date: '15/04', aluno: 2.8, turma: 2.7 },
  { date: '29/04', aluno: 3.0, turma: 2.8 },
  { date: '13/05', aluno: 3.0, turma: 2.8 },
  { date: '27/05', aluno: 3.0, turma: 2.9 },
];

function ChartCard({ title, data, domain = [0, 3] }: { title: string; data: typeof atencaoData; domain?: number[] }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <h4 className="text-sm font-bold text-[var(--color-azul-autoridade)] m-0">{title}</h4>
        <Info size={14} className="text-[var(--color-cinza-texto)]" />
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
          <YAxis domain={domain} tick={{ fontSize: 11, fill: '#64748B' }} ticks={domain[1] === 3 ? [0, 1, 2, 3] : undefined} />
          <Tooltip
            contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '12px' }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
          <Line type="monotone" dataKey="turma" stroke="#94A3B8" strokeDasharray="5 5" strokeWidth={2} dot={false} name="Média da turma" />
          <Line type="monotone" dataKey="aluno" stroke="#1A3A6B" strokeWidth={2.5} dot={{ r: 3, fill: '#1A3A6B' }} name="Aluno" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function RelatoriosPage() {
  const [showParecerEdit, setShowParecerEdit] = useState(false);
  const [acomp, setAcomp] = useState<Acompanhamento>('pre_cmt_5');
  const [turma, setTurma] = useState('');
  const [aluno, setAluno] = useState('');

  const isPreCMT = acomp === 'pre_cmt_5';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="animate-fade-in-up">
        <p className="text-[var(--color-cinza-texto)]">
          Acompanhe o desempenho e o desenvolvimento do aluno com gráficos por disciplina e parecer pedagógico gerado por IA.
        </p>
      </div>

      {/* Filters */}
      <div className="card animate-fade-in-up delay-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="form-group">
            <label className="form-label">Acompanhamento</label>
            <select className="form-select" value={acomp} onChange={(e) => setAcomp(e.target.value as Acompanhamento)}>
              <option value="pre_cmt_5">Pré-CMT 5º Ano</option>
              <option value="projeto_4">Projeto 4º Ano</option>
              <option value="reforco">Reforço</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Turma</label>
            <select className="form-select" value={turma} onChange={(e) => setTurma(e.target.value)}>
              <option value="">Selecione...</option>
              {turmas.filter(t => t.acompanhamento === acomp).map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Aluno</label>
            <select className="form-select" value={aluno} onChange={(e) => setAluno(e.target.value)}>
              <option value="">Selecione...</option>
              {alunos.filter(a => !turma || a.turmaId === turma).map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Período</label>
            <input type="date" className="form-input" />
          </div>
          <button className="btn btn-primary h-[42px]"><TrendingUp size={16} /> Gerar relatório</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 animate-fade-in-up delay-2">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#22C55E' }}><UserCheck size={22} /></div>
          <div><p className="text-2xl font-extrabold text-[#22C55E] leading-none">36</p><p className="text-xs font-bold text-[var(--color-azul-autoridade)] mt-0.5">Presenças</p><p className="text-[10px] text-[var(--color-cinza-texto)]">90% do período</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fee2e2', color: '#EF4444' }}><XCircle size={22} /></div>
          <div><p className="text-2xl font-extrabold text-[#EF4444] leading-none">4</p><p className="text-xs font-bold text-[var(--color-azul-autoridade)] mt-0.5">Faltas</p><p className="text-[10px] text-[var(--color-cinza-texto)]">10% do período</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#F59E0B' }}><Clock size={22} /></div>
          <div><p className="text-2xl font-extrabold text-[#F59E0B] leading-none">2</p><p className="text-xs font-bold text-[var(--color-azul-autoridade)] mt-0.5">Atrasos</p><p className="text-[10px] text-[var(--color-cinza-texto)]">5% do período</p></div>
        </div>
        {isPreCMT ? (
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#ede9fe', color: '#8B5CF6' }}><PlayCircle size={22} /></div>
            <div><p className="text-2xl font-extrabold text-[#8B5CF6] leading-none">85%</p><p className="text-xs font-bold text-[var(--color-azul-autoridade)] mt-0.5">Videoaula</p><p className="text-[10px] text-[var(--color-cinza-texto)]">Status médio (Fez)</p></div>
          </div>
        ) : (
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#ede9fe', color: '#8B5CF6' }}><PlayCircle size={22} /></div>
            <div><p className="text-2xl font-extrabold text-[#8B5CF6] leading-none">92%</p><p className="text-xs font-bold text-[var(--color-azul-autoridade)] mt-0.5">Praticar</p><p className="text-[10px] text-[var(--color-cinza-texto)]">Status médio (Fez)</p></div>
          </div>
        )}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#22C55E' }}><Target size={22} /></div>
          <div><p className="text-2xl font-extrabold text-[#22C55E] leading-none">82%</p><p className="text-xs font-bold text-[var(--color-azul-autoridade)] mt-0.5">Fixação</p><p className="text-[10px] text-[var(--color-cinza-texto)]">Status médio (Fez)</p></div>
        </div>
      </div>

      {/* Charts (Comportamentais) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up delay-3">
        <ChartCard title="Atenção" data={atencaoData} domain={[0, 3]} />
        <ChartCard title="Participação" data={participacaoData} domain={[0, 3]} />
        <ChartCard title="Comportamento" data={comportamentoData} domain={[0, 3]} />
      </div>

      {/* Parecer + PDF Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in-up delay-4">
        {/* Parecer IA */}
        <div className="lg:col-span-3 card flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-[var(--color-cinza-borda)] pb-3">
            <h3 className="text-base font-bold text-[var(--color-azul-autoridade)]">
              Parecer pedagógico estruturado
            </h3>
            <button className="btn btn-outline text-xs" onClick={() => setShowParecerEdit(!showParecerEdit)}>
              <Edit3 size={14} /> {showParecerEdit ? 'Salvar Edição' : 'Editar texto'}
            </button>
          </div>

          <div className="space-y-6 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="parecer-section">
                <h4 className="text-sm font-bold text-[var(--color-amarelo-conquista)] mb-3 flex items-center gap-2"><Star size={16} fill="currentColor" /> Pontos Fortes — Português</h4>
                {showParecerEdit ? <textarea className="form-input text-xs w-full h-24" defaultValue="Demonstra grande dedicação nas aulas de Português. Apresenta excelente compreensão dos conteúdos do Bloco 2. Participa ativamente das discussões sobre textos." /> : (
                  <ul className="space-y-1.5 text-xs text-[var(--color-cinza-escuro)] pl-6">
                    <li className="list-disc">Demonstra grande dedicação nas aulas de Português.</li>
                    <li className="list-disc">Apresenta excelente compreensão dos conteúdos do Bloco 2.</li>
                    <li className="list-disc">Participa ativamente das discussões sobre textos.</li>
                  </ul>
                )}
              </div>
              <div className="parecer-section">
                <h4 className="text-sm font-bold text-[var(--color-vermelho-erro)] mb-3 flex items-center gap-2"><AlertTriangle size={16} /> Pontos a Melhorar — Português</h4>
                {showParecerEdit ? <textarea className="form-input text-xs w-full h-24" defaultValue="Precisa melhorar a constância na resolução da seção 'Praticar'. Demonstrou dificuldade na fixação do Bloco 1 (Interpretação Avançada)." /> : (
                  <ul className="space-y-1.5 text-xs text-[var(--color-cinza-escuro)] pl-6">
                    <li className="list-disc">Precisa melhorar a constância na resolução da seção "Praticar".</li>
                    <li className="list-disc">Demonstrou dificuldade na fixação do Bloco 1 (Interpretação Avançada).</li>
                  </ul>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="parecer-section">
                <h4 className="text-sm font-bold text-[var(--color-amarelo-conquista)] mb-3 flex items-center gap-2"><Star size={16} fill="currentColor" /> Pontos Fortes — Matemática</h4>
                {showParecerEdit ? <textarea className="form-input text-xs w-full h-24" defaultValue="Atenção plena em sala de aula (nota máxima). Entrega as tarefas pontualmente. Tem facilidade com lógica e cálculo (Bloco 3)." /> : (
                  <ul className="space-y-1.5 text-xs text-[var(--color-cinza-escuro)] pl-6">
                    <li className="list-disc">Atenção plena em sala de aula (escala de atento constante).</li>
                    <li className="list-disc">Entrega as tarefas pontualmente (100% no mês).</li>
                    <li className="list-disc">Tem facilidade com lógica e cálculo no Bloco 3.</li>
                  </ul>
                )}
              </div>
              <div className="parecer-section">
                <h4 className="text-sm font-bold text-[var(--color-vermelho-erro)] mb-3 flex items-center gap-2"><AlertTriangle size={16} /> Pontos a Melhorar — Matemática</h4>
                {showParecerEdit ? <textarea className="form-input text-xs w-full h-24" defaultValue="Ocasionalmente assiste apenas metade da videoaula antes da classe. Evita participar oralmente quando o problema é complexo (Bloco 4)." /> : (
                  <ul className="space-y-1.5 text-xs text-[var(--color-cinza-escuro)] pl-6">
                    <li className="list-disc">Ocasionalmente assiste apenas metade da videoaula antes da classe.</li>
                    <li className="list-disc">Evita participar oralmente quando o problema é complexo (Bloco 4).</li>
                  </ul>
                )}
              </div>
            </div>

            <div className="parecer-section">
              <h4 className="text-sm font-bold text-[var(--color-azul-info)] mb-3 flex items-center gap-2"><Lightbulb size={16} /> Orientação Prática (Aluno e Família)</h4>
              {showParecerEdit ? <textarea className="form-input text-xs w-full h-20" defaultValue="Estabelecer horário fixo em casa para assistir à videoaula completa ANTES de resolver os blocos matemáticos. Incentivar a leitura em voz alta." /> : (
                <ul className="space-y-1.5 text-xs text-[var(--color-cinza-escuro)] pl-6">
                  <li className="list-disc">Estabelecer horário fixo em casa para assistir à videoaula completa <span className="font-bold">antes</span> de resolver os blocos matemáticos.</li>
                  <li className="list-disc">Incentivar a leitura em voz alta para ganhar confiança na participação oral.</li>
                </ul>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--color-cinza-borda)]">
            <button className="btn btn-primary w-full sm:w-auto ml-auto">
              <FileText size={16} /> Gerar PDF Final
            </button>
          </div>
        </div>

        {/* PDF Preview Mini */}
        <div className="lg:col-span-2 card bg-[var(--color-cinza-fundo)]">
          <h3 className="text-sm font-bold text-[var(--color-azul-autoridade)] mb-3 text-center">Prévia de Impressão</h3>
          <div className="bg-white border-2 border-[var(--color-cinza-borda)] rounded-lg p-4 shadow-sm h-[480px] overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-[var(--color-azul-autoridade)]" />
            <div className="text-center mt-2 mb-4 border-b pb-2">
              <h4 className="font-extrabold text-[10px] text-[var(--color-azul-autoridade)]">NOTA 10 EDUCACIONAL</h4>
              <p className="text-[8px] text-[var(--color-cinza-texto)] font-bold">RELATÓRIO DE ACOMPANHAMENTO PEDAGÓGICO</p>
            </div>
            <div className="text-[7px] space-y-1 mb-4">
              <p><strong>ALUNO:</strong> Maria Eduarda Silva</p>
              <p><strong>TURMA:</strong> 5A Manhã — {acompanhamentoLabels['pre_cmt_5']}</p>
              <p><strong>PERÍODO:</strong> 01/04 a 31/05</p>
            </div>
            <div className="flex gap-2 mb-4">
              <div className="flex-1 bg-gray-100 p-1 rounded text-center"><p className="text-[6px] font-bold">PRESENÇA</p><p className="text-[8px] font-bold text-green-600">90%</p></div>
              <div className="flex-1 bg-gray-100 p-1 rounded text-center"><p className="text-[6px] font-bold">VÍDEOAULA</p><p className="text-[8px] font-bold text-blue-600">Fez</p></div>
              <div className="flex-1 bg-gray-100 p-1 rounded text-center"><p className="text-[6px] font-bold">FIXAÇÃO</p><p className="text-[8px] font-bold text-yellow-600">Metade</p></div>
            </div>
            <div className="mb-4">
              <p className="text-[6px] font-bold border-b border-gray-200 mb-1">EVOLUÇÃO COMPORTAMENTAL</p>
              <div className="h-10 bg-gray-50 flex items-end gap-1 px-2 pt-2">
                <div className="w-full h-[60%] bg-blue-900/40 rounded-t" /><div className="w-full h-[70%] bg-blue-900/60 rounded-t" /><div className="w-full h-[80%] bg-blue-900/80 rounded-t" /><div className="w-full h-[100%] bg-blue-900 rounded-t" />
              </div>
            </div>
            <div>
              <p className="text-[6px] font-bold border-b border-gray-200 mb-1 text-green-700">PONTOS FORTES</p>
              <p className="text-[5px] leading-tight text-gray-600 mb-2">Demonstra grande dedicação nas aulas de Português. Apresenta excelente compreensão dos conteúdos do Bloco 2...</p>
              <p className="text-[6px] font-bold border-b border-gray-200 mb-1 text-red-700">PONTOS A MELHORAR</p>
              <p className="text-[5px] leading-tight text-gray-600 mb-2">Precisa melhorar a constância na resolução da seção "Praticar". Demonstrou dificuldade na fixação do Bloco 1...</p>
              <p className="text-[6px] font-bold border-b border-gray-200 mb-1 text-blue-700">ORIENTAÇÃO</p>
              <p className="text-[5px] leading-tight text-gray-600">Estabelecer horário fixo em casa para assistir à videoaula completa antes de resolver os blocos matemáticos...</p>
            </div>
            <div className="absolute bottom-4 left-0 w-full text-center">
              <p className="text-[5px] text-gray-400">Documento gerado eletronicamente em 06/06/2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
