'use client';

import { useAuth } from '@/context/AuthContext';
import { CheckCircle2, Circle, Loader2, Zap, Map, BookOpen, PlayCircle, FileText } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Subtarefa {
  id: string;
  titulo: string;
  xp: number;
  status: 'concluido' | 'em_andamento' | 'pendente';
}

interface Tarefa {
  id: string;
  ordem: number;
  titulo: string;
  tipo: string;
  disciplina?: string | null;
  bloco?: string | null;
  xp: number;
  status: 'concluido' | 'em_andamento' | 'pendente';
  subTarefas: Subtarefa[];
}

interface CronogramaState {
  semana: string;
  periodo: string;
  tarefas: Tarefa[];
}

// ─── Icon map ──────────────────────────────────────────────────────────────────

const tipoIcons: Record<string, React.ReactNode> = {
  revisao:         <BookOpen   size={16} />,
  pre_aula:        <PlayCircle size={16} />,
  aula_presencial: <Map        size={16} />,
  simulado:        <FileText   size={16} />,
  atividade:       <BookOpen   size={16} />,
};

// ─── XP Toast ─────────────────────────────────────────────────────────────────

interface XpToast {
  id: string;
  xp: number;
  leveledUp: boolean;
  label?: string;
}

// ─── Helper: disparar um POST de progresso ─────────────────────────────────────
// O backend faz APENAS: INSERT idempotente + UPDATE xp.
// A cascata é gerida 100% aqui no front-end.

