'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAlunos, getRegistros } from '@/lib/api';
import type { Aluno } from '@/lib/mockData';
import {
  FileText, Star, AlertTriangle, Lightbulb,
  UserCheck, XCircle, Clock, PlayCircle, Target, Info, TrendingUp, Download, Eye
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// Behavioral mock data matching the student profile
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
  { date: '13/05', aluno: 2.2, strokeDasharray: '5 5', turma: 2.2 },
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

export default function ParentsDashboardPage() {
  const { user } = useAuth();
  const [alunoInfo, setAlunoInfo] = useState<Aluno | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAlunoData() {
      if (!user?.alunoId) return;
      try {
        const list = await getAlunos();
        const found = list.find(a => a.id === user.alunoId);
        if (found) {
          setAlunoInfo(found);
        }
      } catch (err) {
        console.error('Error fetching student details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAlunoData();
  }, [user]);

  const handlePrintPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 rounded-full border-4 border-[var(--color-azul-autoridade)]/20 border-t-[var(--color-azul-autoridade)] animate-spin" />
      </div>
    );
  }

  const studentName = alunoInfo?.nome || user?.alunoNome || 'Estudante';
  const studentNum = alunoInfo?.numero || user?.alunoNumero || '—';
  const studentClass = alunoInfo?.turma || '—';
  const isPreCMT = alunoInfo?.acompanhamento === 'pre_cmt_5';

  return (
    <div className="space-y-6">
      {/* Student Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-[var(--color-cinza-borda)] shadow-sm animate-fade-in-up">
        <div>
          <span className="text-xs font-bold text-[var(--color-amarelo-conquista)] uppercase tracking-wider block mb-1">
            Espaço da Família
          </span>
          <h2 className="text-2xl font-bold text-[var(--color-azul-autoridade)] m-0">
            Acompanhamento de {studentName}
          </h2>
          <p className="text-[var(--color-cinza-texto)] text-sm mt-1">
            Matrícula: <strong className="text-[var(--color-cinza-escuro)]">{studentNum}</strong> • Turma: <strong className="text-[var(--color-cinza-escuro)]">{studentClass}</strong>
          </p>
        </div>
        <button
          onClick={handlePrintPDF}
          className="btn btn-secondary flex items-center gap-2 text-xs py-2.5 px-4 w-full md:w-auto"
        >
          <Download size={14} />
          Baixar Relatório PDF
        </button>
      </div>

      {/* KPI Cards (Performance metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 animate-fade-in-up delay-1">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#22C55E' }}><UserCheck size={22} /></div>
          <div>
            <p className="text-2xl font-extrabold text-[#22C55E] leading-none">36</p>
            <p className="text-xs font-bold text-[var(--color-azul-autoridade)] mt-0.5">Presenças</p>
            <p className="text-[10px] text-[var(--color-cinza-texto)]">90% de frequência</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fee2e2', color: '#EF4444' }}><XCircle size={22} /></div>
          <div>
            <p className="text-2xl font-extrabold text-[#EF4444] leading-none">4</p>
            <p className="text-xs font-bold text-[var(--color-azul-autoridade)] mt-0.5">Faltas</p>
            <p className="text-[10px] text-[var(--color-cinza-texto)]">10% de ausência</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#F59E0B' }}><Clock size={22} /></div>
          <div>
            <p className="text-2xl font-extrabold text-[#F59E0B] leading-none">2</p>
            <p className="text-xs font-bold text-[var(--color-azul-autoridade)] mt-0.5">Atrasos</p>
            <p className="text-[10px] text-[var(--color-cinza-texto)]">Pontualidade em dia</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ede9fe', color: '#8B5CF6' }}><PlayCircle size={22} /></div>
          <div>
            <p className="text-2xl font-extrabold text-[#8B5CF6] leading-none">{isPreCMT ? '85%' : '92%'}</p>
            <p className="text-xs font-bold text-[var(--color-azul-autoridade)] mt-0.5">{isPreCMT ? 'Videoaula' : 'Praticar'}</p>
            <p className="text-[10px] text-[var(--color-cinza-texto)]">Engajamento nas tarefas</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#22C55E' }}><Target size={22} /></div>
          <div>
            <p className="text-2xl font-extrabold text-[#22C55E] leading-none">82%</p>
            <p className="text-xs font-bold text-[var(--color-azul-autoridade)] mt-0.5">Fixação</p>
            <p className="text-[10px] text-[var(--color-cinza-texto)]">Absorção de conteúdo</p>
          </div>
        </div>
      </div>

      {/* Behavioral evolution charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up delay-2">
        <ChartCard title="Evolução de Atenção" data={atencaoData} />
        <ChartCard title="Evolução de Participação" data={participacaoData} />
        <ChartCard title="Evolução de Comportamento" data={comportamentoData} />
      </div>

      {/* Pedagogical AI report + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in-up delay-3">
        {/* Pedagogical text */}
        <div className="lg:col-span-3 card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-[var(--color-cinza-borda)] pb-3">
              <h3 className="text-base font-bold text-[var(--color-azul-autoridade)] m-0">
                Parecer de Acompanhamento Pedagógico (Gerado por IA)
              </h3>
            </div>

            <div className="space-y-4">
              <div className="parecer-section">
                <h4 className="text-xs font-bold text-[var(--color-verde-sucesso)] mb-2 flex items-center gap-1.5">
                  <Star size={14} fill="currentColor" /> Pontos Fortes
                </h4>
                <ul className="space-y-1 text-xs text-[var(--color-cinza-escuro)] pl-4 list-disc">
                  <li>Demonstra grande dedicação e interesse em sala de aula.</li>
                  <li>Apresenta excelente compreensão nos exercícios de fixação.</li>
                  <li>Participa de forma construtiva das discussões em grupo.</li>
                </ul>
              </div>

              <div className="parecer-section">
                <h4 className="text-xs font-bold text-[var(--color-vermelho-erro)] mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={14} /> Pontos a Melhorar
                </h4>
                <ul className="space-y-1 text-xs text-[var(--color-cinza-escuro)] pl-4 list-disc">
                  <li>Precisa melhorar a constância na visualização de vídeoaulas antes do conteúdo.</li>
                  <li>Ocasionalmente demonstra alguma dispersão na transição de blocos.</li>
                </ul>
              </div>

              <div className="parecer-section">
                <h4 className="text-xs font-bold text-[var(--color-azul-info)] mb-2 flex items-center gap-1.5">
                  <Lightbulb size={14} /> Orientação Prática para Casa
                </h4>
                <ul className="space-y-1 text-xs text-[var(--color-cinza-escuro)] pl-4 list-disc">
                  <li>Incentivar a família a estabelecer uma rotina diária para assistir às vídeoaulas completas.</li>
                  <li>Estimular a resolução de problemas lógicos curtos em casa para ganho de ritmo.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[var(--color-cinza-borda)] text-right">
            <span className="text-[10px] text-[var(--color-cinza-texto)] italic">
              Elaborado de acordo com os lançamentos de aula mais recentes.
            </span>
          </div>
        </div>

        {/* Print Preview Panel */}
        <div className="lg:col-span-2 card bg-[var(--color-cinza-fundo)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[var(--color-azul-autoridade)] m-0">Prévia do Boletim</h3>
            <span className="badge badge-success text-[10px]">Pronto para Impressão</span>
          </div>
          <div className="bg-white border border-[var(--color-cinza-borda)] rounded-xl p-5 shadow-inner h-[440px] overflow-y-auto relative text-[9px] leading-relaxed">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[var(--color-azul-autoridade)]" />
            
            <div className="text-center mt-2 mb-4 border-b pb-3">
              <h4 className="font-extrabold text-xs text-[var(--color-azul-autoridade)] tracking-wide">NOTA 10 EDUCACIONAL</h4>
              <p className="text-[9px] text-[var(--color-cinza-texto)] font-bold uppercase tracking-wider">Relatório Pedagógico Individualizado</p>
            </div>

            <div className="space-y-1 mb-4 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
              <p><strong>ALUNO(A):</strong> {studentName}</p>
              <p><strong>MATRÍCULA:</strong> {studentNum}</p>
              <p><strong>TURMA:</strong> {studentClass}</p>
              <p><strong>NÍVEL:</strong> {isPreCMT ? 'Pré-CMT 5º Ano' : 'Acompanhamento'}</p>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-green-50 p-1.5 rounded text-center border border-green-100">
                <p className="text-[8px] font-bold text-green-700">PRESENÇA</p>
                <p className="text-xs font-black text-green-700">90%</p>
              </div>
              <div className="bg-blue-50 p-1.5 rounded text-center border border-blue-100">
                <p className="text-[8px] font-bold text-blue-700">FIXAÇÃO</p>
                <p className="text-xs font-black text-blue-700">82%</p>
              </div>
              <div className="bg-purple-50 p-1.5 rounded text-center border border-purple-100">
                <p className="text-[8px] font-bold text-purple-700">ENGAJAMENTO</p>
                <p className="text-xs font-black text-purple-700">Bom</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="font-bold border-b pb-0.5 text-gray-700 mb-1">PARECER PEDAGÓGICO</p>
              <p className="text-gray-600 text-[8px] italic leading-snug">
                "O aluno demonstra excelente dedicação, apresentando ótima retenção dos conteúdos em classe e facilidade em tarefas colaborativas. Como ponto de melhoria, orientamos a supervisão na visualização completa de vídeoaulas prévias e a prática contínua de exercícios lógicos curtos."
              </p>
            </div>

            <div className="border-t pt-4 mt-6 flex justify-between items-center text-[7px] text-gray-400">
              <p>Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
              <p className="font-semibold text-[8px] text-[var(--color-azul-autoridade)]">Nota 10 Educacional</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
