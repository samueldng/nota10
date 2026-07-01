'use client';

import { useAuth } from '@/context/AuthContext';
import { canAccessFeature, planoLabels } from '@/lib/mockData';
import { getSimulados, upgradeTexts, getWhatsAppUpgradeUrl } from '@/lib/portalData';
import {
  FileText, Lock, Download, ArrowRight, MessageCircle,
  CheckCircle2, BarChart3, Calendar, Star,
} from 'lucide-react';

function LockedReport({ title, description, conteudo, targetPlan, customMessage }: {
  title: string; description: string; conteudo: string[]; targetPlan: 'acompanhamento' | 'elite'; customMessage?: string;
}) {
  const { user } = useAuth();
  const nomeAluno = user?.alunoNome || 'Aluno';
  const plano = user?.plano || 'padrao';

  return (
    <div className="card border-2 border-dashed border-[var(--color-cinza-borda)]">
      <div className="text-center py-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--color-cinza-fundo)] flex items-center justify-center mb-4 border border-[var(--color-cinza-borda)]">
          <Lock size={28} className="text-[var(--color-cinza-texto)]" />
        </div>
        <h4 className="text-base font-bold text-[var(--color-azul-autoridade)] mb-2">{title}</h4>
        <p className="text-sm text-[var(--color-cinza-texto)] mb-4 max-w-md mx-auto">{description}</p>

        {/* Content preview */}
        <div className="bg-[var(--color-cinza-fundo)] rounded-xl p-4 max-w-sm mx-auto mb-5 text-left">
          <p className="text-[10px] font-bold text-[var(--color-azul-autoridade)] uppercase mb-2">O que contém:</p>
          <div className="space-y-1.5">
            {conteudo.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 size={12} className="text-[var(--color-verde-sucesso)] mt-0.5 flex-shrink-0" />
                <span className="text-xs text-[var(--color-cinza-escuro)]">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs font-bold text-[var(--color-amarelo-alerta)] mb-4">
          {customMessage || `Disponível no Plano ${planoLabels[targetPlan]} ou superior`}
        </p>

        <div className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
          <a
            href={getWhatsAppUpgradeUrl(nomeAluno, planoLabels[targetPlan])}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary flex-1 py-2.5 text-xs no-underline"
          >
            Quero Desbloquear <ArrowRight size={12} />
          </a>
          <a
            href={getWhatsAppUpgradeUrl(nomeAluno, planoLabels[targetPlan])}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline flex-1 py-2.5 text-xs no-underline"
          >
            <MessageCircle size={12} /> WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

export default function RelatoriosPage() {
  const { user } = useAuth();
  const plano = user?.plano || 'padrao';
  const alunoId = user?.alunoId || 'a1';
  const nomeAluno = user?.alunoNome || 'Aluno';

  const canMensal = canAccessFeature('relatorio_mensal', plano);
  const canSimulado = canAccessFeature('relatorio_simulado', plano);
  const simulados = getSimulados(alunoId);
  const realizados = simulados.filter(s => s.status === 'realizado');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* ── 10.1 Relatório Mensal ── */}
      <div className="animate-fade-in-up">
        <h3 className="text-lg font-bold text-[var(--color-azul-autoridade)] mb-4 flex items-center gap-2">
          <FileText size={20} className="text-[var(--color-azul-info)]" />
          Relatório Mensal
        </h3>

        {canMensal ? (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-bold text-[var(--color-azul-autoridade)]">
                  Relatório de Junho 2026
                </h4>
                <p className="text-xs text-[var(--color-cinza-texto)] mt-1">
                  Gerado em 30/06/2026 • Aluno: {nomeAluno}
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
                  <li>Evolução contínua na atenção em sala</li>
                  <li>Alta taxa de completude de atividades</li>
                  <li>Participação acima da média da turma</li>
                </ul>
              </div>
              <div className="p-4 bg-[var(--color-amarelo-alerta-light)] rounded-xl border border-[var(--color-amarelo-alerta)]/20">
                <p className="text-xs font-bold text-[var(--color-amarelo-alerta)] mb-2 flex items-center gap-1.5">
                  <BarChart3 size={14} /> Pontos de Atenção
                </p>
                <ul className="space-y-1 text-xs text-[var(--color-cinza-escuro)] pl-3 list-disc">
                  <li>Bloco 2 de Matemática precisa de reforço</li>
                  <li>2 faltas no mês — manter regularidade</li>
                </ul>
              </div>
            </div>

            <button className="btn btn-primary w-full py-3">
              <Download size={16} /> Baixar Relatório em PDF
            </button>
          </div>
        ) : (
          <LockedReport
            title={upgradeTexts.relatorioMensal.titulo}
            description={upgradeTexts.relatorioMensal.descricao}
            conteudo={upgradeTexts.relatorioMensal.conteudo}
            targetPlan="acompanhamento"
          />
        )}
      </div>

      {/* ── 10.2 Relatório do Simulado ── */}
      <div className="animate-fade-in-up delay-1">
        <h3 className="text-lg font-bold text-[var(--color-azul-autoridade)] mb-4 flex items-center gap-2">
          <BarChart3 size={20} className="text-[#8B5CF6]" />
          Relatório do Simulado
        </h3>

        {canSimulado ? (
          realizados.length > 0 ? (
            realizados.map((sim) => (
              <div key={sim.id} className="card mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-base font-bold text-[var(--color-azul-autoridade)]">{sim.titulo}</h4>
                    <p className="text-xs text-[var(--color-cinza-texto)] flex items-center gap-1 mt-1">
                      <Calendar size={12} /> {sim.data}
                    </p>
                  </div>
                  <div className="text-center bg-[var(--color-azul-lightest)] rounded-xl px-4 py-2">
                    <p className="text-xl font-extrabold text-[var(--color-azul-autoridade)] leading-none">
                      {Math.round(((sim.acertos || 0) / (sim.totalQuestoes || 1)) * 100)}%
                    </p>
                    <p className="text-[9px] text-[var(--color-cinza-texto)] font-bold">aproveitamento</p>
                  </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="p-3 bg-[var(--color-cinza-fundo)] rounded-xl text-center">
                    <p className="text-lg font-extrabold text-[var(--color-azul-autoridade)]">{sim.totalQuestoes}</p>
                    <p className="text-[10px] text-[var(--color-cinza-texto)]">Total</p>
                  </div>
                  <div className="p-3 bg-[var(--color-verde-light)] rounded-xl text-center">
                    <p className="text-lg font-extrabold text-[var(--color-verde-sucesso)]">{sim.acertos}</p>
                    <p className="text-[10px] text-[var(--color-cinza-texto)]">Acertos</p>
                  </div>
                  <div className="p-3 bg-[var(--color-vermelho-light)] rounded-xl text-center">
                    <p className="text-lg font-extrabold text-[var(--color-vermelho-erro)]">{(sim.totalQuestoes || 0) - (sim.acertos || 0)}</p>
                    <p className="text-[10px] text-[var(--color-cinza-texto)]">Erros</p>
                  </div>
                </div>

                {/* Per-block breakdown */}
                {sim.resultadoPorBloco && (
                  <>
                    <h5 className="text-xs font-bold text-[var(--color-azul-autoridade)] uppercase mb-3">
                      Desempenho por Bloco
                    </h5>
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
            ))
          ) : (
            <div className="card text-center py-8">
              <FileText size={28} className="text-[var(--color-cinza-texto)] mx-auto mb-3" />
              <p className="text-sm text-[var(--color-cinza-texto)]">Nenhum simulado realizado ainda.</p>
            </div>
          )
        ) : (
          <LockedReport
            title={upgradeTexts.relatorioSimulado.titulo}
            description={upgradeTexts.relatorioSimulado.descricao}
            conteudo={upgradeTexts.relatorioSimulado.conteudo}
            targetPlan="elite"
            customMessage={
              plano === 'acompanhamento'
                ? 'Disponível apenas no Plano Elite'
                : `Disponível no Plano Elite`
            }
          />
        )}
      </div>
    </div>
  );
}
