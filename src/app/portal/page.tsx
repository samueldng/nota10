'use client';

import { useAuth } from '@/context/AuthContext';
import PlanLock from '@/components/portal/PlanLock';
import {
  getNivel, getXPParaProximoNivel,
  getConquistas, getProgressoDisciplina,
  getRegistroSemanal, getIniciais, getAvatarColor,
} from '@/lib/portalData';
import type { CronogramaSemana } from '@/lib/mockData';
import {
  CalendarDays, MapPin, Clock, Zap, Flame, Trophy, Lock,
  CheckCircle2, Circle, Loader2, BookOpen, Star,
} from 'lucide-react';

import { useState, useEffect, useCallback } from 'react';

export default function PortalInicioPage() {
  const { user } = useAuth();
  const alunoId = user?.alunoId || 'a1';
  const nomeAluno = user?.alunoNome || 'Aluno';
  const plano = user?.plano || 'padrao';
  const turmaId = user?.turmaId || 'T001';

  // State values
  const [xpTotal, setXpTotal] = useState(0);
  const [nivel, setNivel] = useState(1);
  const [xpProgress, setXpProgress] = useState({ atual: 0, proximo: 100, progresso: 0 });
  const [streak, setStreak] = useState(0);
  const [conquistas, setConquistas] = useState<any[]>([]);
  const [progressoDisciplina, setProgressoDisciplina] = useState<any[]>([]);
  const [cronograma, setCronograma] = useState<CronogramaSemana | null>(null);
  const [dbLoaded, setDbLoaded] = useState(false);
  const [proximaAula, setProximaAula] = useState<{ data: string; diaSemana: string; horario: string; local: string; blocos: any[] } | null>(null);

  const loadData = useCallback(async () => {
    let concluidas: string[] = [];
    
    // 1. Try to load XP from the database first
    try {
      const res = await fetch(`/api/progresso?alunoId=${alunoId}`);
      if (res.ok) {
        const data = await res.json();
        setXpTotal(data.xpTotal || 0);
        setNivel(data.nivel || 1);
        setXpProgress({
          atual: data.xpAtual || 0,
          proximo: data.xpProximo || 100,
          progresso: data.progresso || 0,
        });
        concluidas = data.atividadesConcluidas || [];
        setDbLoaded(true);
      } else {
        // Fallback to computed values from xpTotal = 0
        setXpTotal(0);
        setNivel(1);
        setXpProgress({ atual: 0, proximo: 100, progresso: 0 });
      }
    } catch (err) {
      // API not available — default values
      console.warn('Progresso API não disponível, usando valores padrão:', err);
      setXpTotal(0);
      setNivel(1);
      setXpProgress({ atual: 0, proximo: 100, progresso: 0 });
    }

    // 2. Fetch cronograma from the backend API if online
    try {
      const cronogramaRes = await fetch(`/api/cronograma?alunoId=${alunoId}&semana=1`);
      if (cronogramaRes.ok) {
        const dbTasks = await cronogramaRes.json();
        if (dbTasks && dbTasks.length > 0) {
          const mappedTasks = dbTasks.map((t: any) => ({
            id: t.id,
            ordem: t.ordem,
            titulo: t.titulo,
            tipo: t.tipo,
            disciplina: t.disciplina,
            bloco: t.bloco,
            xp: t.xpTotal,
            turmaNome: t.turmaNome || '',
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
            turmaId: turmaId,
            semana: 'Semana 1',
            periodo: 'Esta Semana',
            tarefas: mappedTasks
          });
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar cronograma do banco:', e);
    }

    // 3. Obter Próxima Aula via /api/turmas
    try {
      const turmasRes = await fetch('/api/turmas');
      if (turmasRes.ok) {
        const turmasList = await turmasRes.json();
        const minhaTurma = turmasList.find((t: any) => t.id === turmaId || t.nome.includes(turmaId));
        if (minhaTurma && minhaTurma.dias && minhaTurma.dias.length > 0) {
          try {
            const diaSemana = minhaTurma.dias[0]; 
            
            // Cálculo seguro de fuso horário UTC-3 (Brasília)
            const daysMap: Record<string, number> = {
              'Domingo': 0, 'Segunda': 1, 'Terça': 2, 'Quarta': 3,
              'Quinta': 4, 'Sexta': 5, 'Sábado': 6
            };
            const targetDay = daysMap[diaSemana] !== undefined ? daysMap[diaSemana] : 1;
            const now = new Date();
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const brTime = new Date(utc - (3600000 * 3));
            
            let daysToTarget = targetDay - brTime.getDay();
            if (daysToTarget < 0) daysToTarget += 7;
            
            brTime.setDate(brTime.getDate() + daysToTarget);
            const formattedDate = brTime.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            
            setProximaAula({
              data: formattedDate,
              diaSemana: diaSemana,
              horario: minhaTurma.horario || '08:00 - 12:00',
              local: 'Presencial — Sede',
              blocos: minhaTurma.disciplinas?.map((d: string) => ({ disciplina: d, bloco: 'Bloco Atual' })) || []
            });
          } catch (dateErr) {
            console.error('Erro ao calcular a data:', dateErr);
            setProximaAula(null);
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar turmas:', e);
    }

    setStreak(0);
    setConquistas(getConquistas(alunoId));
    setProgressoDisciplina(getProgressoDisciplina(alunoId));
  }, [alunoId, turmaId]);

  useEffect(() => {
    loadData();
    // Listen for progress updates (cross-component sync)
    window.addEventListener('nota10_progress_updated', loadData);
    return () => {
      window.removeEventListener('nota10_progress_updated', loadData);
    };
  }, [loadData]);

  if (!cronograma) return null;

  const registro = getRegistroSemanal(alunoId);

  const iniciais = getIniciais(nomeAluno);
  const avatarColor = getAvatarColor(nomeAluno);

  const firstName = nomeAluno.split(' ')[0];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ── 4.1 Card "Próxima Aula" ── */}
      {proximaAula && (
        <div className="card animate-fade-in-up" style={{ background: 'linear-gradient(135deg, #1A3A6B 0%, #122B52 100%)' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-center bg-white/10 rounded-2xl p-3 min-w-[72px]">
                <p className="text-[var(--color-amarelo-conquista)] font-extrabold text-2xl leading-none">{proximaAula?.data?.split('/')[0] || '--'}</p>
                <p className="text-white/80 text-xs font-bold mt-1">
                  {proximaAula?.data?.split('/')[1] ? ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][parseInt(proximaAula.data.split('/')[1]) - 1] : ''}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Próxima Aula</p>
                <p className="text-white font-bold text-lg leading-tight">{proximaAula.diaSemana}</p>
                <div className="flex items-center gap-3 mt-1.5 text-white/70 text-xs">
                  <span className="flex items-center gap-1"><Clock size={12} /> {proximaAula.horario}</span>
                  <span className="flex items-center gap-1"><MapPin size={12} /> {proximaAula.local}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {proximaAula?.blocos?.map((b, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs font-bold border border-white/10">
                  <BookOpen size={12} className="text-[var(--color-amarelo-conquista)]" />
                  {b.bloco} — {b.disciplina}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 4.2 Painel de Gamificação ── */}
      <div className="card animate-fade-in-up delay-1">
        {!dbLoaded ? (
          <div className="flex items-center justify-center py-10 gap-2">
            <Loader2 className="animate-spin text-[var(--color-azul-autoridade)]" size={24} />
            <span className="text-sm text-[var(--color-cinza-texto)] font-bold">Carregando progresso do aluno...</span>
          </div>
        ) : (() => {
          const xpAtualDoNivel = xpTotal % 100;
          return (
            <>
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Avatar + Level + XP */}
                <div className="flex items-center gap-4 lg:min-w-[260px]">
                  <div className="relative">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shadow-lg"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {iniciais}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[var(--color-amarelo-conquista)] text-[var(--color-azul-autoridade)] flex items-center justify-center text-[10px] font-black border-2 border-white">
                      {nivel}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[var(--color-azul-autoridade)]">
                      Nível {nivel} — {firstName}
                    </p>
                    <div className="mt-2 h-3 bg-[var(--color-cinza-fundo)] rounded-full overflow-hidden border border-[var(--color-cinza-borda)]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${xpAtualDoNivel}%`,
                          background: 'linear-gradient(90deg, var(--color-amarelo-conquista), #F59E0B)',
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-[var(--color-cinza-texto)] mt-1 flex items-center gap-1">
                      <Zap size={10} className="text-[var(--color-amarelo-conquista)]" />
                      {xpAtualDoNivel} / 100 XP para o próximo nível
                    </p>
                  </div>
                </div>

                {/* Streak */}
                <div className="flex items-center gap-3 lg:border-l lg:border-[var(--color-cinza-borda)] lg:pl-6">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-200">
                    <Flame size={24} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-orange-500 leading-none">{streak}</p>
                    <p className="text-[10px] text-[var(--color-cinza-texto)] font-bold">semanas seguidas</p>
                  </div>
                </div>

                {/* Progress by discipline */}
                <div className="flex-1 lg:border-l lg:border-[var(--color-cinza-borda)] lg:pl-6 space-y-3">
                  {progressoDisciplina.map((p) => (
                    <div key={p.disciplina}>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-bold text-[var(--color-azul-autoridade)]">{p.disciplina}</p>
                        <p className="text-[10px] text-[var(--color-cinza-texto)]">{p.blocosCompletos}/{p.blocosTotal} blocos</p>
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: p.blocosTotal }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-2.5 flex-1 rounded-full transition-all ${
                              i < p.blocosCompletos
                                ? 'bg-[var(--color-verde-sucesso)]'
                                : i === p.blocoAtual - 1
                                ? 'bg-[var(--color-amarelo-conquista)] animate-pulse'
                                : 'bg-[var(--color-cinza-borda)]'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conquistas */}
              <div className="mt-5 pt-4 border-t border-[var(--color-cinza-borda)]">
                <h4 className="text-xs font-bold text-[var(--color-azul-autoridade)] mb-3 flex items-center gap-1.5">
                  <Trophy size={14} className="text-[var(--color-amarelo-conquista)]" /> Conquistas
                </h4>
                <div className="flex flex-wrap gap-2">
                  {conquistas.map((c) => (
                    <div
                      key={c.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        c.desbloqueada
                          ? 'bg-[var(--color-amarelo-alerta-light)] border-[var(--color-amarelo-conquista)]/30 text-[var(--color-cinza-escuro)]'
                          : 'bg-[var(--color-cinza-fundo)] border-[var(--color-cinza-borda)] text-[var(--color-cinza-texto)] opacity-50'
                      }`}
                      title={c.descricao}
                    >
                      {c.desbloqueada ? c.icone : <Lock size={10} />}
                      {c.nome}
                    </div>
                  ))}
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* ── 4.3 "O que fazer esta semana" ── */}
      <div className="card animate-fade-in-up delay-2">
        <h3 className="text-base font-bold text-[var(--color-azul-autoridade)] mb-1 flex items-center gap-2">
          <CalendarDays size={18} />
          O que fazer esta semana
        </h3>
        <p className="text-xs text-[var(--color-cinza-texto)] mb-4">{cronograma.semana} • {cronograma.periodo}</p>

        <div className="space-y-3">
          {cronograma?.tarefas?.length > 0 ? cronograma.tarefas.map((tarefa) => (
            <div key={tarefa.id} className={`p-4 rounded-xl border transition-all ${
              tarefa.status === 'concluido'
                ? 'bg-[var(--color-verde-light)] border-[var(--color-verde-sucesso)]/30'
                : tarefa.status === 'em_andamento'
                ? 'bg-[var(--color-amarelo-alerta-light)] border-[var(--color-amarelo-alerta)]/30'
                : 'bg-white border-[var(--color-cinza-borda)]'
            }`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                    tarefa.status === 'concluido'
                      ? 'bg-[var(--color-verde-sucesso)] text-white'
                      : tarefa.status === 'em_andamento'
                      ? 'bg-[var(--color-amarelo-alerta)] text-white'
                      : 'bg-[var(--color-cinza-fundo)] text-[var(--color-cinza-texto)] border border-[var(--color-cinza-borda)]'
                  }`}>
                    {tarefa.status === 'concluido' ? <CheckCircle2 size={16} /> : tarefa.status === 'em_andamento' ? <Loader2 size={16} /> : tarefa.ordem}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${tarefa.status === 'concluido' ? 'text-[var(--color-verde-sucesso)] line-through' : 'text-[var(--color-azul-autoridade)]'}`}>
                      {tarefa.titulo}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {tarefa.disciplina && (
                        <span className="text-[10px] text-[var(--color-cinza-texto)]">{tarefa.disciplina} • {tarefa.bloco}</span>
                      )}
                      {(tarefa as any).turmaNome && (
                        <span className="px-1.5 py-0.5 rounded bg-[var(--color-azul-lightest)] text-[var(--color-azul-autoridade)] text-[8px] font-black uppercase tracking-wider">
                          {(tarefa as any).turmaNome}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[var(--color-amarelo-conquista)] flex items-center gap-0.5 flex-shrink-0">
                  <Zap size={10} /> +{tarefa.xp} XP
                </span>
              </div>

              {/* Sub-tarefas */}
              {tarefa.subTarefas && tarefa.subTarefas.length > 0 && (
                <div className="mt-3 ml-11 space-y-2">
                  {tarefa.subTarefas.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {sub.status === 'concluido' ? (
                          <CheckCircle2 size={14} className="text-[var(--color-verde-sucesso)]" />
                        ) : sub.status === 'em_andamento' ? (
                          <Loader2 size={14} className="text-[var(--color-amarelo-alerta)]" />
                        ) : (
                          <Circle size={14} className="text-[var(--color-cinza-borda)]" />
                        )}
                        <span className={`text-xs ${sub.status === 'concluido' ? 'text-[var(--color-verde-sucesso)] line-through' : 'text-[var(--color-cinza-escuro)]'}`}>
                          {sub.titulo}
                        </span>
                      </div>
                      <span className="text-[9px] text-[var(--color-cinza-texto)]">+{sub.xp} XP</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )) : (
            <div className="text-center p-6 text-[var(--color-cinza-texto)] border border-dashed border-[var(--color-cinza-borda)] rounded-xl">
              Nenhuma tarefa agendada para esta semana.
            </div>
          )}
        </div>
      </div>

      {/* ── 4.4 "Registro desta semana" (plan-gated) ── */}
      <PlanLock featureKey="inicio_registro_semana">
        <div className="card animate-fade-in-up delay-3">
          <h3 className="text-base font-bold text-[var(--color-azul-autoridade)] mb-4 flex items-center gap-2">
            <Star size={18} className="text-[var(--color-amarelo-conquista)]" fill="currentColor" />
            Registro desta Semana
          </h3>
          <p className="text-xs text-[var(--color-cinza-texto)] mb-4">{registro.semana}</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Presença', value: registro.presenca ? '✅ Presente' : '❌ Faltou', ok: registro.presenca },
              { label: 'Palavra-chave', value: registro.palavraChave ? '✅ Feita' : '❌ Não fez', ok: registro.palavraChave },
              { label: 'Fixação', value: registro.fixacao ? '✅ Feita' : '⚠️ Parcial', ok: registro.fixacao },
              { label: 'Atenção', value: registro.atencao === 'atento' ? '🟢 Atento' : registro.atencao === 'distraido' ? '🟡 Distraído' : '🔴 Desinteressado', ok: registro.atencao === 'atento' },
              { label: 'Comportamento', value: registro.comportamento === 'excelente' ? '🌟 Excelente' : registro.comportamento === 'bom' ? '👍 Bom' : '⚡ Agitado', ok: registro.comportamento !== 'agitado' },
              { label: 'Pontualidade', value: registro.pontualidade ? '✅ Pontual' : '⏰ Atrasado', ok: registro.pontualidade },
            ].map((item) => (
              <div
                key={item.label}
                className={`p-3 rounded-xl border text-center ${
                  item.ok
                    ? 'bg-[var(--color-verde-light)] border-[var(--color-verde-sucesso)]/20'
                    : 'bg-[var(--color-amarelo-alerta-light)] border-[var(--color-amarelo-alerta)]/20'
                }`}
              >
                <p className="text-[10px] font-bold text-[var(--color-cinza-texto)] uppercase mb-1">{item.label}</p>
                <p className="text-xs font-bold text-[var(--color-cinza-escuro)]">{item.value}</p>
              </div>
            ))}
          </div>

          {registro.observacaoProfessora && (
            <div className="mt-4 p-4 bg-[var(--color-azul-lightest)] rounded-xl border border-[var(--color-azul-light)]/30">
              <p className="text-xs font-bold text-[var(--color-azul-autoridade)] mb-1">📝 Observação da Professora</p>
              <p className="text-xs text-[var(--color-cinza-escuro)] leading-relaxed italic">{registro.observacaoProfessora}</p>
            </div>
          )}
        </div>
      </PlanLock>
    </div>
  );
}
