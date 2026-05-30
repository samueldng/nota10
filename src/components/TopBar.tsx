'use client';

import { Menu, HelpCircle, User, ChevronDown } from 'lucide-react';

interface TopBarProps {
  title: string;
  onMenuToggle: () => void;
  userRole?: 'Professor(a)' | 'Coordenação' | 'Admin';
}

export default function TopBar({ title, onMenuToggle, userRole = 'Professor(a)' }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-[var(--color-cinza-fundo)] transition-colors"
          aria-label="Abrir menu"
        >
          <Menu size={22} className="text-[var(--color-azul-autoridade)]" />
        </button>
        <h1 className="text-lg font-bold text-[var(--color-azul-autoridade)] m-0">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="p-2 rounded-full hover:bg-[var(--color-cinza-fundo)] transition-colors"
          aria-label="Ajuda"
        >
          <HelpCircle size={20} className="text-[var(--color-cinza-texto)]" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-[var(--color-cinza-borda)] cursor-pointer hover:bg-[var(--color-cinza-fundo)] rounded-lg p-2 transition-colors">
          <div className="w-8 h-8 rounded-full bg-[var(--color-cinza-fundo)] flex items-center justify-center">
            <User size={18} className="text-[var(--color-cinza-texto)]" />
          </div>
          <span className="text-sm font-medium text-[var(--color-cinza-escuro)] hidden sm:inline">
            {userRole}
          </span>
          <ChevronDown size={14} className="text-[var(--color-cinza-texto)]" />
        </div>
      </div>
    </header>
  );
}
