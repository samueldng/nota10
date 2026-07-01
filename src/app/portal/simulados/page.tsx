'use client';

import { useAuth } from '@/context/AuthContext';
import { getSimulados } from '@/lib/portalData';
import { canAccessFeature, planoLabels } from '@/lib/mockData';
import { FileText, Calendar, CheckCircle2, Clock, Lock, BarChart3, PlayCircle, ArrowRight } from 'lucide-react';

export default function SimuladosPage() {
  const { user } = useAuth();
  const alunoId = user?.alunoId || 'a1';
  const plano = user?.plano || 'padrao';
  const simulados = getSimulados(alunoId);

  const realizados = simulados.filter(s => s.status === 'realizado');
  const agendados = simulados.filter(s => s.status === 'agendado');
  const canViewReport = canAccessFeature('relatorio_simulado', plano);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Simulados Realizados */}
      {realizados.length > 0 ? (
        <>
          <h3 className="text-lg font-bold text-[var(--color-azul-autoridade)] flex items-center gap-2 animate-fade-in-up">
            <CheckCircle2 size={20} className="text-[var(--color-verde-sucesso)]" />
            Simulados Realizados
          </h3>
          {realizados.map((sim) => (
            <div key={sim.id} className="card animate-fade-in-up delay-1">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h4 className="text-base font-bold text-[var(--color-azul-autoridade)]">{sim.titulo}</h4>
                  <p className="text-xs text-[var(--color-cinza-texto)] flex items-center gap-1 mt-1">
                    <Calendar size={12} /> Realizado em {sim.data}
                  </p>
                </div>
                {sim.totalQuestoes && (
                  <div className="flex items-center gap-3">
                    <div className="text-center px-4 py-2 bg-[var(--color-verde-light)] rounded-xl border border-[var(--color-verde-sucesso)]/20">
                      <p className="text-xl font-extrabold text-[var(--color-verde-sucesso)] leading-none">{sim.acertos}</p>
                      <p className="text-[9px] text-[var(--color-cinza-texto)] font-bold">acertos</p>
                    </div>
                    <div className="text-center px-4 py-2 bg-[var(--color-vermelho-light)] rounded-xl border border-[var(--color-vermelho-erro)]/20">
                      <p className="text-xl font-extrabold text-[var(--color-vermelho-erro)] leading-none">{(sim.totalQuestoes || 0) - (sim.acertos || 0)}</p>
                      <p className="text-[9px] text-[var(--color-cinza-texto)] font-bold">erros</p>
                    </div>
                    <div className="text-center px-4 py-2 bg-[var(--color-azul-lightest)] rounded-xl border border-[var(--color-azul-autoridade)]/20">
                      <p className="text-xl font-extrabold text-[var(--color-azul-autoridade)] leading-none">{Math.round(((sim.acertos || 0) / (sim.totalQuestoes || 1)) * 100)}%</p>
                      <p className="text-[9px] text-[var(--color-cinza-texto)] font-bold">aproveitamento</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-[var(--color-cinza-borda)]">
                {sim.temGabarito && (
                  <button className="btn btn-outline text-xs py-2">
                    <FileText size={14} /> Ver Gabarito
                  </button>
                )}
                {sim.temCorrecaoVideo && (
                  <button className="btn btn-outline text-xs py-2">
                    <PlayCircle size={14} /> Correção em Vídeo
                  </button>
                )}
                {canViewReport ? (
                  <button className="btn btn-primary text-xs py-2">
                    <BarChart3 size={14} /> Relatório Detalhado
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-cinza-fundo)] rounded-xl border border-[var(--color-cinza-borda)] text-xs text-[var(--color-cinza-texto)]">
                    <Lock size={12} />
                    <span className="font-bold">
                      Relatório disponível no Plano {plano === 'padrao' ? 'Elite' : 'Elite'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className="card text-center py-12 animate-fade-in-up">
          <div className="w-16 h-16 rounded-full bg-[var(--color-cinza-fundo)] flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-[var(--color-cinza-texto)]" />
          </div>
          <h3 className="text-lg font-bold text-[var(--color-azul-autoridade)] mb-2">
            Nenhum simulado realizado ainda
          </h3>
          <p className="text-sm text-[var(--color-cinza-texto)]">
            Quando você fizer seu primeiro simulado, os resultados aparecerão aqui.
          </p>
        </div>
      )}

      {/* Próximos Simulados */}
      {agendados.length > 0 && (
        <>
          <h3 className="text-lg font-bold text-[var(--color-azul-autoridade)] flex items-center gap-2 animate-fade-in-up delay-2">
            <Clock size={20} className="text-[var(--color-amarelo-alerta)]" />
            Próximos Simulados
          </h3>
          {agendados.map((sim) => (
            <div key={sim.id} className="card animate-fade-in-up delay-2 border-l-4 border-l-[var(--color-amarelo-alerta)]">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[var(--color-azul-autoridade)]">{sim.titulo}</h4>
                  <p className="text-xs text-[var(--color-cinza-texto)] flex items-center gap-1 mt-1">
                    <Calendar size={12} /> Previsto para {sim.data}
                  </p>
                </div>
                <span className="badge badge-warning">Agendado</span>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
