'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FileEdit,
  FileText,
  Users,
  Database,
  BarChart3,
  Settings,
  ChevronDown,
  Star,
  GraduationCap,
  UserCheck,
  BookOpen,
  ClipboardList,
  History,
  UserCircle,
  TrendingUp,
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
  { label: 'Gerar Folhas', href: '/gerar-folhas', icon: <FileText size={20} /> },
  {
    label: 'Cadastros',
    href: '/cadastros',
    icon: <Users size={20} />,
    subItems: [
      { label: 'Turmas', href: '/cadastros/turmas', icon: <GraduationCap size={16} /> },
      { label: 'Alunos', href: '/cadastros/alunos', icon: <UserCheck size={16} /> },
      { label: 'Responsáveis', href: '/cadastros/responsaveis', icon: <UserCircle size={16} /> },
    ],
  },
  {
    label: 'Registros',
    href: '/registros',
    icon: <Database size={20} />,
    subItems: [
      { label: 'Base de Dados', href: '/registros', icon: <ClipboardList size={16} /> },
      { label: 'Log de Alterações', href: '/registros/log', icon: <History size={16} /> },
    ],
  },
  {
    label: 'Relatórios',
    href: '/relatorios',
    icon: <BarChart3 size={20} />,
    subItems: [
      { label: 'Por Aluno', href: '/relatorios', icon: <TrendingUp size={16} /> },
      { label: 'Por Turma', href: '/relatorios/turma', icon: <BookOpen size={16} /> },
    ],
  },
  {
    label: 'Configurações',
    href: '/configuracoes',
    icon: <Settings size={20} />,
    subItems: [
      { label: 'Usuários', href: '/configuracoes/usuarios', icon: <Users size={16} /> },
      { label: 'Sistema', href: '/configuracoes/sistema', icon: <Settings size={16} /> },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
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
          <Link href="/" className="flex items-center gap-2 no-underline" onClick={onClose}>
            <div className="flex items-center">
              <span className="text-white font-extrabold text-2xl tracking-tight">Nota</span>
              <span className="relative">
                <span className="text-[var(--color-amarelo-conquista)] font-extrabold text-3xl leading-none">10</span>
                <Star
                  size={10}
                  className="absolute -top-1 -right-2 text-[var(--color-amarelo-conquista)]"
                  fill="currentColor"
                />
              </span>
            </div>
            <div className="ml-1">
              <span className="text-white/80 text-xs font-medium block leading-tight">Educacional</span>
            </div>
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

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="flex items-start gap-2">
            <Star size={16} className="text-[var(--color-amarelo-conquista)] mt-0.5 flex-shrink-0" fill="currentColor" />
            <div>
              <p className="text-white/90 text-xs font-medium leading-tight">Gestão escolar</p>
              <p className="text-white/50 text-xs leading-tight">simples, precisa e eficiente.</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
