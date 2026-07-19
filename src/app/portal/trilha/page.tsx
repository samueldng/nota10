'use client';

import { useAuth } from '@/context/AuthContext';
import { CheckCircle2, Circle, Loader2, Zap, Map, BookOpen, PlayCircle, FileText, Lock } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Tarefa {
  id: string;
  ordem: number;
  tipo: string;
  disciplina?: string | null;
  bloco?: string | null;
  titulo: string;
  xp_total: number;
  status: 'concluido' | 'em_andamento' | 'pendente' | 'bloqueada';
  xp_ganho: number;
}

interface Semana {
  semana_numero: number;
  datas_semana: string;
  liberada: boolean;
  atividades: Tarefa[];
}

export default function TrilhaPage() {
  const { user } = useAuth();
  const alunoId = user?.alunoId || 'a1';

  const [semanas, setSemanas] = useState<Semana[]>([]);
  const [turmaNome, setTurmaNome] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/trilha?alunoId=${alunoId}`);
      if (res.ok) {
        const data = await res.json();
        setSemanas(data.semanas || []);
        setTurmaNome(data.turmaNome || '');
        
        // Auto-expand the first unlocked week that is not 100% completed
        const firstActive = data.semanas?.find((s: Semana) => s.liberada && s.atividades.some(a => a.status !== 'concluida'));
        if (firstActive) {
          setExpandedWeek(firstActive.semana_numero);
        } else if (data.semanas?.length > 0) {
          setExpandedWeek(data.semanas[0].semana_numero);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
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

  if (semanas.length === 0) {
    return (
      <div className="text-center p-8 text-[var(--color-cinza-texto)] bg-[var(--color-cinza-fundo)] rounded-xl">
        Nenhuma trilha encontrada para sua turma.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card animate-fade-in-up" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }}>
        <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Trilha Semanal • {turmaNome}</p>
        <h2 className="text-2xl font-black text-white">Sua Jornada de Estudos</h2>
      </div>

      <div className="space-y-4">
        {semanas.map((semana, index) => {
          const isExpanded = expandedWeek === semana.semana_numero;
          const totalAtividades = semana.atividades.length;
          const concluidas = semana.atividades.filter(a => a.status === 'concluida').length;
          const isWeekDone = totalAtividades > 0 && concluidas === totalAtividades;
          
          return (
            <div key={semana.semana_numero} className={`card p-0 overflow-hidden animate-fade-in-up`} style={{ animationDelay: `${index * 0.1}s` }}>
              <div 
                className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${semana.liberada ? 'hover:bg-gray-50' : 'bg-gray-50 opacity-70'}`}
                onClick={() => semana.liberada && setExpandedWeek(isExpanded ? null : semana.semana_numero)}
              >
                <div className="flex items-center gap-3">
                  {!semana.liberada ? (
                    <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center text-gray-500">
                      <Lock size={20} />
                    </div>
                  ) : isWeekDone ? (
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-verde-sucesso)] flex items-center justify-center text-white">
                      <CheckCircle2 size={20} />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-azul-autoridade)] flex items-center justify-center text-white font-black">
                      {semana.semana_numero}
                    </div>
                  )}
                  <div>
                    <h3 className={`font-bold text-lg ${!semana.liberada ? 'text-gray-500' : 'text-[var(--color-azul-autoridade)]'}`}>
                      Semana {semana.semana_numero} {!semana.liberada && '🔒'}
                    </h3>
                    <p className="text-xs text-[var(--color-cinza-texto)]">{semana.datas_semana}</p>
                  </div>
                </div>
                
                {semana.liberada && (
                  <div className="text-right">
                    <span className="text-sm font-bold text-[var(--color-cinza-escuro)]">{concluidas}/{totalAtividades}</span>
                    <p className="text-[10px] text-[var(--color-cinza-texto)]">concluídas</p>
                  </div>
                )}
              </div>

              {isExpanded && semana.liberada && (
                <div className="p-4 border-t border-gray-100 bg-white space-y-3">
                  {semana.atividades.map((atv, i) => {
                    const isDone = atv.status === 'concluida';
                    const isLocked = atv.status === 'bloqueada';
                    
                    let linkHref = '#';
                    let btnText = 'Acessar';
                    if (atv.tipo === 'videoaula') linkHref = '/portal/videoaulas';
                    if (atv.tipo === 'questoes') linkHref = '/portal/simulados';
                    if (atv.tipo === 'revisao') linkHref = '/portal/revisao'; // Future Corujinha page
                    
                    return (
                      <div key={atv.id} className={`flex items-center justify-between p-3 rounded-xl border ${isDone ? 'border-[var(--color-verde-sucesso)]/30 bg-[var(--color-verde-light)]/20' : isLocked ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-[var(--color-cinza-borda)] hover:border-[var(--color-azul-autoridade)]/30 transition-colors'}`}>
                        <div className="flex items-center gap-3">
                           {isDone ? <CheckCircle2 size={18} className="text-[var(--color-verde-sucesso)]" /> : isLocked ? <Lock size={18} className="text-gray-400" /> : <Circle size={18} className="text-[var(--color-cinza-borda)]" />}
                           <div>
                             <h4 className={`text-sm font-bold ${isDone ? 'text-[var(--color-verde-sucesso)] line-through' : isLocked ? 'text-gray-500' : 'text-[var(--color-azul-autoridade)]'}`}>
                               {atv.ordem}. {atv.titulo}
                             </h4>
                             <p className="text-xs text-[var(--color-cinza-texto)]">{atv.tipo} {atv.disciplina ? `• ${atv.disciplina}` : ''}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-[var(--color-amarelo-conquista)] flex items-center gap-0.5">
                            <Zap size={10} fill="currentColor" /> {isDone ? atv.xp_ganho : atv.xp_total} XP
                          </span>
                          {!isDone && !isLocked && (
                            <Link href={linkHref} className="btn btn-primary py-1 px-3 text-xs">
                              {btnText}
                            </Link>
                          )}
                          {isDone && (
                             <span className="text-[10px] font-bold text-[var(--color-verde-sucesso)] bg-[var(--color-verde-light)] px-2 py-1 rounded">
                               Concluída
                             </span>
                          )}
                        </div>
                      </div>
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
