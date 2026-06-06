'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { usePathname } from 'next/navigation';

const pageTitles: Record<string, string> = {
  '/': 'Home',
  '/lancar': 'Lançar Registro',
  '/folhas': 'Folhas de Acompanhamento',
  '/cadastros/alunos': 'Cadastros › Alunos',
  '/cadastros/turmas': 'Cadastros › Turmas',
  '/cadastros/professores': 'Cadastros › Professores',
  '/cadastros/acompanhamentos': 'Cadastros › Acompanhamentos',
  '/historico': 'Histórico',
  '/relatorios': 'Relatórios do Aluno',
  '/ranking': 'Ranking',
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Match dynamic routes like /cadastros/alunos/[id]
  let title = pageTitles[pathname];
  if (!title) {
    if (pathname.startsWith('/cadastros/alunos/')) title = 'Cadastros › Página do Aluno';
    else title = 'Nota 10 Educacional';
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content flex-1 flex flex-col lg:ml-[256px] transition-all duration-300 w-full">
        <TopBar
          title={title}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
