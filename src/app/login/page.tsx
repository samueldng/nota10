'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, User, Phone, Database } from 'lucide-react';
import logoOficial from '../../../public/logo-nota10.svg';

export default function LoginPage() {
  const { user, loginAsAdmin, loginAsParent, isAuthenticated, isDbOnline } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'admin' | 'parent'>('parent');
  const [email, setEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [matriculaOrPhone, setMatriculaOrPhone] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        router.push('/');
      } else {
        router.push('/responsavel');
      }
    }
  }, [isAuthenticated, user, router]);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await loginAsAdmin(email, adminPassword);
      if (res.success) {
        router.push('/');
      } else {
        setError(res.error || 'Erro ao realizar login.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleParentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await loginAsParent(matriculaOrPhone, parentPassword);
      if (res.success) {
        router.push('/responsavel');
      } else {
        setError(res.error || 'Erro ao realizar login.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-cinza-fundo)] flex flex-col justify-center items-center p-4">
      {/* Top Right Control - Access to Admin / Professor Portal */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={() => {
            setActiveTab(activeTab === 'parent' ? 'admin' : 'parent');
            setError(null);
          }}
          className="flex items-center gap-2 bg-white hover:bg-[var(--color-azul-lightest)] text-[var(--color-azul-autoridade)] px-4 py-2 rounded-full border border-[var(--color-cinza-borda)] shadow-sm text-xs font-bold transition-all cursor-pointer hover:shadow-md"
        >
          {activeTab === 'parent' ? (
            <>
              <User size={14} className="text-[var(--color-azul-autoridade)]" />
              <span>Área do Professor / Admin</span>
            </>
          ) : (
            <>
              <Phone size={14} className="text-[var(--color-azul-autoridade)]" />
              <span>Área de Pais e Alunos</span>
            </>
          )}
        </button>
      </div>

      <div className="w-full max-w-md animate-fade-in-up">
        {/* Brand Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center">
            <Image
              src={logoOficial}
              alt="Nota 10 Educacional"
              className="h-28 w-auto mx-auto object-contain"
              unoptimized
              priority
            />
          </div>
          <p className="text-[var(--color-cinza-texto)] text-xs mt-3 font-medium">
            Gestão escolar simples, precisa e eficiente.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-[var(--color-cinza-borda)] overflow-hidden">
          {/* Header representing the Active Mode */}
          <div className="px-6 py-5 border-b border-[var(--color-cinza-borda)] bg-gray-50/50 flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--color-azul-autoridade)] flex items-center gap-2 m-0">
              {activeTab === 'parent' ? (
                <>
                  <Phone size={18} className="text-[var(--color-azul-autoridade)]" />
                  Acesso de Pais e Alunos
                </>
              ) : (
                <>
                  <User size={18} className="text-[var(--color-azul-autoridade)]" />
                  Acesso de Professores / Gestão
                </>
              )}
            </h2>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-5 p-3 rounded-xl bg-[var(--color-vermelho-light)] border border-[var(--color-vermelho-erro)]/30 text-[var(--color-vermelho-erro)] text-xs font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-vermelho-erro)] flex-shrink-0" />
                {error}
              </div>
            )}

            {activeTab === 'admin' ? (
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">E-mail ou Usuário do Administrador</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-cinza-texto)]" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: exemplo@nota10.edu.br ou prof.romildo"
                      className="form-input pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Senha</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-cinza-texto)]" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      className="form-input pl-10"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full py-3 text-sm mt-2"
                >
                  {loading ? 'Entrando...' : 'Acessar Área Administrativa'}
                </button>

                {/* Back Link to Parent Login */}
                <div className="text-center mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('parent');
                      setError(null);
                    }}
                    className="text-xs font-semibold text-[var(--color-cinza-texto)] hover:text-[var(--color-azul-autoridade)] hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                  >
                    ← Voltar para Acesso de Pais
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleParentSubmit} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Nº Matrícula ou Celular</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-cinza-texto)]" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: 0123 ou (11) 99999-1234"
                      className="form-input pl-10"
                      value={matriculaOrPhone}
                      onChange={(e) => setMatriculaOrPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Senha de Acesso</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-cinza-texto)]" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      className="form-input pl-10"
                      value={parentPassword}
                      onChange={(e) => setParentPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full py-3 text-sm mt-2"
                >
                  {loading ? 'Verificando...' : 'Acessar Painel do Aluno'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="flex flex-col items-center gap-2 mt-6">
          <p className="text-center text-[10px] text-[var(--color-cinza-texto)] m-0">
            Nota 10 Educacional © 2026. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-1 text-[9px] font-semibold text-[var(--color-cinza-texto)] opacity-60">
            <Database size={10} className={isDbOnline ? 'text-[var(--color-verde-sucesso)]' : 'text-[var(--color-amarelo-alerta)]'} />
            <span>Status: {isDbOnline ? 'Banco de dados conectado' : 'Modo Demonstrativo (Local)'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