async function postProgresso(payload: {
  alunoId: string;
  atividadeId: string;
  xpGanho: number;
  tipoAcao: string;
}): Promise<{ xpTotal: number; nivel: number; leveledUp: boolean; alreadyCompleted: boolean }> {
  const res = await fetch('/api/progresso', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const b = await res.json(); msg = b?.error || msg; } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function TrilhaPage() {
  const { user } = useAuth();
  const alunoId = user?.alunoId || 'a1';

  const [cronograma, setCronograma] = useState<CronogramaState | null>(null);
  const [xpTotal, setXpTotal]       = useState(0);
  const [nivel, setNivel]           = useState(1);
  const [isLoading, setIsLoading]   = useState(true);
  const [xpToasts, setXpToasts]     = useState<XpToast[]>([]);

  // Pending set: chave única por item em flight — bloqueia duplos cliques.
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const pendingRef = useRef<Set<string>>(new Set());

  const addPending    = (k: string) => { pendingRef.current.add(k);    setPendingIds(new Set(pendingRef.current)); };
  const removePending = (k: string) => { pendingRef.current.delete(k); setPendingIds(new Set(pendingRef.current)); };

  const showToast = (xp: number, label?: string, leveledUp = false) => {
    const id = Math.random().toString(36).slice(2);
    setXpToasts((prev) => [...prev, { id, xp, leveledUp, label }]);
    setTimeout(() => setXpToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
    return id;
  };
  const markToastLevelUp = (id: string) =>
    setXpToasts((prev) => prev.map((t) => t.id === id ? { ...t, leveledUp: true } : t));

  // ── Load data ────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setIsLoading(true);
    let concluidas: string[] = [];

    try {
      const res = await fetch(`/api/progresso?alunoId=${alunoId}`);
      if (res.ok) {
        const data = await res.json();
        concluidas = data.atividadesConcluidas || [];
        setXpTotal(data.xpTotal || 0);
        setNivel(data.nivel   || 1);
      }
    } catch (_) {}

    try {
      const cronRes = await fetch(`/api/cronograma?alunoId=${alunoId}&semana=1`);
      if (cronRes.ok) {
        const dbTasks = await cronRes.json();
        if (Array.isArray(dbTasks) && dbTasks.length > 0) {
          const mappedTasks: Tarefa[] = dbTasks.map((t: any) => {
            const subtarefasRaw: any[] = typeof t.subtarefas === 'string'
              ? JSON.parse(t.subtarefas)
              : (t.subtarefas || []);

            const subTarefas: Subtarefa[] = subtarefasRaw.map((sub: any) => {
              const subId = sub.id != null ? String(sub.id) : sub.titulo;
              return {
                id:     subId,
                titulo: sub.titulo,
                xp:     sub.xp ?? 0,
                status: concluidas.includes(subId) ? 'concluido' : 'pendente',
              };
            });

            const tarefaConcluida =
              concluidas.includes(t.id) ||
              (subTarefas.length > 0 && subTarefas.every((s) => s.status === 'concluido'));

            return {
              id:         t.id,
              ordem:      t.ordem,
              titulo:     t.titulo,
              tipo:       t.tipo,
              disciplina: t.disciplina,
              bloco:      t.bloco,
              xp:         t.xpTotal,
              status:     tarefaConcluida ? 'concluido' : 'pendente',
              subTarefas,
            };
          });
          setCronograma({ semana: 'Semana 1', periodo: 'Esta Semana', tarefas: mappedTasks });
        } else {
          setCronograma({ semana: 'Semana 1', periodo: 'Esta Semana', tarefas: [] });
        }
      }
    } catch (_) {
      setCronograma({ semana: 'Semana 1', periodo: 'Esta Semana', tarefas: [] });
    }

    setIsLoading(false);
  }, [alunoId]);

  useEffect(() => {
    loadData();
    window.addEventListener('nota10_progress_updated', loadData);
    return () => window.removeEventListener('nota10_progress_updated', loadData);
  }, [loadData]);

  // ── Handler: tarefa avulsa (sem subtarefas) ───────────────────────────────────

  const handleToggleTarefa = useCallback(
    async (tarefaId: string, xp: number, tipo: string) => {
      const key = `tarefa::${tarefaId}`;
      if (pendingRef.current.has(key)) return;

      const tarefa = cronograma?.tarefas.find((t) => t.id === tarefaId);
      if (tarefa?.status === 'concluido') return;

      addPending(key);

      // Optimistic UI
      setCronograma((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tarefas: prev.tarefas.map((t) =>
            t.id === tarefaId ? { ...t, status: 'concluido' as const } : t
          ),
        };
      });
      setXpTotal((prev) => prev + xp);
      const toastId = showToast(xp, '🏆 Tarefa concluída!');

      try {
        const data = await postProgresso({ alunoId, atividadeId: tarefaId, xpGanho: xp, tipoAcao: tipo || 'atividade' });
        if (typeof data.xpTotal === 'number') setXpTotal(data.xpTotal);
        if (typeof data.nivel   === 'number') setNivel(data.nivel);
        if (data.leveledUp) markToastLevelUp(toastId);
        window.dispatchEvent(new Event('nota10_progress_updated'));
      } catch (e: any) {
        console.error('[Trilha] Erro ao concluir tarefa:', e?.message);
        // Rollback
        setCronograma((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            tarefas: prev.tarefas.map((t) =>
              t.id === tarefaId ? { ...t, status: 'pendente' as const } : t
            ),
          };
        });
        setXpTotal((prev) => prev - xp);
        setXpToasts((prev) => prev.filter((t) => t.id !== toastId));
      } finally {
        removePending(key);
      }
    },
    [alunoId, cronograma]
  );

  // ── Handler: subtarefa ────────────────────────────────────────────────────────
  // Após salvar a subtarefa, verifica se TODAS as irmãs foram concluídas.
  // Se sim, envia um segundo POST para creditar o XP da tarefa pai.

  const handleToggleSubtarefa = useCallback(
    async (subtarefaId: string, tarefaId: string, xp: number, tipo: string) => {
      const key = `${tarefaId}::${subtarefaId}`;
      if (pendingRef.current.has(key)) return;

      const tarefa = cronograma?.tarefas.find((t) => t.id === tarefaId);
      if (tarefa?.subTarefas.find((s) => s.id === subtarefaId)?.status === 'concluido') return;

      addPending(key);

      // Calcular estado pós-update para decidir cascata
      const subsDepoisDoUpdate = (tarefa?.subTarefas ?? []).map((s) =>
        s.id === subtarefaId ? { ...s, status: 'concluido' as const } : s
      );
      const todasConcluidas = subsDepoisDoUpdate.every((s) => s.status === 'concluido');
      const paiJaConcluido  = tarefa?.status === 'concluido';
      const xpPai           = tarefa?.xp ?? 0;

      // Optimistic UI
      setCronograma((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tarefas: prev.tarefas.map((t) => {
            if (t.id !== tarefaId) return t;
            const updatedSubs = t.subTarefas.map((s) =>
              s.id === subtarefaId ? { ...s, status: 'concluido' as const } : s
            );
            return {
              ...t,
              subTarefas: updatedSubs,
              status: updatedSubs.every((s) => s.status === 'concluido') ? 'concluido' : t.status,
            };
          }),
        };
      });
      setXpTotal((prev) => prev + xp + (todasConcluidas && !paiJaConcluido ? xpPai : 0));
      const toastId = showToast(xp);

      try {
        // POST 1 — XP da subtarefa
        const data = await postProgresso({
          alunoId,
          atividadeId: subtarefaId,
          xpGanho:     xp >= 0 ? xp : 1,
          tipoAcao:    tipo || 'atividade',
        });

        if (typeof data.xpTotal === 'number') setXpTotal(data.xpTotal);
        if (typeof data.nivel   === 'number') setNivel(data.nivel);
        if (data.leveledUp) markToastLevelUp(toastId);

        // POST 2 — Cascata: XP da tarefa pai (somente se todas as subs concluídas agora)
        // O front-end é o único responsável por esta lógica — o back-end não adivinhou nada.
        if (todasConcluidas && !paiJaConcluido && xpPai > 0) {
          try {
            const paiData = await postProgresso({
              alunoId,
              atividadeId: tarefaId,   // UUID da tarefa pai
              xpGanho:     xpPai,
              tipoAcao:    'tarefa_concluida',
            });
            if (typeof paiData.xpTotal === 'number') setXpTotal(paiData.xpTotal);
            if (typeof paiData.nivel   === 'number') setNivel(paiData.nivel);
            showToast(xpPai, '🏆 Tarefa concluída!', paiData.leveledUp);
          } catch (paiErr: any) {
            // XP do pai falhou — não é crítico; subtarefa já foi salva.
            console.warn('[Trilha] XP do pai falhou (não crítico):', paiErr?.message);
          }
        }

        window.dispatchEvent(new Event('nota10_progress_updated'));
      } catch (e: any) {
        console.error('[Trilha] Revertendo UI por erro:', e?.message);
        // Rollback total
        setCronograma((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            tarefas: prev.tarefas.map((t) => {
              if (t.id !== tarefaId) return t;
              return {
                ...t,
                subTarefas: t.subTarefas.map((s) =>
                  s.id === subtarefaId ? { ...s, status: 'pendente' as const } : s
                ),
                status: t.status === 'concluido' ? 'pendente' : t.status,
              };
            }),
          };
        });
        setXpTotal((prev) => prev - xp - (todasConcluidas && !paiJaConcluido ? xpPai : 0));
        setXpToasts((prev) => prev.filter((t) => t.id !== toastId));
      } finally {
        removePending(key);
      }
    },
    [alunoId, cronograma]
  );

  // ── Stats ─────────────────────────────────────────────────────────────────────

  const totalTarefas    = cronograma?.tarefas.length ?? 0;
  const qtdConcluidas   = cronograma?.tarefas.filter((t) => t.status === 'concluido').length ?? 0;
  const progressoSemana = totalTarefas === 0 ? 0 : Math.round((qtdConcluidas / totalTarefas) * 100);
  const xpTotal_semana  = cronograma?.tarefas.reduce((s, t) => s + t.xp, 0) ?? 0;
  const xpGanho_semana  = cronograma?.tarefas.filter((t) => t.status === 'concluido').reduce((s, t) => s + t.xp, 0) ?? 0;

  // ── Render ────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-[var(--color-azul-autoridade)]" size={32} />
      </div>
    );
  }

  if (!cronograma || cronograma.tarefas.length === 0) {
    return (
      <div className="text-center p-8 text-[var(--color-cinza-texto)] bg-[var(--color-cinza-fundo)] rounded-xl">
        Nenhuma trilha encontrada para esta semana.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── XP Toasts ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {xpToasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-fade-in-up text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-black text-sm ${
              toast.label ? 'bg-[var(--color-verde-sucesso)]' : 'bg-[var(--color-azul-autoridade)]'
            }`}
          >
            <Zap size={14} className="text-[var(--color-amarelo-conquista)]" />
            +{toast.xp} XP{toast.label ? ` ${toast.label}` : ''}{toast.leveledUp ? ' 🎉 Subiu de nível!' : ''}
          </div>
        ))}
      </div>

      {/* ── Header ── */}
      <div className="card animate-fade-in-up" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Trilha de Estudos</p>
            <h2 className="text-xl font-bold text-white mb-1">{cronograma.semana}</h2>
            <p className="text-white/70 text-sm">{cronograma.periodo}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-extrabold text-white leading-none">{progressoSemana}%</p>
              <p className="text-[10px] text-white/60 font-bold mt-0.5">concluído</p>
            </div>
            <div className="text-center bg-white/10 rounded-xl px-4 py-2">
              <p className="text-lg font-extrabold text-[var(--color-amarelo-conquista)] leading-none flex items-center gap-1">
                <Zap size={14} /> {xpGanho_semana}
              </p>
              <p className="text-[10px] text-white/60 font-bold mt-0.5">de {xpTotal_semana} XP</p>
            </div>
          </div>
        </div>
        <div className="mt-4 h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progressoSemana}%`, background: 'linear-gradient(90deg, #F5C800, #F59E0B)' }}
          />
        </div>
      </div>

      {/* ── Task List ── */}
      <div className="space-y-4">
        {cronograma.tarefas.map((tarefa, index) => {
          const hasSubtarefas = tarefa.subTarefas && tarefa.subTarefas.length > 0;
          const isDoneMain    = tarefa.status === 'concluido';
          const isPendingMain = pendingIds.has(`tarefa::${tarefa.id}`);

          return (
            <div
              key={tarefa.id}
              className={`card animate-fade-in-up transition-all ${
                isDoneMain ? 'border-[var(--color-verde-sucesso)]/30 bg-[var(--color-verde-light)]/20' :
                tarefa.status === 'em_andamento' ? 'border-[var(--color-amarelo-alerta)]/30' : ''
              }`}
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              {/* Task header */}
              <div className="flex items-start gap-4">

                {/* ── Ícone / Checkbox da tarefa avulsa ── */}
                {!hasSubtarefas ? (
                  // TAREFA AVULSA — botão clicável para marcar como concluída
                  <button
                    id={`tarefa-${tarefa.id}`}
                    onClick={() => handleToggleTarefa(tarefa.id, tarefa.xp, tarefa.tipo)}
                    disabled={isDoneMain || isPendingMain}
                    aria-label={`${isDoneMain ? 'Concluída' : 'Marcar como concluída'}: ${tarefa.titulo}`}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                      isDoneMain
                        ? 'bg-[var(--color-verde-sucesso)] text-white cursor-default'
                        : isPendingMain
                        ? 'bg-[var(--color-cinza-fundo)] text-[var(--color-azul-autoridade)] cursor-wait'
                        : 'bg-[var(--color-cinza-fundo)] text-[var(--color-cinza-texto)] border border-[var(--color-cinza-borda)] hover:border-[var(--color-azul-autoridade)] hover:text-[var(--color-azul-autoridade)] hover:bg-[var(--color-azul-lightest)] cursor-pointer active:scale-95'
                    }`}
                  >
                    {isPendingMain ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : isDoneMain ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <Circle size={20} />
                    )}
                  </button>
                ) : (
                  // TAREFA COM SUBTAREFAS — ícone estático (status derivado das subs)
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                    isDoneMain
                      ? 'bg-[var(--color-verde-sucesso)] text-white'
                      : tarefa.status === 'em_andamento'
                      ? 'bg-[var(--color-amarelo-alerta)] text-white'
                      : 'bg-[var(--color-cinza-fundo)] text-[var(--color-cinza-texto)] border border-[var(--color-cinza-borda)]'
                  }`}>
                    {isDoneMain ? <CheckCircle2 size={20} /> : tipoIcons[tarefa.tipo]}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className={`text-sm font-bold ${
                      isDoneMain ? 'text-[var(--color-verde-sucesso)] line-through' : 'text-[var(--color-azul-autoridade)]'
                    }`}>
                      {tarefa.ordem}. {tarefa.titulo}
                    </h4>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold flex-shrink-0 ${
                      isDoneMain
                        ? 'bg-[var(--color-verde-light)] text-[var(--color-verde-sucesso)]'
                        : tarefa.status === 'em_andamento'
                        ? 'bg-[var(--color-amarelo-alerta-light)] text-[var(--color-amarelo-alerta)]'
                        : 'bg-[var(--color-cinza-fundo)] text-[var(--color-cinza-texto)]'
                    }`}>
                      {isDoneMain ? '✓ Concluído' : tarefa.status === 'em_andamento' ? '● Em andamento' : '○ Pendente'}
                    </span>
                  </div>

                  {tarefa.disciplina && (
                    <p className="text-xs text-[var(--color-cinza-texto)]">{tarefa.disciplina} • {tarefa.bloco}</p>
                  )}

                  <div className="flex items-center gap-1 mt-1">
                    <Zap size={10} className="text-[var(--color-amarelo-conquista)]" />
                    <span className="text-[10px] font-bold text-[var(--color-amarelo-conquista)]">
                      +{tarefa.xp} XP{hasSubtarefas ? ' ao completar todas as subtarefas' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Subtarefas — interativas (só quando existem) ── */}
              {hasSubtarefas && (
                <div className="mt-4 ml-14 space-y-2 border-l-2 border-[var(--color-cinza-borda)] pl-4">
                  {tarefa.subTarefas.map((sub) => {
                    const isDone    = sub.status === 'concluido';
                    const isPending = pendingIds.has(`${tarefa.id}::${sub.id}`);

                    return (
                      <button
                        key={sub.id}
                        id={`subtarefa-${tarefa.id}-${sub.id}`}
                        onClick={() => handleToggleSubtarefa(sub.id, tarefa.id, sub.xp, tarefa.tipo)}
                        disabled={isDone || isPending}
                        aria-label={`${isDone ? 'Concluída' : 'Marcar como concluída'}: ${sub.titulo}`}
                        className={`
                          w-full flex items-center justify-between p-3 rounded-xl text-left
                          transition-all duration-200 group
                          ${isDone
                            ? 'bg-[var(--color-verde-light)]/60 cursor-default'
                            : isPending
                            ? 'bg-[var(--color-cinza-fundo)] cursor-wait opacity-70'
                            : 'bg-[var(--color-cinza-fundo)] hover:bg-[var(--color-azul-lightest)] hover:border-[var(--color-azul-autoridade)]/20 border border-transparent cursor-pointer active:scale-[0.98]'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2.5">
                          {isPending ? (
                            <Loader2 size={16} className="text-[var(--color-azul-autoridade)] animate-spin flex-shrink-0" />
                          ) : isDone ? (
                            <CheckCircle2 size={16} className="text-[var(--color-verde-sucesso)] flex-shrink-0" />
                          ) : (
                            <Circle
                              size={16}
                              className="text-[var(--color-cinza-borda)] group-hover:text-[var(--color-azul-autoridade)] transition-colors flex-shrink-0"
                            />
                          )}
                          <span className={`text-xs font-semibold transition-colors ${
                            isDone
                              ? 'text-[var(--color-verde-sucesso)] line-through'
                              : 'text-[var(--color-cinza-escuro)] group-hover:text-[var(--color-azul-autoridade)]'
                          }`}>
                            {sub.titulo}
                          </span>
                        </div>

                        <span className={`text-[9px] font-bold flex items-center gap-0.5 flex-shrink-0 transition-colors ${
                          isDone ? 'text-[var(--color-verde-sucesso)]' : 'text-[var(--color-cinza-texto)] group-hover:text-[var(--color-amarelo-conquista)]'
                        }`}>
                          <Zap size={8} className={isDone ? 'text-[var(--color-verde-sucesso)]' : 'text-[var(--color-amarelo-conquista)]'} />
                          {isDone ? '' : '+'}{sub.xp} XP
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
