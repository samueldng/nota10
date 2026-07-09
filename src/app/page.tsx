'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  FileEdit,
  FileText,
  BarChart3,
  Database,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  Camera,
  FileWarning,
  ClipboardList,
  Users,
  BookOpen,
  Eye,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { getFraseMotivacional } from '@/lib/mockData';

const quickActions = [
  {
    label: 'Lançar Registro',
    description: 'Registrar acompanhamento dos alunos',
    icon: <FileEdit size={28} />,
    href: '/lancar',
    color: 'var(--color-azul-autoridade)',
    bg: 'var(--color-azul-lightest)',
  },
  {
    label: 'Folhas de Acompanhamento',
    description: 'Imprimir folhas com QR Code',
    icon: <FileText size={28} />,
    href: '/folhas',
    color: 'var(--color-amarelo-conquista)',
    bg: 'var(--color-amarelo-light)',
  },
  {
    label: 'Abrir Histórico',
    description: 'Consultar e revisar registros',
    icon: <Database size={28} />,
    href: '/historico',
    color: '#8B5CF6',
    bg: 'var(--color-roxo-light)',
  },
  {
    label: 'Gerar Relatório',
    description: 'Dashboards e pareceres com IA',
    icon: <BarChart3 size={28} />,
    href: '/relatorios',
    color: '#22C55E',
    bg: 'var(--color-verde-light)',
  },
];

const pendencias = [
  { label: 'Registros aguardando conferência', count: 1, icon: <AlertCircle size={16} />, color: 'var(--color-amarelo-alerta)', href: '/historico' },
  { label: 'Fotos não revisadas', count: 0, icon: <Camera size={16} />, color: 'var(--color-cinza-texto)', href: '/lancar' },
  { label: 'Folhas geradas não lançadas', count: 2, icon: <FileWarning size={16} />, color: 'var(--color-vermelho-erro)', href: '/folhas' },
  { label: 'Relatórios aguardando revisão', count: 0, icon: <ClipboardList size={16} />, color: 'var(--color-cinza-texto)', href: '/relatorios' },
];

const acompanhamentosHoje = [
  { acompanhamento: 'Pré-CMT 5º Ano', turma: '5A Manhã', disciplina: 'Português', bloco: 'Bloco 3', horario: '08:00', status: 'pendente' as const },
  { acompanhamento: 'Projeto 4º Ano', turma: '4A Manhã', disciplina: 'Matemática', bloco: 'Bloco 1', horario: '10:00', status: 'concluido' as const },
];

const acompanhamentoLabels: Record<string, string> = {
  pre_cmt_5: 'Pré-CMT 5º',
  projeto_4: 'Projeto 4º',
  reforco: 'Reforço',
};

function statusBadge(status: string) {
  switch (status) {
    case 'salvo':
      return <span className="badge badge-success"><CheckCircle2 size={12} /> Salvo</span>;
    case 'pendente':
      return <span className="badge badge-warning"><Clock size={12} /> Pendente</span>;
    case 'revisado':
      return <span className="badge badge-info"><Eye size={12} /> Revisado</span>;
    default:
      return <span className="badge">{status}</span>;
  }
}

