'use client';

import { useAuth } from '@/context/AuthContext';
import { CheckCircle2, Circle, Loader2, Zap, Map, BookOpen, PlayCircle, FileText } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

const tipoIcons: Record<string, React.ReactNode> = {
  revisao: <BookOpen size={16} />,
  pre_aula: <PlayCircle size={16} />,
  aula_presencial: <Map size={16} />,
  simulado: <FileText size={16} />,
  atividade: <BookOpen size={16} />,
};

export default function TrilhaPage() {
  const { user } = useAuth();
  const alunoId = user?.alunoId || 'a1';
  const turmaId = user?.turmaId || 'T001';
  
  const [cronograma, setCronograma] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    let concluidas: string[] = [];

    // 1. Load progress
    try {
      const res = await fetch(`/api/progresso?alunoId=${alunoId}`);
      if (res.ok) {
        const data = await res.json();
        concluidas = data.atividadesConcluidas || [];
      }
    } catch (e) {}

    // 2. Load cronograma
    try {
      const cronRes = await fetch(`/api/cronograma?alunoId=${alunoId}&semana=1`);
      if (cronRes.ok) {
        const dbTasks = await cronRes.json();
        const mappedTasks = dbTasks.map((t: any) => ({
          id: t.id,
          ordem: t.ordem,
          titulo: t.titulo,
          tipo: t.tipo,
          disciplina: t.disciplina,
          bloco: t.bloco,
          xp: t.xpTotal,
          status: concluidas.includes(t.id) ? 'concluido' : 'pendente',
          subTarefas: typeof t.subtarefas === 'string' ? JSON.parse(t.subtarefas).map((sub: any) => ({
            ...sub,
            status: concluidas.includes(sub.id) ? 'concluido' : 'pendente'
          })) : (t.subtarefas || []).map((sub: any) => ({
            ...sub,
            status: concluidas.includes(sub.id) ? 'concluido' : 'pendente'
          }))
        }));
        setCronograma({
          semana: 'Semana 1',
          periodo: 'Esta Semana',
          tarefas: mappedTasks
        });
      }
    } catch (e) {}

    setIsLoading(false);
  }, [alunoId]);

  useEffect(() => {
    loadData();
    window.addEventListener('nota10_progress_updated', loadData);
    return () => window.removeEventListener('nota10_progress_updated', loadData);
  }, [loadData]);

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

  const totalTarefas = cronograma.tarefas.length;
  const concluidas = cronograma.tarefas.filter((t: any) => t.status === 'concluido').length;
  const progressoSemana = totalTarefas === 0 ? 0 : Math.round((concluidas / totalTarefas) * 100);
  const xpTotal = cronograma.tarefas.reduce((sum: number, t: any) => sum + t.xp, 0);
  const xpGanho = cronograma.tarefas.filter((t: any) => t.status === 'concluido').reduce((sum: number, t: any) => sum + t.xp, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
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
                <Zap size={14} /> {xpGanho}
              </p>
              <p className="text-[10px] text-white/60 font-bold mt-0.5">de {xpTotal} XP</p>
            </div>
          </div>
        </div>

        {/* Week progress bar */}
        <div className="mt-4 h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progressoSemana}%`, background: 'linear-gradient(90deg, #F5C800, #F59E0B)' }}
          />
        </div>
      </div>

      {/* Tarefas expandidas */}
      <div className="space-y-4">
        {cronograma.tarefas.map((tarefa: any, index: number) => (
          <div
            key={tarefa.id}
            className={`card animate-fade-in-up ${
              tarefa.status === 'concluido' ? 'border-[var(--color-verde-sucesso)]/30' :
              tarefa.status === 'em_andamento' ? 'border-[var(--color-amarelo-alerta)]/30' : ''
            }`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Task header */}
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                tarefa.status === 'concluido'
                  ? 'bg-[var(--color-verde-sucesso)] text-white'
                  : tarefa.status === 'em_andamento'
                  ? 'bg-[var(--color-amarelo-alerta)] text-white'
                  : 'bg-[var(--color-cinza-fundo)] text-[var(--color-cinza-texto)] border border-[var(--color-cinza-borda)]'
              }`}>
                {tarefa.status === 'concluido' ? <CheckCircle2 size={20} /> : tipoIcons[tarefa.tipo]}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className={`text-sm font-bold ${
                    tarefa.status === 'concluido' ? 'text-[var(--color-verde-sucesso)] line-through' : 'text-[var(--color-azul-autoridade)]'
                  }`}>
                    {tarefa.ordem}. {tarefa.titulo}
                  </h4>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    tarefa.status === 'concluido'
                      ? 'bg-[var(--color-verde-light)] text-[var(--color-verde-sucesso)]'
                      : tarefa.status === 'em_andamento'
                      ? 'bg-[var(--color-amarelo-alerta-light)] text-[var(--color-amarelo-alerta)]'
                      : 'bg-[var(--color-cinza-fundo)] text-[var(--color-cinza-texto)]'
                  }`}>
                    {tarefa.status === 'concluido' ? '✓ Concluído' : tarefa.status === 'em_andamento' ? '● Em andamento' : '○ Pendente'}
                  </span>
                </div>

                {tarefa.disciplina && (
                  <p className="text-xs text-[var(--color-cinza-texto)]">{tarefa.disciplina} • {tarefa.bloco}</p>
                )}

                <div className="flex items-center gap-1 mt-1">
                  <Zap size={10} className="text-[var(--color-amarelo-conquista)]" />
                  <span className="text-[10px] font-bold text-[var(--color-amarelo-conquista)]">+{tarefa.xp} XP ao completar</span>
                </div>
              </div>
            </div>

            {/* Sub-tarefas */}
            {tarefa.subTarefas && tarefa.subTarefas.length > 0 && (
              <div className="mt-4 ml-14 space-y-2 border-l-2 border-[var(--color-cinza-borda)] pl-4">
                {tarefa.subTarefas.map((sub: any) => (
                  <div key={sub.id} className={`flex items-center justify-between p-3 rounded-xl ${
                    sub.status === 'concluido'
                      ? 'bg-[var(--color-verde-light)]/50'
                      : sub.status === 'em_andamento'
                      ? 'bg-[var(--color-amarelo-alerta-light)]/50'
                      : 'bg-[var(--color-cinza-fundo)]'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      {sub.status === 'concluido' ? (
                        <CheckCircle2 size={16} className="text-[var(--color-verde-sucesso)]" />
                      ) : sub.status === 'em_andamento' ? (
                        <Loader2 size={16} className="text-[var(--color-amarelo-alerta)]" />
                      ) : (
                        <Circle size={16} className="text-[var(--color-cinza-borda)]" />
                      )}
                      <span className={`text-xs font-semibold ${sub.status === 'concluido' ? 'text-[var(--color-verde-sucesso)] line-through' : 'text-[var(--color-cinza-escuro)]'}`}>
                        {sub.titulo}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-[var(--color-cinza-texto)] flex items-center gap-0.5">
                      <Zap size={8} className="text-[var(--color-amarelo-conquista)]" /> +{sub.xp} XP
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
