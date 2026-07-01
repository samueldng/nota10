'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import PortalSidebar from '@/components/PortalSidebar';
import TopBar from '@/components/TopBar';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Star } from 'lucide-react';
import { planoLabels } from '@/lib/mockData';

const pageTitles: Record<string, string> = {
  '/': 'Home',
  '/lancar': 'Lançar Registro',
  '/folhas': 'Folhas de Acompanhamento',
  '/cadastros/alunos': 'Cadastros › Alunos',
  '/cadastros/turmas': 'Cadastros › Turmas',
  '/cadastros/professores': 'Cadastros › Professores',
  '/cadastros/acompanhamentos': 'Cadastros › Acompanhamentos',
  '/cadastros/cronograma': 'Cadastros › Cronograma Semanal',
  '/cadastros/conteudo': 'Cadastros › Conteúdo do Portal',
  '/historico': 'Histórico',
  '/relatorios': 'Relatórios do Aluno',
  '/ranking': 'Ranking',
  // Portal pages
  '/portal': 'Início',
  '/portal/bem-vindos': 'Bem-vindos',
  '/portal/trilha': 'Trilha de Estudos',
  '/portal/videoaulas': 'Videoaulas',
  '/portal/simulados': 'Simulados',
  '/portal/acompanhamento': 'Acompanhamento',
  '/portal/relatorios': 'Relatórios',
  '/portal/materiais': 'Materiais',
  '/portal/comunicados': 'Comunicados',
  '/portal/suporte': 'Suporte',
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Route protection logic
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      if (pathname !== '/login') {
        router.push('/login');
      }
    } else if (user) {
      // User is logged in
      if (pathname === '/login') {
        // Redirect to their default landing page
        if (user.role === 'admin') {
          router.push('/');
        } else {
          router.push('/portal');
        }
      } else if (user.role === 'parent') {
        // Parents can ONLY access portal routes
        if (!pathname.startsWith('/portal')) {
          router.push('/portal');
        }
      } else if (user.role === 'admin') {
        // Admins should not access portal routes
        if (pathname.startsWith('/portal')) {
          router.push('/');
        }
      }
    }
  }, [isAuthenticated, user, isLoading, pathname, router]);

  // Loading State (Premium Spinner overlay)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-cinza-fundo)] flex flex-col justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-[var(--color-azul-autoridade)]/20 border-t-[var(--color-azul-autoridade)] animate-spin" />
            <Star size={20} className="absolute text-[var(--color-amarelo-conquista)] animate-pulse" fill="currentColor" />
          </div>
          <span className="text-sm font-bold text-[var(--color-azul-autoridade)] tracking-wide">
            Carregando Nota 10...
          </span>
        </div>
      </div>
    );
  }

  // Bypass Shell for Login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Hide sidebar/topbar layout if unauthenticated and redirecting
  if (!isAuthenticated) {
    return null;
  }

  // ─── PORTAL DO ALUNO (Parents Layout) ───
  if (user?.role === 'parent' && pathname.startsWith('/portal')) {
    const title = pageTitles[pathname] || 'Portal do Aluno';
    const planoLabel = user.plano ? planoLabels[user.plano] : 'Padrão';

    return (
      <div className="flex min-h-screen">
        <PortalSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="main-content flex-1 flex flex-col lg:ml-[256px] transition-all duration-300 w-full">
          <TopBar
            title={title}
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
            userRole={`Plano ${planoLabel}`}
          />
          <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // ─── ADMIN / TEACHER Layout (Full App Shell) ───
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
          userRole="Admin / Professor"
        />
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
