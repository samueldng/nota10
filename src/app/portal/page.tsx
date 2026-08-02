'use client';

import { useAuth } from '@/context/AuthContext';
import PlanLock from '@/components/portal/PlanLock';
import {
  getNivel, getXPParaProximoNivel,
  getConquistas,
  getRegistroSemanal, getIniciais, getAvatarColor,
} from '@/lib/portalData';
import type { CronogramaSemana } from '@/lib/mockData';
import {
  CalendarDays, MapPin, Clock, Zap, Flame, Trophy, Lock,
  CheckCircle2, Circle, Loader2, BookOpen, Star, ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

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
  const [isLoadingPortal, setIsLoadingPortal] = useState(true);
  const [proximaAula, setProximaAula] = useState<{ data: string; diaSemana: string; horario: string; local: string; blocos: any[] } | null>(null);
  const [trilhaFutura, setTrilhaFutura] = useState(false);
  const [mensagemTrilha, setMensagemTrilha] = useState<string | null>(null);
  const [dataInicioTurma, setDataInicioTurma] = useState<string | null>(null);

  // ── Concluídas (from API, read-only) — used for display only
  const [concluidas, setConcluidas] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    console.log('🔄 [Portal] Iniciando busca de dados do portal...', { alunoId, turmaId });
    let concluidasLoaded: string[] = [];
    
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
        concluidasLoaded = data.atividadesConcluidas || [];
        setConcluidas(concluidasLoaded);
        setDbLoaded(true);
      } else {
        console.warn(`[Portal] /api/progresso retornou ${res.status} para alunoId=${alunoId}. Usando valores padrão.`);
        setXpTotal(0);
        setNivel(1);
        setXpProgress({ atual: 0, proximo: 100, progresso: 0 });
        setDbLoaded(true);
      }
    } catch (err) {
      console.warn('Progresso API não disponível, usando valores padrão:', err);
      setXpTotal(0);
      setNivel(1);
      setXpProgress({ atual: 0, proximo: 100, progresso: 0 });
      setDbLoaded(true);
    }

    // 2. Fetch Trilha/Cronograma Oficial via /api/trilha
    let trilhaCarregada = false;
    try {
      const trilhaRes = await fetch(`/api/trilha?alunoId=${alunoId}`);
      if (trilhaRes.ok) {
        const dataTrilha = await trilhaRes.json();

        // Tratar turma no futuro — informar ao aluno quando as aulas iniciam
        if (dataTrilha.futuro) {
          setTrilhaFutura(true);
          setMensagemTrilha(dataTrilha.mensagem || 'As aulas ainda não iniciaram.');
          setDataInicioTurma(dataTrilha.dataInicio || null);
          trilhaCarregada = true;
        }

        // Tratar mensagem informativa (sem cronograma cadastrado, sem matrícula, etc.)
        if (dataTrilha.mensagem && !dataTrilha.futuro && (!dataTrilha.semanas || dataTrilha.semanas.length === 0)) {
          setMensagemTrilha(dataTrilha.mensagem);
          trilhaCarregada = true;
        }

        if (dataTrilha.semanas && dataTrilha.semanas.length > 0) {
          trilhaCarregada = true;
          const semanas: any[] = dataTrilha.semanas;
          const semanasLiberadas = semanas.filter((s: any) => s.liberada);
          const semanaAtual = semanasLiberadas.length > 0 ? semanasLiberadas[semanasLiberadas.length - 1] : semanas[0];

          // ── "O que fazer esta semana" — ALL activities (including completed, for read-only status display)
          const atividadesSemana = semanaAtual?.atividades || [];
          const atividadesPendentes = atividadesSemana.filter((a: any) => 
            !concluidasLoaded.includes(a.id) && 
            a.status !== 'concluida' && 
            (a.status === 'bloqueada' || a.status === 'em_andamento' || a.status === 'disponivel' || a.status === 'pendente')
          ) || [];

          const mappedTasks = atividadesPendentes.map((t: any) => ({
            id: t.id,
            ordem: t.ordem || 1,
            titulo: t.titulo,
            tipo: t.tipo,
            disciplina: t.disciplina || 'Geral',
            bloco: t.bloco || 'Bloco 1',
            xp: t.xp_total || 15,
            turmaNome: dataTrilha.turmaNome || '',
            status: t.status || 'pendente',
            subTarefas: []
          }));

          setCronograma({
            turmaId: turmaId,
            semana: `Semana ${semanaAtual?.semana || 1}`,
            periodo: semanaAtual?.periodo || 'Esta Semana',
            tarefas: mappedTasks
          });

          // ── "Próxima Aula" (Próximo compromisso físico ou revisão / digital) ──
          let proximaEncontrada: any = null;
          let proximaSemanaEncontrada: any = null;

          for (const s of semanas) {
            if (s.semana < (semanaAtual?.semana || 1)) continue;
            for (const a of (s.atividades || [])) {
              if (!concluidas.includes(a.id) && a.status !== 'concluida') {
                if (a.tipo === 'presencial' || a.tipo === 'aula_presencial' || a.tipo === 'revisao') {
                  proximaEncontrada = a;
                  proximaSemanaEncontrada = s;
                  break;
                }
              }
            }
            if (proximaEncontrada) break;
          }

          if (proximaEncontrada && proximaSemanaEncontrada) {
            // Usar a data_liberacao individual da atividade (dd/mm/yyyy) como data real
            const dataFormatada = proximaEncontrada.data_liberacao || proximaSemanaEncontrada.periodo?.split(' - ')[0] || '--';
            setProximaAula({
              data: dataFormatada,
              diaSemana: proximaEncontrada.dia_semana || 'Segunda',
              horario: proximaEncontrada.tipo?.includes('presencial') ? '08:00 - 12:00' : 'Disponível no Portal',
              local: proximaEncontrada.tipo?.includes('presencial') ? 'Presencial — Sede' : 'Portal Nota10 (Online)',
              blocos: [{ disciplina: proximaEncontrada.disciplina || 'Geral', bloco: proximaEncontrada.bloco || 'Bloco Atual' }]
            });
          }

          // ── Barras de Disciplina (Contagem real de blocos concluídos vs total na tabela) ──
          const todasAtividades = semanas.flatMap((s: any) => s.atividades || []);
          if (todasAtividades.length > 0) {
            const discMap = new Map<string, { total: number; completos: number }>();
            for (const ativ of todasAtividades) {
              const disc = ativ.disciplina || 'Geral';
              if (!discMap.has(disc)) discMap.set(disc, { total: 0, completos: 0 });
              const obj = discMap.get(disc)!;
              obj.total += 1;
              if (concluidasLoaded.includes(ativ.id) || ativ.status === 'concluida') {
                obj.completos += 1;
              }
            }
            const barras = Array.from(discMap.entries()).map(([disciplina, vals]) => ({
              disciplina,
              blocosTotal: vals.total || 4,
              blocosCompletos: vals.completos,
              blocoAtual: Math.min(vals.total || 4, vals.completos + 1)
            }));
            setProgressoDisciplina(barras);
          } else {
            setProgressoDisciplina([]);
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar trilha para dashboard:', e);
    }

    // 3. Fallback: Obter Próxima Aula via /api/turmas apenas se trilha não retornou proximaAula
    if (!trilhaCarregada) {
      try {
        const turmasRes = await fetch('/api/turmas');
        if (turmasRes.ok) {
          const turmasList = await turmasRes.json();
          const minhaTurma = turmasList.find((t: any) => t.id === turmaId || t.nome.includes(turmaId));
          if (minhaTurma && minhaTurma.dias && minhaTurma.dias.length > 0) {
            try {
              const diaSemana = minhaTurma.dias[0]; 
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
        console.warn('Erro ao carregar turmas fallback:', e);
      }
      setProgressoDisciplina([]);
    }

    setStreak(0);
    setConquistas(getConquistas(alunoId));
    setIsLoadingPortal(false);
    console.log('✅ [Portal] Carregamento finalizado.', { alunoId, turmaId });
  }, [alunoId, turmaId]);

  // ── Route resolver: maps task type to the appropriate portal page ─────────
  const getTaskHref = (tarefa: any): string | null => {
    const tipo = tarefa.tipo;
    const id = tarefa.id;
    if (tipo === 'videoaula' || tipo === 'preparacao') return `/portal/videoaulas/${id}`;
    if (tipo === 'questoes' || tipo === 'simulado') return '/portal/simulados';
    if (tipo === 'revisao') return '/portal/revisao';
    if (tipo === 'fixacao') return '/portal/fixacao';
    if (tipo === 'presencial' || tipo === 'aula_presencial') return null; // No link for in-person
    // Default: link to trilha
    return '/portal/trilha';
  };

  useEffect(() => {
    console.log('🚀 [Portal] useEffect disparado — iniciando loadData...');
    loadData();
    // Listen for progress updates (cross-component sync)
    window.addEventListener('nota10_progress_updated', loadData);
    return () => {
      window.removeEventListener('nota10_progress_updated', loadData);
    };
  }, [loadData]);

  // 🐛 DEBUG: Log do estado antes da renderização
  console.log('🖥️ [Portal] Estado atual do Portal:', {
    isLoadingPortal,
    dbLoaded,
    cronograma,
    proximaAula,
    nivel,
    xpTotal,
    streak,
    conquistas: conquistas?.length,
    progressoDisciplina: progressoDisciplina?.length,
    alunoId,
    turmaId,
    nomeAluno,
  });

  // Guard: Exibe spinner enquanto o carregamento inicial não termina
  if (isLoadingPortal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-[var(--color-azul-autoridade)]" size={40} />
        <p className="text-sm font-bold text-[var(--color-cinza-texto)]">Carregando portal do aluno...</p>
      </div>
    );
  }

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

      {/* ── Card de Turma Futura (quando aulas ainda não iniciaram) ── */}
      {trilhaFutura && (
        <div className="card animate-fade-in-up border-l-4 border-l-amber-400" style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)' }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center border border-amber-300">
              <CalendarDays size={28} className="text-amber-600" />
            </div>
            <div>
              <p className="font-bold text-amber-800 text-lg">Aguarde o Início das Aulas</p>
              <p className="text-sm text-amber-700 mt-0.5">{mensagemTrilha}</p>
              {dataInicioTurma && (
                <p className="text-xs font-extrabold text-amber-900 mt-2 flex items-center gap-1">
                  <CalendarDays size={12} /> Início: {new Date(dataInicioTurma + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Mensagem informativa (sem cronograma, sem matrícula) ── */}
      {!trilhaFutura && mensagemTrilha && !cronograma?.tarefas?.length && (
        <div className="card animate-fade-in-up border-l-4 border-l-blue-400">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-200">
              <BookOpen size={24} className="text-blue-500" />
            </div>
            <div>
              <p className="font-bold text-blue-800">Trilha de Estudos</p>
              <p className="text-sm text-blue-600 mt-0.5">{mensagemTrilha}</p>
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
        <p className="text-xs text-[var(--color-cinza-texto)] mb-4">
          {cronograma?.semana ?? 'Semana Atual'} • {cronograma?.periodo ?? 'Este Período'}
        </p>

        <div className="space-y-3">
          {!cronograma || !cronograma.tarefas || cronograma.tarefas.length === 0 ? (
            <div className="text-center p-8 border border-dashed border-[var(--color-cinza-borda)] rounded-xl">
              <CalendarDays size={32} className="mx-auto text-[var(--color-cinza-borda)] mb-3" />
              <p className="font-bold text-[var(--color-cinza-texto)] text-sm">Nenhuma aula agendada para esta semana</p>
              <p className="text-xs text-[var(--color-cinza-texto)] mt-1 opacity-70">O cronograma será exibido assim que atividades forem cadastradas para sua turma.</p>
            </div>
          ) : cronograma.tarefas.map((tarefa) => {
            const isDoneMain = tarefa.status === 'concluido' || concluidas.includes(tarefa.id);
            const isBloqueada = tarefa.status === 'bloqueada';
            const taskHref = getTaskHref(tarefa);

            const cardClasses = `p-4 rounded-xl border transition-all ${
              isDoneMain
                ? 'bg-[var(--color-verde-light)] border-[var(--color-verde-sucesso)]/30'
                : isBloqueada
                ? 'bg-gray-50 border-[var(--color-cinza-borda)] opacity-60'
                : tarefa.status === 'em_andamento'
                ? 'bg-[var(--color-amarelo-alerta-light)] border-[var(--color-amarelo-alerta)]/30'
                : 'bg-white border-[var(--color-cinza-borda)]'
            } ${
              !isDoneMain && !isBloqueada && taskHref
                ? 'hover:border-[var(--color-azul-autoridade)]/30 hover:shadow-sm cursor-pointer'
                : ''
            }`;

            const cardContent = (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Read-only status icon — NO click handler */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                    isDoneMain
                      ? 'bg-[var(--color-verde-sucesso)] text-white'
                      : isBloqueada
                      ? 'bg-gray-200 text-gray-400'
                      : tarefa.status === 'em_andamento'
                      ? 'bg-[var(--color-amarelo-alerta)] text-white'
                      : 'bg-[var(--color-cinza-fundo)] text-[var(--color-cinza-texto)] border border-[var(--color-cinza-borda)]'
                  }`}>
                    {isDoneMain ? <CheckCircle2 size={16} /> : isBloqueada ? <Lock size={14} /> : <Circle size={16} />}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${isDoneMain ? 'text-[var(--color-verde-sucesso)] line-through' : isBloqueada ? 'text-gray-400' : 'text-[var(--color-azul-autoridade)]'}`}>
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
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] font-bold text-[var(--color-amarelo-conquista)] flex items-center gap-0.5">
                    <Zap size={10} /> {isDoneMain ? '' : '+'}{tarefa.xp} XP
                  </span>
                  {!isDoneMain && !isBloqueada && taskHref && (
                    <ExternalLink size={12} className="text-[var(--color-cinza-texto)] opacity-50" />
                  )}
                </div>
              </div>
            );

            // Linkable items navigate to their dedicated page; blocked/completed items are static
            if (!isDoneMain && !isBloqueada && taskHref) {
              return (
                <Link key={tarefa.id} href={taskHref} className={`${cardClasses} block no-underline`}>
                  {cardContent}
                </Link>
              );
            }

            return (
              <div key={tarefa.id} className={cardClasses}>
                {cardContent}
              </div>
            );
          })}
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
