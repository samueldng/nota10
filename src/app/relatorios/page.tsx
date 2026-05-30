'use client';

import { useState } from 'react';
import {
  Search,
  FileText,
  Edit3,
  Star,
  AlertTriangle,
  Lightbulb,
  UserCheck,
  XCircle,
  Clock,
  PlayCircle,
  Target,
  Info,
  TrendingUp,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const atencaoData = [
  { date: '01/04', aluno: 65, turma: 55 },
  { date: '15/04', aluno: 70, turma: 58 },
  { date: '29/04', aluno: 72, turma: 60 },
  { date: '13/05', aluno: 78, turma: 62 },
  { date: '27/05', aluno: 85, turma: 63 },
];

const participacaoData = [
  { date: '01/04', aluno: 60, turma: 55 },
  { date: '15/04', aluno: 68, turma: 57 },
  { date: '29/04', aluno: 65, turma: 58 },
  { date: '13/05', aluno: 75, turma: 60 },
  { date: '27/05', aluno: 80, turma: 61 },
];

const comportamentoData = [
  { date: '01/04', aluno: 70, turma: 65 },
  { date: '15/04', aluno: 75, turma: 66 },
  { date: '29/04', aluno: 80, turma: 68 },
  { date: '13/05', aluno: 82, turma: 70 },
  { date: '27/05', aluno: 88, turma: 71 },
];

const statCards = [
  { label: 'Presenças', value: '36', subtitle: '90,0% do período', icon: <UserCheck size={22} />, color: '#22C55E', bg: '#dcfce7' },
  { label: 'Faltas', value: '4', subtitle: '10,0% do período', icon: <XCircle size={22} />, color: '#EF4444', bg: '#fee2e2' },
  { label: 'Atrasos', value: '2', subtitle: '5,0% do período', icon: <Clock size={22} />, color: '#F59E0B', bg: '#fef3c7' },
  { label: 'Vídeo-aula', value: '28', subtitle: '85,0% assistidas', icon: <PlayCircle size={22} />, color: '#8B5CF6', bg: '#ede9fe' },
  { label: 'Fixação', value: '82%', subtitle: 'Média de acertos', icon: <Target size={22} />, color: '#22C55E', bg: '#dcfce7' },
];

function ChartCard({ title, data }: { title: string; data: typeof atencaoData }) {
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
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} />
          <Tooltip
            contentStyle={{
              background: 'white',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend
            iconType="line"
            wrapperStyle={{ fontSize: '11px' }}
          />
          <Line
            type="monotone"
            dataKey="turma"
            stroke="#94A3B8"
            strokeDasharray="5 5"
            strokeWidth={2}
            dot={false}
            name="Média da turma"
          />
          <Line
            type="monotone"
            dataKey="aluno"
            stroke="#1A3A6B"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#1A3A6B' }}
            name="Aluno"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function RelatoriosPage() {
  const [showParecerEdit, setShowParecerEdit] = useState(false);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <p className="text-[var(--color-cinza-texto)]">
          Acompanhe o desempenho e o desenvolvimento do aluno.
        </p>
      </div>

      {/* Filters */}
      <div className="card animate-fade-in-up delay-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <div className="form-group">
            <label className="form-label">Produto</label>
            <select className="form-select">
              <option>Pré-CMT 5°</option>
              <option>Projeto 4°</option>
              <option>Reforço</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Turma</label>
            <select className="form-select">
              <option>5A Manhã</option>
              <option>5B Tarde</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Aluno</label>
            <div className="relative">
              <input className="form-input pr-8" defaultValue="Maria Eduarda Silva" />
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-cinza-texto)]" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Período</label>
            <input type="text" className="form-input" defaultValue="01/04/2024 - 31/05/2024" />
          </div>
          <div className="form-group">
            <label className="form-label">Bloco (opcional)</label>
            <select className="form-select">
              <option>Todos</option>
              <option>Bloco 1</option>
              <option>Bloco 2</option>
            </select>
          </div>
          <button className="btn btn-primary h-[42px]">
            <TrendingUp size={16} />
            Gerar relatório
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 animate-fade-in-up delay-2">
        {statCards.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div
              className="stat-icon"
              style={{ background: stat.bg, color: stat.color }}
            >
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-extrabold leading-none" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-xs font-bold text-[var(--color-azul-autoridade)] mt-0.5">
                {stat.label}
              </p>
              <p className="text-[10px] text-[var(--color-cinza-texto)] flex items-center gap-1">
                {stat.subtitle}
                <Info size={10} />
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up delay-3">
        <ChartCard title="Atenção" data={atencaoData} />
        <ChartCard title="Participação" data={participacaoData} />
        <ChartCard title="Comportamento" data={comportamentoData} />
      </div>

      {/* Parecer + PDF Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in-up delay-4">
        {/* Parecer */}
        <div className="lg:col-span-3 card">
          <h3 className="text-base font-bold text-[var(--color-azul-autoridade)] mb-4">
            Prévia do parecer pedagógico
          </h3>

          <div className="space-y-5">
            {/* Pontos Fortes */}
            <div className="parecer-section">
              <div className="flex items-center gap-2 mb-3">
                <Star size={18} className="text-[var(--color-amarelo-conquista)]" fill="currentColor" />
                <h4 className="text-sm font-bold text-[var(--color-amarelo-conquista)] m-0">Pontos fortes</h4>
              </div>
              <ul className="space-y-1.5 text-sm text-[var(--color-cinza-escuro)] pl-7">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-amarelo-conquista)] mt-1.5 flex-shrink-0" />
                  Demonstra grande dedicação às atividades e nos estudos.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-amarelo-conquista)] mt-1.5 flex-shrink-0" />
                  Apresenta excelente compreensão dos conteúdos trabalhados.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-amarelo-conquista)] mt-1.5 flex-shrink-0" />
                  Participa ativamente das aulas e contribui nas discussões.
                </li>
              </ul>
            </div>

            {/* Pontos a Melhorar */}
            <div className="parecer-section">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={18} className="text-[var(--color-vermelho-erro)]" />
                <h4 className="text-sm font-bold text-[var(--color-vermelho-erro)] m-0">Pontos a melhorar</h4>
              </div>
              <ul className="space-y-1.5 text-sm text-[var(--color-cinza-escuro)] pl-7">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-vermelho-erro)] mt-1.5 flex-shrink-0" />
                  Pode aprimorar a gestão do tempo nas atividades de casa.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-vermelho-erro)] mt-1.5 flex-shrink-0" />
                  Revisar conteúdos básicos para fortalecer a base em exatas.
                </li>
              </ul>
            </div>

            {/* Orientação Prática */}
            <div className="parecer-section">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={18} className="text-[var(--color-azul-info)]" />
                <h4 className="text-sm font-bold text-[var(--color-azul-info)] m-0">Orientação prática</h4>
              </div>
              <ul className="space-y-1.5 text-sm text-[var(--color-cinza-escuro)] pl-7">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-azul-info)] mt-1.5 flex-shrink-0" />
                  Estabelecer um cronograma semanal de estudos com metas claras.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-azul-info)] mt-1.5 flex-shrink-0" />
                  Resolver questões de provas anteriores para fixação dos conteúdos.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-azul-info)] mt-1.5 flex-shrink-0" />
                  Buscar apoio nas monitorias para esclarecer dúvidas específicas.
                </li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-[var(--color-cinza-borda)]">
            <button className="btn btn-outline flex-1" onClick={() => setShowParecerEdit(!showParecerEdit)}>
              <Edit3 size={16} />
              Editar texto
            </button>
            <button className="btn btn-primary flex-1">
              <FileText size={16} />
              Gerar PDF
            </button>
          </div>
        </div>

        {/* PDF Preview */}
        <div className="lg:col-span-2 card">
          <h3 className="text-base font-bold text-[var(--color-azul-autoridade)] mb-4">
            Prévia do PDF
          </h3>

          <div className="bg-white border-2 border-[var(--color-cinza-borda)] rounded-lg p-4 shadow-inner">
            {/* Mini PDF */}
            <div className="space-y-3">
              {/* PDF Header */}
              <div className="bg-[var(--color-azul-autoridade)] text-white rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={12} className="text-[var(--color-amarelo-conquista)]" fill="currentColor" />
                  <span className="font-bold text-xs">Nota 10</span>
                  <span className="text-[8px] text-white/70">Educacional</span>
                </div>
                <span className="font-bold text-xs">RELATÓRIO DO ALUNO</span>
              </div>

              {/* Student info */}
              <div className="text-[10px] space-y-0.5 text-[var(--color-cinza-escuro)]">
                <p><span className="font-bold">Aluno:</span> Maria Eduarda Silva</p>
                <p><span className="font-bold">Turma:</span> 3ª Série A</p>
                <p><span className="font-bold">Período:</span> 01/04/2024 a 31/05/2024</p>
              </div>

              {/* Summary */}
              <div>
                <p className="text-[9px] font-bold text-[var(--color-azul-autoridade)] uppercase mb-1">Resumo</p>
                <div className="flex gap-1.5">
                  {[
                    { val: '36', label: 'Pres.', color: '#22C55E' },
                    { val: '4', label: 'Falt.', color: '#EF4444' },
                    { val: '2', label: 'Atr.', color: '#F59E0B' },
                    { val: '28', label: 'Víd.', color: '#8B5CF6' },
                    { val: '82%', label: 'Fix.', color: '#22C55E' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-1 bg-[var(--color-cinza-fundo)] rounded px-1.5 py-0.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                      <span className="text-[9px] font-bold">{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mini charts */}
              <div>
                <p className="text-[9px] font-bold text-[var(--color-azul-autoridade)] uppercase mb-1">Desempenho</p>
                <div className="grid grid-cols-3 gap-1">
                  {['Atenção', 'Participação', 'Comportamento'].map((label) => (
                    <div key={label} className="bg-[var(--color-cinza-fundo)] rounded p-1.5">
                      <p className="text-[7px] font-bold text-[var(--color-azul-autoridade)] text-center">{label}</p>
                      <div className="h-6 flex items-end justify-center gap-0.5">
                        {[40, 55, 60, 70, 85].map((h, i) => (
                          <div
                            key={i}
                            className="w-2 rounded-t"
                            style={{ height: `${h}%`, background: '#1A3A6B', opacity: 0.3 + (i * 0.15) }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Parecer */}
              <div>
                <p className="text-[9px] font-bold text-[var(--color-azul-autoridade)] uppercase mb-1">Parecer Pedagógico</p>
                <div className="space-y-1">
                  <div className="flex items-start gap-1">
                    <Star size={8} className="text-[var(--color-amarelo-conquista)] mt-0.5 flex-shrink-0" fill="currentColor" />
                    <div className="text-[7px] text-[var(--color-cinza-escuro)]">
                      <span className="font-bold">Pontos fortes</span>
                      <p className="m-0">Demonstra grande dedicação...</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-1">
                    <AlertTriangle size={8} className="text-[var(--color-vermelho-erro)] mt-0.5 flex-shrink-0" />
                    <div className="text-[7px] text-[var(--color-cinza-escuro)]">
                      <span className="font-bold">Pontos a melhorar</span>
                      <p className="m-0">Pode aprimorar gestão do tempo...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button className="btn btn-outline w-full mt-4">
            <FileText size={16} />
            Abrir PDF ↗
          </button>
        </div>
      </div>
    </div>
  );
}
