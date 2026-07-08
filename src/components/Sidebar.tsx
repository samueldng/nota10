'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Home,
  FileEdit,
  FileText,
  Users,
  Database,
  BarChart3,
  ChevronDown,
  Star,
  GraduationCap,
  UserCheck,
  BookOpen,
  Trophy,
  UserCog,
  LogOut,
  Wifi,
  WifiOff,
  Calendar,
  PlayCircle
} from 'lucide-react';

interface SubItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  subItems?: SubItem[];
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/', icon: <Home size={20} /> },
  { label: 'Lançar Registro', href: '/lancar', icon: <FileEdit size={20} /> },
  { label: 'Folhas de Acompanhamento', href: '/folhas', icon: <FileText size={20} /> },
  {
    label: 'Cadastros',
    href: '/cadastros',
    icon: <Users size={20} />,
    subItems: [
      { label: 'Alunos', href: '/cadastros/alunos', icon: <UserCheck size={16} /> },
      { label: 'Turmas', href: '/cadastros/turmas', icon: <GraduationCap size={16} /> },
      { label: 'Professores', href: '/cadastros/professores', icon: <UserCog size={16} /> },
      { label: 'Acompanhamentos', href: '/cadastros/acompanhamentos', icon: <BookOpen size={16} /> },
      { label: 'Cronograma Semanal', href: '/cadastros/cronograma', icon: <Calendar size={16} /> },
      { label: 'Conteúdo do Portal', href: '/cadastros/conteudo', icon: <PlayCircle size={16} /> },
    ],
  },
  {
    label: 'Histórico',
    href: '/historico',
    icon: <Database size={20} />,
  },
  {
    label: 'Relatórios',
    href: '/relatorios',
    icon: <BarChart3 size={20} />,
  },
  {
    label: 'Ranking',
    href: '/ranking',
    icon: <Trophy size={20} />,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { logout, isDbOnline } = useAuth();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <Link href="/" className="flex items-center no-underline" onClick={onClose}>
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

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <div key={item.label}>
              {item.subItems ? (
                <>
                  <button
                    className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                    onClick={() => toggleMenu(item.label)}
                  >
                    {item.icon}
                    <span className="flex-1">{item.label}</span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${
                        openMenus[item.label] ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <div className={`sidebar-submenu ${openMenus[item.label] ? 'open' : ''}`}>
                    {item.subItems.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={`sidebar-submenu-link ${pathname === sub.href ? 'active' : ''}`}
                        onClick={onClose}
                      >
                        {sub.icon}
                        <span>{sub.label}</span>
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <Link
                  href={item.href}
                  className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                  onClick={onClose}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Footer info & Logout */}
        <div className="sidebar-footer space-y-4">
          {/* Database Connectivity Indicator */}
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-white/90">
            {isDbOnline ? (
              <>
                <Wifi size={12} className="text-[var(--color-verde-sucesso)]" />
                <span className="text-white/90">Banco de dados online</span>
              </>
            ) : (
              <>
                <WifiOff size={12} className="text-[var(--color-amarelo-conquista)]" />
                <span className="text-[var(--color-amarelo-conquista)]">Banco: Modo Demo (Local)</span>
              </>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-3">
            <div className="flex items-start gap-1.5">
              <Star size={14} className="text-[var(--color-amarelo-conquista)] mt-0.5 flex-shrink-0" fill="currentColor" />
              <div>
                <p className="text-white/90 text-[10px] font-medium leading-none">Gestão escolar</p>
                <p className="text-white/40 text-[9px] mt-0.5">simples e precisa</p>
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
