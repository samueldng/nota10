'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProfessores, getAlunos } from '@/lib/api';
import type { Aluno, PlanoAluno } from '@/lib/mockData';

export type UserRole = 'admin' | 'parent';

export interface AuthUser {
  name: string;
  email?: string;
  role: UserRole;
  alunoId?: string; // Only for parents
  alunoNumero?: string; // Only for parents
  alunoNome?: string; // Only for parents
  plano?: PlanoAluno; // Only for parents
  turmaId?: string; // Only for parents
  turma?: string; // Only for parents
  primeiroAcesso?: boolean; // Only for parents
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginAsAdmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginAsParent: (matriculaOrTelefone: string, password: string) => Promise<{ success: boolean; error?: string; requireProfileSelection?: boolean; profiles?: any[] }>;
  selectProfile: (profile: any) => void;
  logout: () => void;
  isDbOnline: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDbOnline, setIsDbOnline] = useState(false);

  // Check database connectivity and load session on mount
  useEffect(() => {
    async function checkDbAndSession() {
      // 1. Check database connectivity via health API
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setIsDbOnline(data.database === 'connected');
        } else {
          setIsDbOnline(false);
        }
      } catch (err) {
        setIsDbOnline(false);
      }

      // 2. Load stored session
      const stored = localStorage.getItem('nota10_session');
      if (stored) {
        try {
          const sessionUser = JSON.parse(stored);
          setUser(sessionUser);

          // Sincronizar plano do aluno diretamente do banco em segundo plano se for responsável
          if (sessionUser.role === 'parent' && sessionUser.alunoId) {
            fetch(`/api/alunos?id=${sessionUser.alunoId}`)
              .then((res) => {
                if (res.ok) return res.json();
                throw new Error('Falha ao buscar perfil do aluno');
              })
              .then((freshAluno) => {
                if (freshAluno && freshAluno.plano) {
                  const updatedUser = {
                    ...sessionUser,
                    plano: freshAluno.plano,
                    turmaId: freshAluno.turmaId,
                    turma: freshAluno.turma,
                    alunoNome: freshAluno.nome,
                  };
                  setUser(updatedUser);
                  localStorage.setItem('nota10_session', JSON.stringify(updatedUser));
                }
              })
              .catch((err) => console.error('Erro ao sincronizar plano do aluno:', err));
          }
        } catch (e) {
          localStorage.removeItem('nota10_session');
        }
      }
      setIsLoading(false);
    }

    checkDbAndSession();
  }, []);

  const loginAsAdmin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Allow superadmin bypass
      if (email === 'admin@nota10.com' && password === 'admin123') {
        const sessionUser: AuthUser = {
          name: 'Coordenador Geral',
          email,
          role: 'admin'
        };
        setUser(sessionUser);
        localStorage.setItem('nota10_session', JSON.stringify(sessionUser));
        return { success: true };
      }

      // Fetch teachers from DB/mock
      const professores = await getProfessores();
      
      // Normaliza o input do usuário para suportar: email, nome completo, ou "prof.romildo"
      const inputNorm = email.trim().toLowerCase();
      const prof = professores.find(p => {
        const emailMatch = p.email.toLowerCase() === inputNorm;
        const nomeMatch  = p.nome.toLowerCase() === inputNorm;
        // Suporte ao username curto: "prof.romildo" → busca pelo nome "Prof. Romildo"
        const usernameMatch = inputNorm === 'prof.romildo' && p.email.toLowerCase() === 'romildo@nota10.edu.br';
        return emailMatch || nomeMatch || usernameMatch;
      });

      if (!prof) {
        return { success: false, error: 'E-mail ou usuário não cadastrado como professor.' };
      }

      // Validação de senha: cada professor tem sua senha individual.
      // Prof. Romildo → senha exclusiva 'rom1000do*'
      // Demais professores → 'admin123' ou 'senha123'
      const isRomildo = prof.email.toLowerCase() === 'romildo@nota10.edu.br';
      const validPasswords = isRomildo
        ? ['rom1000do*']
        : ['admin123', 'senha123'];

      if (!validPasswords.includes(password)) {
        return { success: false, error: 'Senha incorreta.' };
      }

      const sessionUser: AuthUser = {
        name: prof.nome.startsWith('Prof.') ? prof.nome : `Prof. ${prof.nome}`,
        email: prof.email,
        role: 'admin'
      };
      setUser(sessionUser);
      localStorage.setItem('nota10_session', JSON.stringify(sessionUser));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Erro ao autenticar: ' + err.message };
    }
  };

  const loginAsParent = async (matriculaOrTelefone: string, password: string): Promise<{ success: boolean; error?: string; requireProfileSelection?: boolean; profiles?: any[] }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matriculaOrTelefone, password })
      });

      if (response.status === 206) {
        const data = await response.json();
        return {
          success: true,
          requireProfileSelection: true,
          profiles: data.profiles
        };
      }

      if (!response.ok) {
        const errData = await response.json();
        return { success: false, error: errData.error || 'Erro ao realizar login.' };
      }

      const data = await response.json();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('nota10_session', JSON.stringify(data.user));
        return { success: true };
      }

      return { success: false, error: 'Resposta de login inválida.' };
    } catch (err: any) {
      return { success: false, error: 'Erro ao autenticar: ' + err.message };
    }
  };

  const selectProfile = (profile: any) => {
    const sessionUser: AuthUser = {
      name: profile.responsavelNome || `Responsável de ${profile.nome}`,
      role: 'parent',
      alunoId: profile.id,
      alunoNumero: profile.numero,
      alunoNome: profile.nome,
      plano: profile.plano || 'padrao',
      turmaId: profile.turmaId,
      turma: profile.turma,
      primeiroAcesso: profile.primeiroAcesso || false,
    };
    setUser(sessionUser);
    localStorage.setItem('nota10_session', JSON.stringify(sessionUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('nota10_session');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, loginAsAdmin, loginAsParent, selectProfile, logout, isDbOnline }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
