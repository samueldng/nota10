'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Star, Lock, User, Phone, CheckCircle, Database } from 'lucide-react';

export default function LoginPage() {
  const { user, loginAsAdmin, loginAsParent, isAuthenticated, isDbOnline } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'admin' | 'parent'>('admin');
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
      {/* Top Database Status Indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[var(--color-cinza-borda)] shadow-sm text-xs font-semibold">
        <Database size={14} className={isDbOnline ? 'text-[var(--color-verde-sucesso)]' : 'text-[var(--color-amarelo-alerta)]'} />
        <span>Conexão:</span>
        <span className={isDbOnline ? 'text-[var(--color-verde-sucesso)]' : 'text-[var(--color-amarelo-alerta)]'}>
          {isDbOnline ? 'Supabase Online' : 'Modo Demo (Local)'}
        </span>
      </div>

      <div className="w-full max-w-md animate-fade-in-up">
        {/* Brand Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-[var(--color-azul-autoridade)] px-6 py-3 rounded-2xl shadow-md">
            <span className="text-white font-extrabold text-3xl tracking-tight">Nota</span>
            <span className="relative">
              <span className="text-[var(--color-amarelo-conquista)] font-extrabold text-4xl leading-none font-sans">10</span>
              <Star
                size={12}
                className="absolute -top-1 -right-2.5 text-[var(--color-amarelo-conquista)]"
                fill="currentColor"
              />
            </span>
            <span className="text-white/80 text-sm font-semibold pl-2 border-l border-white/20 ml-2">
              Educacional
            </span>
          </div>
          <p className="text-[var(--color-cinza-texto)] text-xs mt-3 font-medium">
            Gestão escolar simples, precisa e eficiente.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-[var(--color-cinza-borda)] overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-[var(--color-cinza-borda)] bg-gray-50">
            <button
              onClick={() => { setActiveTab('admin'); setError(null); }}
              className={`flex-1 py-4 text-sm font-bold transition-all border-b-2 flex items-center justify-center gap-2 ${
                activeTab === 'admin'
                  ? 'border-[var(--color-azul-autoridade)] text-[var(--color-azul-autoridade)] bg-white'
                  : 'border-transparent text-[var(--color-cinza-texto)] hover:bg-gray-100'
              }`}
            >
              <User size={16} />
              Admin / Professor
            </button>
            <button
              onClick={() => { setActiveTab('parent'); setError(null); }}
              className={`flex-1 py-4 text-sm font-bold transition-all border-b-2 flex items-center justify-center gap-2 ${
                activeTab === 'parent'
                  ? 'border-[var(--color-azul-autoridade)] text-[var(--color-azul-autoridade)] bg-white'
                  : 'border-transparent text-[var(--color-cinza-texto)] hover:bg-gray-100'
              }`}
            >
              <Phone size={16} />
              Pais e Alunos
            </button>
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
                  <label className="form-label">E-mail do Administrador / Professor</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-cinza-texto)]" />
                    <input
                      type="email"
                      required
                      placeholder="exemplo@nota10.edu.br"
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

                {/* Helper info */}
                <div className="mt-4 p-3 bg-[var(--color-azul-lightest)] rounded-xl border border-[var(--color-azul-light)]/40">
                  <p className="text-[10px] text-[var(--color-azul-dark)] leading-relaxed">
                    <strong>💡 Dica de Teste (Admin):</strong>
                    <br />
                    E-mail: <code>joao.silva@nota10.edu.br</code> ou <code>admin@nota10.com</code>
                    <br />
                    Senha: <code>admin123</code>
                  </p>
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

                {/* Helper info */}
                <div className="mt-4 p-3 bg-[var(--color-amarelo-alerta-light)] rounded-xl border border-[var(--color-amarelo-alerta)]/30">
                  <p className="text-[10px] text-[var(--color-amarelo-alerta)] leading-relaxed">
                    <strong>💡 Dica de Teste (Pais):</strong>
                    <br />
                    Matrícula: <code>0123</code> ou Celular: <code>11999991234</code>
                    <br />
                    Senha: <code>123456</code>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[10px] text-[var(--color-cinza-texto)] mt-6">
          Nota 10 Educacional © 2026. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
