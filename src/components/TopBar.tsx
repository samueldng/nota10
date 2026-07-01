'use client';

import { useState } from 'react';
import { Menu, HelpCircle, User, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface TopBarProps {
  title: string;
  onMenuToggle: () => void;
  userRole?: string;
}

export default function TopBar({ title, onMenuToggle, userRole }: TopBarProps) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const displayRole = userRole || (user?.role === 'admin' ? 'Admin / Professor' : 'Pais e Alunos');

  return (
    <header className="topbar">
      <div className="flex items-center gap-4">
        {/* Toggle button - visible on mobile layouts */}
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

        {/* Profile Dropdown */}
        <div className="relative">
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-3 border-l border-[var(--color-cinza-borda)] cursor-pointer hover:bg-[var(--color-cinza-fundo)] rounded-lg p-2 transition-colors select-none"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--color-azul-lightest)] flex items-center justify-center">
              <User size={18} className="text-[var(--color-azul-autoridade)]" />
            </div>
            <div className="flex flex-col items-start leading-none hidden sm:flex">
              <span className="text-xs font-bold text-[var(--color-cinza-escuro)]">
                {user?.name || 'Usuário'}
              </span>
              <span className="text-[10px] text-[var(--color-cinza-texto)] mt-0.5">
                {displayRole}
              </span>
            </div>
            <ChevronDown size={14} className="text-[var(--color-cinza-texto)]" />
          </div>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <>
              {/* Invisible clickaway handler */}
              <div
                className="fixed inset-0 z-30 cursor-default"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-[var(--color-cinza-borda)] py-1 z-40 animate-fade-in">
                <div className="px-4 py-2 border-b border-[var(--color-cinza-borda)] sm:hidden">
                  <p className="text-xs font-bold text-[var(--color-cinza-escuro)] truncate">
                    {user?.name}
                  </p>
                  <p className="text-[9px] text-[var(--color-cinza-texto)] mt-0.5 truncate">
                    {displayRole}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-[var(--color-vermelho-erro)] hover:bg-[var(--color-vermelho-light)] transition-colors flex items-center gap-2 font-bold cursor-pointer"
                >
                  <LogOut size={16} />
                  Sair da Conta
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