export default function HomePage() {
  const { user } = useAuth();
  const frase = getFraseMotivacional();
  
  const [statsData, setStatsData] = useState<any>(null);
  const [registros, setRegistros] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, regRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/registros')
        ]);
        
        if (statsRes.ok) setStatsData(await statsRes.json());
        if (regRes.ok) {
          const allRegs = await regRes.json();
          setRegistros(allRegs.slice(0, 6)); // Últimos 6 lançamentos
        }
      } catch (err) {
        console.error('Erro ao carregar dashboard', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const renderStats = () => {
    if (isLoading) {
      return Array(4).fill(0).map((_, i) => (
        <div key={i} className="stat-card animate-pulse">
          <div className="w-12 h-12 bg-[var(--color-cinza-fundo)] rounded-xl"></div>
          <div className="flex flex-col gap-2 flex-1">
            <div className="h-6 bg-[var(--color-cinza-fundo)] rounded w-16"></div>
            <div className="h-3 bg-[var(--color-cinza-fundo)] rounded w-24"></div>
          </div>
        </div>
      ));
    }

    const s = [
      { label: 'Registros lançados', value: statsData?.registrosLancados || 0, icon: <ClipboardList size={20} />, color: 'var(--color-azul-autoridade)', bg: 'var(--color-azul-lightest)' },
      { label: 'Turmas ativas', value: statsData?.turmasAtivas || 0, icon: <Users size={20} />, color: 'var(--color-amarelo-conquista)', bg: 'var(--color-amarelo-light)' },
      { label: 'Folhas geradas', value: '4', icon: <BookOpen size={20} />, color: '#8B5CF6', bg: 'var(--color-roxo-light)' }, // Mantém fixo por enquanto, se não tem DB
      { label: 'Presença média', value: `${statsData?.presencaMedia || 0}%`, icon: <TrendingUp size={20} />, color: '#22C55E', bg: 'var(--color-verde-light)' },
    ];

    return s.map((stat) => (
      <div key={stat.label} className="stat-card">
        <div className="stat-icon" style={{ background: stat.bg, color: stat.color }}>
          {stat.icon}
        </div>
        <div>
          <p className="text-2xl font-extrabold text-[var(--color-azul-autoridade)] leading-none">
            {stat.value}
          </p>
          <p className="text-xs text-[var(--color-cinza-texto)] mt-1">{stat.label}</p>
        </div>
      </div>
    ));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Greeting + Motivational Quote */}
      <div className="animate-fade-in-up">
        <h2 className="text-2xl font-bold text-[var(--color-azul-autoridade)] mb-1">
          Olá, {user?.name || 'Professor(a)'}! 👋
        </h2>
        <p className="text-[var(--color-cinza-texto)] text-sm italic flex items-center gap-1.5">
          <span className="text-[var(--color-amarelo-conquista)]">✦</span>
          {frase}
        </p>
      </div>

      {/* Acompanhamentos de Hoje */}
      <div className="card animate-fade-in-up delay-1">
        <h3 className="text-base font-bold text-[var(--color-azul-autoridade)] mb-3 flex items-center gap-2">
          <BookOpen size={18} />
          Acompanhamentos de hoje
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {acompanhamentosHoje.map((item, i) => (
            <div
              key={i}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                item.status === 'concluido'
                  ? 'border-[var(--color-verde-sucesso)] bg-[var(--color-verde-light)]'
                  : 'border-[var(--color-amarelo-alerta)] bg-[var(--color-amarelo-alerta-light)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold ${
                  item.status === 'concluido' ? 'bg-[var(--color-verde-sucesso)]' : 'bg-[var(--color-amarelo-alerta)]'
                }`}>
                  {item.horario.split(':')[0]}h
                </div>
                <div>
                  <p className="font-semibold text-sm text-[var(--color-azul-autoridade)]">
                    {item.acompanhamento} — {item.turma}
                  </p>
                  <p className="text-xs text-[var(--color-cinza-texto)]">
                    {item.disciplina} • {item.bloco}
                  </p>
                </div>
              </div>
              {item.status === 'concluido' ? (
                <span className="badge badge-success"><CheckCircle2 size={12} /> Lançado</span>
              ) : (
                <Link href="/lancar" className="btn btn-primary text-xs py-2 px-3 no-underline">
                  Lançar <ArrowRight size={12} />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up delay-2">
        {quickActions.map((action) => (
          <Link key={action.label} href={action.href} className="no-underline">
            <div className="card card-selectable flex flex-col items-center text-center py-6 gap-3 group">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: action.bg, color: action.color }}
              >
                {action.icon}
              </div>
              <div>
                <h3 className="font-bold text-[var(--color-azul-autoridade)] text-sm mb-0.5">
                  {action.label}
                </h3>
                <p className="text-[10px] text-[var(--color-cinza-texto)] leading-tight">
                  {action.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pendências + Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in-up delay-3">
        {/* Pendências */}
        <div className="lg:col-span-2 card">
          <h3 className="text-base font-bold text-[var(--color-azul-autoridade)] mb-4 flex items-center gap-2">
            <AlertCircle size={18} />
            Pendências
          </h3>
          <div className="space-y-3">
            {pendencias.map((p, i) => (
              <Link key={i} href={p.href} className="no-underline">
                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--color-cinza-fundo)] transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0" style={{ color: p.count > 0 ? p.color : 'var(--color-cinza-texto)' }}>
                      {p.icon}
                    </div>
                    <span className={`text-sm ${p.count > 0 ? 'font-medium text-[var(--color-cinza-escuro)]' : 'text-[var(--color-cinza-texto)]'}`}>
                      {p.label}
                    </span>
                  </div>
                  <span className={`text-lg font-extrabold ${
                    p.count > 0 ? 'text-[var(--color-vermelho-erro)]' : 'text-[var(--color-verde-sucesso)]'
                  }`}>
                    {p.count}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="lg:col-span-3 card">
          <h3 className="text-base font-bold text-[var(--color-azul-autoridade)] mb-4 flex items-center gap-2">
            <BarChart3 size={18} />
            Resumo da Semana
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {renderStats()}
          </div>
        </div>
      </div>

      {/* Recent Records */}
      <div className="card animate-fade-in-up delay-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[var(--color-azul-autoridade)] flex items-center gap-2">
            <Clock size={18} />
            Últimos Lançamentos
          </h3>
          <Link href="/historico" className="text-sm text-[var(--color-azul-info)] font-medium hover:underline">
            Ver todos →
          </Link>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[var(--color-azul-autoridade)]" size={32} /></div>
          ) : registros.length === 0 ? (
            <div className="text-center p-6 text-[var(--color-cinza-texto)] text-sm">
              Nenhum registro encontrado.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Data</th>
                  <th>Acompanhamento</th>
                  <th>Turma / Aluno</th>
                  <th>Disciplina</th>
                  <th>Professor</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((record) => (
                  <tr key={record.id}>
                    <td className="font-medium">{record.id}</td>
                    <td className="text-sm whitespace-nowrap">{new Date(record.data).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <span className={`badge text-xs ${
                        record.acompanhamento === 'pre_cmt_5' ? 'badge-info' :
                        record.acompanhamento === 'projeto_4' ? 'badge-warning' :
                        'badge-success'
                      }`}>
                        {acompanhamentoLabels[record.acompanhamento] || record.acompanhamento}
                      </span>
                    </td>
                    <td className="font-medium text-sm">{record.aluno === 'Turma inteira' ? record.turma : record.aluno}</td>
                    <td className="text-sm">{record.disciplina}</td>
                    <td className="text-xs text-[var(--color-cinza-texto)]">{record.professor}</td>
                    <td>{statusBadge(record.status)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Link href="/historico" className="p-1.5 rounded-lg hover:bg-[var(--color-azul-lightest)] transition-colors">
                          <Eye size={14} className="text-[var(--color-azul-autoridade)]" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

