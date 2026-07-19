'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import PlanLock from '@/components/portal/PlanLock';
import { TrendingUp, BarChart3, AlertCircle, Loader2, FileText, Calendar, Star } from 'lucide-react';

export default function PlanoElitePage() {
  const { user } = useAuth();
  const alunoId = user?.alunoId || 'a1';
  const nomeAluno = user?.alunoNome || 'Aluno';
  const plano = user?.plano || 'padrao';

  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!alunoId) return;
    setLoading(true);
    fetch(`/api/relatorios/simulado?alunoId=${alunoId}`)
      .then(async (res) => {
        const json = await res.json();
        if (res.status === 403 && json.blocked) {
          setBlocked(true);
        } else if (res.ok) {
          setData(json);
        }
      })
      .catch((err) => {
        console.error('Erro ao carregar relatório de simulado:', err);
        setBlocked(plano !== 'elite');
      })
      .finally(() => setLoading(false));
  }, [alunoId, plano]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-[#8B5CF6]" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card animate-fade-in-up" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-xl">
            <TrendingUp size={28} className="text-white" />
          </div>
          <div>
            <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Plano Elite</p>
            <h2 className="text-2xl font-black text-white">Relatório do Simulado</h2>
            <p className="text-white/70 text-sm mt-0.5">Análise aprofundada de desempenho e TRI</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <PlanLock featureKey="relatorioSimulado" requiredPlan="elite" customMessage={
        plano === 'acompanhamento' ? 'Disponível apenas no Plano Elite' : undefined
      }>
        {error ? (
          <div className="card border-l-4 border-l-red-400 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : data?.simulados?.filter((s: any) => s.status === 'realizado').length > 0 ? (
          <>
            {data.simulados.filter((s: any) => s.status === 'realizado').map((sim: any) => (
              <div key={sim.id} className="card mb-4 animate-fade-in-up">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-base font-bold text-[var(--color-azul-autoridade)]">{sim.titulo}</h4>
                    <p className="text-xs text-[var(--color-cinza-texto)] flex items-center gap-1 mt-1">
                      <Calendar size={12} /> {sim.data}
                    </p>
                  </div>
                  <div className="text-center bg-purple-50 rounded-xl px-4 py-2">
                    <p className="text-xl font-extrabold text-[#8B5CF6] leading-none">
                      {sim.aproveitamento || Math.round(((sim.acertos || 0) / (sim.totalQuestoes || 1)) * 100)}%
                    </p>
                    <p className="text-[9px] text-[var(--color-cinza-texto)] font-bold">aproveitamento</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="p-3 bg-[var(--color-cinza-fundo)] rounded-xl text-center">
                    <p className="text-lg font-extrabold text-[var(--color-azul-autoridade)]">{sim.totalQuestoes}</p>
                    <p className="text-[10px] text-[var(--color-cinza-texto)]">Total</p>
                  </div>
                  <div className="p-3 bg-[var(--color-verde-light)] rounded-xl text-center">
                    <p className="text-lg font-extrabold text-[var(--color-verde-sucesso)]">{sim.acertos}</p>
                    <p className="text-[10px] text-[var(--color-cinza-texto)]">Acertos</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-xl text-center">
                    <p className="text-lg font-extrabold text-[var(--color-vermelho-erro)]">{(sim.totalQuestoes || 0) - (sim.acertos || 0)}</p>
                    <p className="text-[10px] text-[var(--color-cinza-texto)]">Erros</p>
                  </div>
                </div>

                {sim.resultadoPorBloco && sim.resultadoPorBloco.length > 0 && (
                  <>
                    <h5 className="text-xs font-bold text-[var(--color-azul-autoridade)] uppercase mb-3">Desempenho por Bloco</h5>
                    <div className="overflow-x-auto">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Bloco</th>
                            <th>Disciplina</th>
                            <th>Acertos</th>
                            <th>Total</th>
                            <th>Classificação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sim.resultadoPorBloco.map((r: any, i: number) => (
                            <tr key={i}>
                              <td className="font-bold text-sm">{r.bloco}</td>
                              <td className="text-sm">{r.disciplina}</td>
                              <td className="font-bold text-sm text-[var(--color-verde-sucesso)]">{r.acertos}</td>
                              <td className="text-sm">{r.total}</td>
                              <td>
                                <span className={`badge ${
                                  r.classificacao === 'muito_bom' ? 'badge-success' :
                                  r.classificacao === 'regular' ? 'badge-warning' :
                                  'badge-error'
                                }`}>
                                  {r.classificacao === 'muito_bom' ? '🌟 Muito Bom' :
                                   r.classificacao === 'regular' ? '📊 Regular' :
                                   '⚠️ Precisa Revisar'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            ))}
          </>
        ) : (
          <div className="card text-center py-8">
            <FileText size={28} className="text-[var(--color-cinza-texto)] mx-auto mb-3" />
            <p className="text-sm text-[var(--color-cinza-texto)]">Nenhum simulado realizado ainda.</p>
          </div>
        )}
      </PlanLock>
    </div>
  );
}
