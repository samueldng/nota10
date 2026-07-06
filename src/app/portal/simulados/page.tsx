'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { canAccessFeature, planoLabels } from '@/lib/mockData';
import { FileText, Calendar, CheckCircle2, Clock, Lock, BarChart3, PlayCircle, ArrowRight, Zap, Loader2 } from 'lucide-react';

export default function SimuladosPage() {
  const { user } = useAuth();
  const alunoId = user?.alunoId || 'a1';
  const plano = user?.plano || 'padrao';
  const turmaId = user?.turmaId;

  const [simulados, setSimulados] = useState<any[]>([]);
  const [atividadesConcluidas, setAtividadesConcluidas] = useState<string[]>([]);
  const [selectedSimulado, setSelectedSimulado] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadProgresso = async () => {
    try {
      const res = await fetch(`/api/progresso?alunoId=${alunoId}`);
      if (res.ok) {
        const data = await res.json();
        setAtividadesConcluidas(data.atividadesConcluidas || []);
        return data.atividadesConcluidas || [];
      }
    } catch (e) {
      console.error('Erro ao carregar progresso:', e);
    }
    return [];
  };

  const loadSimulados = async (completedList: string[]) => {
    if (!turmaId) return;

    try {
      const res = await fetch(`/api/conteudos?turmaId=${turmaId}&tipoConteudo=simulado`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const formatted = data.map((item: any) => {
            let extra = {
              status: 'agendado',
              totalQuestoes: 40,
              acertos: 0,
              temGabarito: false,
              temCorrecaoVideo: false,
              resultadoPorBloco: []
            };
            if (item.descricao) {
              try {
                extra = { ...extra, ...JSON.parse(item.descricao) };
              } catch (e) {}
            }

            const completed = completedList.includes(item.id);
            const status = completed ? 'realizado' : extra.status;
            const acertos = completed && extra.acertos === 0 ? 32 : extra.acertos;
            const temGabarito = completed ? true : extra.temGabarito;
            const temCorrecaoVideo = completed ? true : extra.temCorrecaoVideo;
            const resultadoPorBloco = completed && (!extra.resultadoPorBloco || extra.resultadoPorBloco.length === 0) ? [
              { bloco: 'Bloco 1', disciplina: 'Português', acertos: 9, total: 10, classificacao: 'muito_bom' },
              { bloco: 'Bloco 2', disciplina: 'Português', acertos: 7, total: 10, classificacao: 'regular' },
              { bloco: 'Bloco 1', disciplina: 'Matemática', acertos: 8, total: 10, classificacao: 'muito_bom' },
              { bloco: 'Bloco 2', disciplina: 'Matemática', acertos: 8, total: 10, classificacao: 'muito_bom' },
            ] : extra.resultadoPorBloco;

            return {
              id: item.id,
              titulo: item.titulo,
              data: item.dataDisponibilizacao ? new Date(item.dataDisponibilizacao).toLocaleDateString('pt-BR') : '',
              status,
              totalQuestoes: extra.totalQuestoes,
              acertos,
              temGabarito,
              temCorrecaoVideo,
              resultadoPorBloco,
            };
          });
          setSimulados(formatted);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar simulados:', err);
    }
  };

  const loadData = async () => {
    const list = await loadProgresso();
    await loadSimulados(list);
  };

  useEffect(() => {
    loadData();
  }, [turmaId, alunoId]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleOpenSubmitModal = (sim: any) => {
    setSelectedSimulado(sim);
  };

  const handleSubmitGabarito = async () => {
    if (!selectedSimulado || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/progresso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alunoId,
          tipoAcao: 'simulado',
          xpGanho: 50,
          atividadeId: selectedSimulado.id
        })
      });

      if (response.ok) {
        setToast('+50 XP!');
        
        // Dispatch sync event
        window.dispatchEvent(new Event('nota10_progress_updated'));
      } else {
        const errData = await response.json();
        alert('Erro ao enviar gabarito: ' + (errData.error || 'Erro desconhecido'));
      }
    } catch (err) {
      console.error('Erro ao enviar gabarito:', err);
    } finally {
      setIsSubmitting(false);
      setSelectedSimulado(null);
      loadData();
    }
  };

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
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-[var(--color-azul-autoridade)]">{sim.titulo}</h4>
                  <p className="text-xs text-[var(--color-cinza-texto)] flex items-center gap-1 mt-1">
                    <Calendar size={12} /> Previsto para {sim.data}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="badge badge-warning">Agendado</span>
                  <button 
                    onClick={() => handleOpenSubmitModal(sim)}
                    className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowRight size={12} />
                    <span>Enviar Gabarito</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* MODAL ENVIAR GABARITO */}
      {selectedSimulado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedSimulado(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up p-6">
            <h3 className="text-lg font-bold text-[var(--color-azul-autoridade)] mb-2 flex items-center gap-2">
              <Zap size={20} className="text-[var(--color-amarelo-conquista)]" fill="currentColor" />
              Enviar Gabarito do Simulado
            </h3>
            <p className="text-xs text-[var(--color-cinza-texto)] mb-4">
              Você está prestes a enviar as respostas do <strong>{selectedSimulado.titulo}</strong>. Certifique-se de ter preenchido todas as questões na sua folha de respostas física ou no gabarito oficial.
            </p>

            <div className="bg-[var(--color-azul-lightest)] rounded-xl p-4 border border-[var(--color-azul-light)]/40 mb-6 text-center">
              <p className="text-sm text-[var(--color-cinza-escuro)]">Recompensa de Conclusão:</p>
              <p className="text-2xl font-black text-[var(--color-amarelo-conquista)] flex items-center justify-center gap-1 mt-1">
                <Zap size={24} fill="currentColor" /> +50 XP!
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-cinza-borda)]">
              <button onClick={() => setSelectedSimulado(null)} className="btn btn-outline text-xs py-2" disabled={isSubmitting}>
                Cancelar
              </button>
              <button 
                onClick={handleSubmitGabarito} 
                className="btn btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Confirmar Envio</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de XP */}
      {toast && (
        <div 
          className="fixed top-6 right-6 z-[60] text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in-up text-sm font-black border border-[var(--color-amarelo-conquista)]/30"
          style={{ background: 'linear-gradient(135deg, var(--color-amarelo-conquista) 0%, #F59E0B 100%)', color: 'var(--color-azul-autoridade)' }}
        >
          <Zap size={18} fill="currentColor" /> {toast}
        </div>
      )}
    </div>
  );
}
