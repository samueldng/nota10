'use client';

import {
  FileEdit,
  FileText,
  BarChart3,
  ClipboardList,
  Users,
  BookOpen,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

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
    label: 'Gerar Folhas',
    description: 'Imprimir folhas com QR Code',
    icon: <FileText size={28} />,
    href: '/gerar-folhas',
    color: 'var(--color-amarelo-conquista)',
    bg: 'var(--color-amarelo-light)',
  },
  {
    label: 'Relatórios',
    description: 'Dashboards e pareceres com IA',
    icon: <BarChart3 size={28} />,
    href: '/relatorios',
    color: '#22C55E',
    bg: 'var(--color-verde-light)',
  },
];

const stats = [
  { label: 'Registros lançados', value: '12', icon: <ClipboardList size={20} />, color: 'var(--color-azul-autoridade)', bg: 'var(--color-azul-lightest)' },
  { label: 'Turmas ativas', value: '8', icon: <Users size={20} />, color: 'var(--color-amarelo-conquista)', bg: 'var(--color-amarelo-light)' },
  { label: 'Folhas geradas', value: '3', icon: <BookOpen size={20} />, color: '#8B5CF6', bg: 'var(--color-roxo-light)' },
  { label: 'Presença média', value: '95%', icon: <TrendingUp size={20} />, color: '#22C55E', bg: 'var(--color-verde-light)' },
];

const recentRecords = [
  { id: 1, produto: 'Pré-CMT 5°', turma: '5A Manhã', data: '28/05/2026', disciplina: 'Português', status: 'salvo' },
  { id: 2, produto: 'Projeto 4°', turma: '4B Tarde', data: '27/05/2026', disciplina: 'Matemática', status: 'salvo' },
  { id: 3, produto: 'Reforço', turma: '—', data: '26/05/2026', disciplina: 'Todas', status: 'pendente' },
  { id: 4, produto: 'Pré-CMT 5°', turma: '5B Tarde', data: '26/05/2026', disciplina: 'Matemática', status: 'salvo' },
  { id: 5, produto: 'Projeto 4°', turma: '4A Manhã', data: '25/05/2026', disciplina: 'Português', status: 'salvo' },
];

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Greeting */}
      <div className="animate-fade-in-up">
        <h2 className="text-2xl font-bold text-[var(--color-azul-autoridade)] mb-1">
          Bom dia, Professor João! 👋
        </h2>
        <p className="text-[var(--color-cinza-texto)]">
          Confira seus lançamentos e atividades recentes.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up delay-1">
        {quickActions.map((action) => (
          <Link key={action.label} href={action.href} className="no-underline">
            <div className="card card-selectable flex flex-col items-center text-center py-8 gap-3 group">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: action.bg, color: action.color }}
              >
                {action.icon}
              </div>
              <div>
                <h3 className="font-bold text-[var(--color-azul-autoridade)] text-base mb-1">
                  {action.label}
                </h3>
                <p className="text-xs text-[var(--color-cinza-texto)]">
                  {action.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="card animate-fade-in-up delay-2">
        <h3 className="text-base font-bold text-[var(--color-azul-autoridade)] mb-4 flex items-center gap-2">
          <BarChart3 size={18} />
          Resumo da Semana
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      {/* Recent Records */}
      <div className="card animate-fade-in-up delay-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[var(--color-azul-autoridade)] flex items-center gap-2">
            <Clock size={18} />
            Últimos Lançamentos
          </h3>
          <Link href="/registros" className="text-sm text-[var(--color-azul-info)] font-medium hover:underline">
            Ver todos →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Produto</th>
                <th>Turma</th>
                <th>Data</th>
                <th>Disciplina</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentRecords.map((record) => (
                <tr key={record.id}>
                  <td className="font-medium">{record.id}</td>
                  <td>
                    <span className="font-medium">{record.produto}</span>
                  </td>
                  <td>{record.turma}</td>
                  <td>{record.data}</td>
                  <td>{record.disciplina}</td>
                  <td>
                    {record.status === 'salvo' ? (
                      <span className="badge badge-success">
                        <CheckCircle2 size={12} />
                        Salvo
                      </span>
                    ) : (
                      <span className="badge badge-warning">
                        <Clock size={12} />
                        Pendente
                      </span>
                    )}
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
