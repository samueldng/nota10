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
  loginAsParent: (matriculaOrTelefone: string, password: string) => Promise<{ success: boolean; error?: string }>;
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
          setUser(JSON.parse(stored));
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
      const prof = professores.find(p => p.email.toLowerCase() === email.toLowerCase());

      if (!prof) {
        return { success: false, error: 'E-mail não cadastrado como professor.' };
      }

      if (password !== 'admin123' && password !== 'senha123') {
        return { success: false, error: 'Senha incorreta (use a padrão admin123).' };
      }

      const sessionUser: AuthUser = {
        name: `Prof. ${prof.nome}`,
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

  const loginAsParent = async (matriculaOrTelefone: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Fetch students from DB/mock
      const alunos = await getAlunos();
      const cleanInput = matriculaOrTelefone.replace(/\D/g, '');

      const aluno = alunos.find(a => {
        const matchMatricula = a.numero === cleanInput || a.numero === matriculaOrTelefone;
        const matchPhone1 = (a.responsavel1?.telefone || '').replace(/\D/g, '') === cleanInput;
        const matchPhone2 = (a.responsavel2?.telefone || '').replace(/\D/g, '') === cleanInput;
        return matchMatricula || matchPhone1 || matchPhone2;
      });

      if (!aluno) {
        return { success: false, error: 'Matrícula ou celular não encontrado.' };
      }

      // Check password: match either student's senhaInicial or standard 123456
      const validPasswords = ['123456', aluno.senhaInicial, (aluno.responsavel1?.telefone || '').slice(-4)].filter(Boolean);
      if (!validPasswords.includes(password)) {
        return { success: false, error: `Senha incorreta. Use a do aluno (${aluno.senhaInicial || 'não configurada'}) ou 123456.` };
      }

      const sessionUser: AuthUser = {
        name: aluno.responsavel1?.nome || `Responsável de ${aluno.nome}`,
        role: 'parent',
        alunoId: aluno.id,
        alunoNumero: aluno.numero,
        alunoNome: aluno.nome,
        plano: aluno.plano || 'padrao',
        turmaId: aluno.turmaId,
        turma: aluno.turma,
        primeiroAcesso: aluno.primeiroAcesso || false,
      };
      setUser(sessionUser);
      localStorage.setItem('nota10_session', JSON.stringify(sessionUser));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Erro ao autenticar: ' + err.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('nota10_session');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, loginAsAdmin, loginAsParent, logout, isDbOnline }}>
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
