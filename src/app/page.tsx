'use client';

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
} from 'lucide-react';
import Link from 'next/link';
import {
  getFraseMotivacional,
  registrosLancados,
  acompanhamentoLabels,
  type Acompanhamento,
} from '@/lib/mockData';

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

const stats = [
  { label: 'Registros lançados', value: '12', icon: <ClipboardList size={20} />, color: 'var(--color-azul-autoridade)', bg: 'var(--color-azul-lightest)' },
  { label: 'Turmas ativas', value: '6', icon: <Users size={20} />, color: 'var(--color-amarelo-conquista)', bg: 'var(--color-amarelo-light)' },
  { label: 'Folhas geradas', value: '4', icon: <BookOpen size={20} />, color: '#8B5CF6', bg: 'var(--color-roxo-light)' },
  { label: 'Presença média', value: '92%', icon: <TrendingUp size={20} />, color: '#22C55E', bg: 'var(--color-verde-light)' },
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
  const frase = getFraseMotivacional();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Greeting + Motivational Quote */}
      <div className="animate-fade-in-up">
        <h2 className="text-2xl font-bold text-[var(--color-azul-autoridade)] mb-1">
          Olá, Professor(a) João! 👋
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
            {stats.map((stat) => (
              <div key={stat.label} className="stat-card">
                <div
                  className="stat-icon"
                  style={{ background: stat.bg, color: stat.color }}
                >
                  {stat.icon}
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-[var(--color-azul-autoridade)] leading-none">
                    {stat.value}
                  </p>
                  <p className="text-xs text-[var(--color-cinza-texto)] mt-1">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
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
              {registrosLancados.slice(0, 6).map((record) => (
                <tr key={record.id}>
                  <td className="font-medium">{record.id}</td>
                  <td className="text-sm whitespace-nowrap">{record.data}</td>
                  <td>
                    <span className={`badge text-xs ${
                      record.acompanhamento === 'pre_cmt_5' ? 'badge-info' :
                      record.acompanhamento === 'projeto_4' ? 'badge-warning' :
                      'badge-success'
                    }`}>
                      {acompanhamentoLabels[record.acompanhamento as Acompanhamento]}
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
        </div>
      </div>
    </div>
  );
}
