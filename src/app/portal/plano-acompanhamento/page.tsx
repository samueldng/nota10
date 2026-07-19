'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import PlanLock from '@/components/portal/PlanLock';
import { FileText, Download, Star, BarChart3, Loader2, Calendar, AlertCircle } from 'lucide-react';

export default function PlanoAcompanhamentoPage() {
  const { user } = useAuth();
  const alunoId = user?.alunoId || 'a1';
  const nomeAluno = user?.alunoNome || 'Aluno';

  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!alunoId) return;
    setLoading(true);
    fetch(`/api/relatorios/mensal?alunoId=${alunoId}`)
      .then(async (res) => {
        const json = await res.json();
        if (res.status === 403 && json.blocked) {
          setBlocked(true);
        } else if (res.ok) {
          setData(json);
        }
      })
      .catch((err) => {
        console.error('Erro ao carregar relatório mensal:', err);
        setError('Falha ao carregar o relatório. Tente novamente.');
      })
      .finally(() => setLoading(false));
  }, [alunoId]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-[var(--color-azul-autoridade)]" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card animate-fade-in-up" style={{ background: 'linear-gradient(135deg, #1A3A6B 0%, #122B52 100%)' }}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-xl">
            <FileText size={28} className="text-white" />
          </div>
          <div>
            <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Plano Acompanhamento</p>
            <h2 className="text-2xl font-black text-white">Relatório Mensal</h2>
            <p className="text-white/70 text-sm mt-0.5">Análise detalhada do desempenho de {nomeAluno}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <PlanLock featureKey="relatorioMensal" requiredPlan="acompanhamento">
        {error ? (
          <div className="card border-l-4 border-l-red-400 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : data ? (
          <div className="card animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-bold text-[var(--color-azul-autoridade)]">
                  Relatório de {data.periodo || 'Período Atual'}
                </h4>
                <p className="text-xs text-[var(--color-cinza-texto)] mt-1">
                  Gerado em {data.geradoEm || '--'} • Aluno: {data.aluno?.nome || nomeAluno}
                </p>
              </div>
              <span className="badge badge-success">Disponível</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-[var(--color-verde-light)] rounded-xl border border-[var(--color-verde-sucesso)]/20">
                <p className="text-xs font-bold text-[var(--color-verde-sucesso)] mb-2 flex items-center gap-1.5">
                  <Star size={14} fill="currentColor" /> Destaques Positivos
                </p>
                <ul className="space-y-1 text-xs text-[var(--color-cinza-escuro)] pl-3 list-disc">
                  {(data.destaques || []).map((d: string, i: number) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 bg-[var(--color-amarelo-alerta-light)] rounded-xl border border-[var(--color-amarelo-alerta)]/20">
                <p className="text-xs font-bold text-[var(--color-amarelo-alerta)] mb-2 flex items-center gap-1.5">
                  <BarChart3 size={14} /> Pontos de Atenção
                </p>
                <ul className="space-y-1 text-xs text-[var(--color-cinza-escuro)] pl-3 list-disc">
                  {(data.pontosAtencao || []).map((p: string, i: number) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>

            <button className="btn btn-primary w-full py-3">
              <Download size={16} /> Baixar Relatório em PDF
            </button>
          </div>
        ) : (
          <div className="card text-center py-8">
            <FileText size={28} className="text-[var(--color-cinza-texto)] mx-auto mb-3" />
            <p className="text-sm text-[var(--color-cinza-texto)]">Nenhum relatório disponível ainda para este período.</p>
          </div>
        )}
      </PlanLock>
    </div>
  );
}
