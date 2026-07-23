'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getIniciais, getAvatarColor } from '@/lib/portalData';
import { planoLabels, canAccessFeature } from '@/lib/mockData';
import type { PlanoAluno } from '@/lib/mockData';
import {
  Home, BookOpen, Map, PlayCircle, FileText, ClipboardList,
  BarChart3, Download, Megaphone, MessageCircle, Star, LogOut,
  Lock, X,
} from 'lucide-react';

interface PortalNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  featureKey?: string; // if set, checks plan access
}

const portalNavItems: PortalNavItem[] = [
  { label: 'Início', href: '/portal', icon: <Home size={20} /> },
  { label: 'Bem-vindos', href: '/portal/bem-vindos', icon: <BookOpen size={20} /> },
  { label: 'Trilha de Estudos', href: '/portal/trilha', icon: <Map size={20} /> },
  { label: 'Videoaulas', href: '/portal/videoaulas', icon: <PlayCircle size={20} /> },
  { label: 'Simulados', href: '/portal/simulados', icon: <FileText size={20} /> },
  { label: 'Acompanhamento', href: '/portal/acompanhamento', icon: <ClipboardList size={20} />, featureKey: 'acompanhamento' },
  { label: 'Materiais', href: '/portal/materiais', icon: <Download size={20} /> },
  { label: 'Comunicados', href: '/portal/comunicados', icon: <Megaphone size={20} /> },
  { label: 'Suporte', href: '/portal/suporte', icon: <MessageCircle size={20} /> },
];

interface PortalSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function PlanoBadge({ plano }: { plano: PlanoAluno }) {
  const config: Record<PlanoAluno, { bg: string; text: string; emoji: string }> = {
    padrao: { bg: 'bg-white/10', text: 'text-white/80', emoji: '📘' },
    acompanhamento: { bg: 'bg-[var(--color-amarelo-conquista)]/20', text: 'text-[var(--color-amarelo-conquista)]', emoji: '⭐' },
    elite: { bg: 'bg-amber-400/20', text: 'text-amber-300', emoji: '👑' },
  };
  const c = config[plano];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold ${c.bg} ${c.text} border border-white/10`}>
      {c.emoji} Plano {planoLabels[plano]}
    </span>
  );
}

export default function PortalSidebar({ isOpen, onClose }: PortalSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const plano = user?.plano || 'padrao';
  const nomeAluno = user?.alunoNome || 'Aluno';
  const turma = user?.turma || '—';
  const matricula = user?.alunoNumero || '—';
  const iniciais = getIniciais(nomeAluno);
  const avatarColor = getAvatarColor(nomeAluno);

  const isActive = (href: string) => {
    if (href === '/portal') return pathname === '/portal';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`} style={{ background: 'linear-gradient(180deg, #1A3A6B 0%, #122B52 100%)' }}>
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors lg:hidden cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Logo */}
        <div className="sidebar-logo">
          <Link href="/portal" className="flex items-center no-underline" onClick={onClose}>
            <img
              src="/logo-nota10.png"
              alt="Nota 10 Educacional"
              className="h-11 w-auto"
              style={{
                filter: 'drop-shadow(1px 0 0 #fff) drop-shadow(-1px 0 0 #fff) drop-shadow(0 1px 0 #fff) drop-shadow(0 -1px 0 #fff) drop-shadow(1px 1px 0 #fff) drop-shadow(-1px -1px 0 #fff)'
              }}
            />
          </Link>
        </div>

        {/* Student Identity Card */}
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0 shadow-md"
              style={{ backgroundColor: avatarColor }}
            >
              {iniciais}
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm truncate leading-tight">{nomeAluno}</p>
              <p className="text-white/50 text-[10px] mt-0.5">
                Turma: {turma} • Nº {matricula}
              </p>
            </div>
          </div>
          <PlanoBadge plano={plano} />
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {portalNavItems.map((item) => {
            const isLocked = item.featureKey ? !canAccessFeature(item.featureKey, plano) : false;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                onClick={onClose}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {isLocked && (
                  <Lock size={12} className="text-white/30" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-1.5">
              <Star size={14} className="text-[var(--color-amarelo-conquista)] mt-0.5 flex-shrink-0" fill="currentColor" />
              <div>
                <p className="text-white/90 text-[10px] font-medium leading-none">Nota 10 Educacional</p>
                <p className="text-white/40 text-[9px] mt-0.5">Portal do Aluno</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
              title="Sair da Conta"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
