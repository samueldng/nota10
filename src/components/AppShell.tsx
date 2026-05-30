'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { usePathname } from 'next/navigation';

const pageTitles: Record<string, string> = {
  '/': 'Home',
  '/lancar': 'Lançar Registro',
  '/gerar-folhas': 'Gerar Folhas',
  '/cadastros/turmas': 'Cadastros › Turmas',
  '/cadastros/alunos': 'Cadastros › Alunos',
  '/cadastros/responsaveis': 'Cadastros › Responsáveis',
  '/registros': 'Registros › Base de Dados',
  '/registros/log': 'Registros › Log de Alterações',
  '/relatorios': 'Relatórios do Aluno',
  '/relatorios/turma': 'Relatórios › Por Turma',
  '/configuracoes': 'Configurações',
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const title = pageTitles[pathname] || 'Nota 10 Educacional';

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content flex-1 flex flex-col" style={{ marginLeft: '256px' }}>
        <TopBar
          title={title}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
