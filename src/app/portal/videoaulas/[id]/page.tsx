'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { Videoaula } from '@/lib/portalData';
import {
  ArrowLeft, CheckCircle2, Zap, Clock, Award, Flame, Loader2, Lock, AlertCircle,
} from 'lucide-react';
import CustomVideoPlayer from '@/components/portal/CustomVideoPlayer';
import Link from 'next/link';

export default function VideoaulaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const alunoId = user?.alunoId || 'a1';
  const videoId = params.id as string;

  const [video, setVideo] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Completion state from DB
  const [atividadesConcluidas, setAtividadesConcluidas] = useState<string[]>([]);

  // Celebration modal
  const [showCelebration, setShowCelebration] = useState(false);
  const [gainedXp, setGainedXp] = useState(0);
  const [newLevel, setNewLevel] = useState(0);
  const [isLvlUp, setIsLvlUp] = useState(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    async function loadVideo() {
      setIsLoading(true);
      try {
        // Load progress first
        let concluidas: string[] = [];
        try {
          const progRes = await fetch(`/api/progresso?alunoId=${alunoId}`);
          if (progRes.ok) {
            const progData = await progRes.json();
            concluidas = progData.atividadesConcluidas || [];
            setAtividadesConcluidas(concluidas);
          }
        } catch (e) {
          console.error('Erro ao carregar progresso:', e);
        }

        // Load all videos and find the one matching videoId
        const res = await fetch(`/api/conteudos?alunoId=${alunoId}&tipoConteudo=videoaula`);
        if (!res.ok) throw new Error('Falha ao carregar vídeo');

        const data = await res.json();
        const match = data.find((item: any) => item.id === videoId);

        if (!match) {
          setError('Videoaula não encontrada.');
          setIsLoading(false);
          return;
        }

        // Check if it's a locked/future video (server-side drip gating)
        if (match.bloqueado) {
          setError('bloqueado');
          setVideo(match);
          setIsLoading(false);
          return;
        }

        // Parse extra metadata from descricao JSON
        let extra = {
          bloco: 'Bloco 1',
          duracao: '15:00',
          xp: 15,
          videoSource: 'youtube',
          thumbnailColor: match.disciplina === 'Português' ? '#8B5CF6' : '#F59E0B',
        };
        if (match.descricao) {
          try { extra = { ...extra, ...JSON.parse(match.descricao) }; } catch {}
        }

        setVideo({
          id: match.id,
          titulo: match.titulo,
          disciplina: match.disciplina,
          bloco: extra.bloco,
          duracao: extra.duracao,
          status: concluidas.includes(match.id) ? 'assistido' : 'disponivel',
          xp: extra.xp,
          thumbnailColor: extra.thumbnailColor,
          videoSource: extra.videoSource,
          videoUrl: match.urlAcesso,
          turmaNome: match.turmaNome || '',
        });
      } catch (err: any) {
        console.error('Erro ao carregar videoaula:', err);
        setError(err.message || 'Erro ao carregar a videoaula.');
      } finally {
        setIsLoading(false);
      }
    }

    if (videoId) loadVideo();
  }, [videoId, alunoId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-[var(--color-azul-autoridade)]" size={40} />
        <p className="text-sm font-bold text-[var(--color-cinza-texto)]">Carregando videoaula...</p>
      </div>
    );
  }

  // Blocked video — show lock screen
  if (error === 'bloqueado' && video) {
    const dataLib = video.dataDisponibilizacao
      ? new Date(video.dataDisponibilizacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
      : null;
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/portal/videoaulas"
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-azul-autoridade)] hover:underline"
        >
          <ArrowLeft size={16} /> Voltar às Videoaulas
        </Link>
        <div className="card text-center p-12 border-2 border-amber-300 bg-gradient-to-b from-amber-50 to-white">
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4 border-2 border-amber-300">
            <Lock size={36} className="text-amber-600" />
          </div>
          <h2 className="text-xl font-black text-[var(--color-azul-autoridade)] mb-2">{video.titulo}</h2>
          <p className="text-sm text-[var(--color-cinza-texto)] mb-4">
            {video.disciplina}
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 text-sm font-bold">
            <Lock size={14} />
            {dataLib ? `Disponível em ${dataLib}` : 'Conteúdo ainda não liberado'}
          </div>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/portal/videoaulas"
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-azul-autoridade)] hover:underline"
        >
          <ArrowLeft size={16} /> Voltar às Videoaulas
        </Link>
        <div className="card text-center p-12 border-dashed border-2">
          <AlertCircle size={48} className="mx-auto text-[var(--color-cinza-texto)] mb-4" />
          <h3 className="text-lg font-bold text-[var(--color-azul-autoridade)]">{error || 'Videoaula não encontrada'}</h3>
          <p className="text-sm text-[var(--color-cinza-texto)] mt-2">Verifique se o link está correto ou volte à lista de videoaulas.</p>
        </div>
      </div>
    );
  }

  const isCompleted = atividadesConcluidas.includes(video.id) || video.status === 'assistido';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back navigation */}
      <Link
        href="/portal/videoaulas"
        className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-azul-autoridade)] hover:underline"
      >
        <ArrowLeft size={16} /> Voltar às Videoaulas
      </Link>

      {/* Video header */}
      <div className="card overflow-hidden">
        <div className="bg-[var(--color-azul-autoridade)] text-white px-5 py-4 -mx-5 -mt-5 mb-4">
          <h1 className="text-lg font-black text-white m-0">{video.titulo}</h1>
          <p className="text-xs text-white/60 m-0 mt-1">
            {video.disciplina} • {video.bloco}
            {video.turmaNome && ` • ${video.turmaNome}`}
          </p>
        </div>

        {/* Video player — XP is ONLY granted here via player/complete */}
        <div className="bg-[var(--color-cinza-fundo)] -mx-5 mb-4">
          <CustomVideoPlayer
            conteudoId={video.id}
            videoUrl={video.videoUrl || 'local'}
            xpVal={video.xp || 15}
            onComplete={(xpGanho, leveledUp, novoNivel, success = true, errorMsg) => {
              if (!success) {
                setToast(errorMsg || 'Erro ao salvar progresso. Tente novamente.');
                return;
              }
              setGainedXp(xpGanho);
              setIsLvlUp(leveledUp);
              setNewLevel(novoNivel);

              setAtividadesConcluidas(prev => Array.from(new Set([...prev, video.id])));

              if (xpGanho > 0) {
                setShowCelebration(true);
                setToast(`+${xpGanho} XP!`);
              } else {
                setToast('Vídeo concluído!');
              }
              window.dispatchEvent(new Event('nota10_progress_updated'));
            }}
          />
        </div>

        {/* XP status bar */}
        <div className="flex items-center justify-between px-1 pb-1">
          <div className="flex items-center gap-1">
            <Zap size={14} className="text-[var(--color-amarelo-conquista)]" fill="currentColor" />
            <span className="text-xs font-bold text-[var(--color-cinza-escuro)]">
              {isCompleted ? 'XP já concedido' : `Assista até o fim para ganhar +${video.xp || 15} XP`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold">
            {isCompleted ? (
              <span className="flex items-center gap-1 text-[var(--color-verde-sucesso)] font-black">
                <CheckCircle2 size={16} /> Concluído
              </span>
            ) : (
              <span className="text-[var(--color-cinza-texto)] flex items-center gap-1.5">
                <Clock size={14} className="text-[var(--color-azul-autoridade)]" />
                Conclusão automática ao término do vídeo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CELEBRATION MODAL */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs" onClick={() => setShowCelebration(false)} />
          <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-[var(--color-amarelo-conquista)]/30 animate-[celebrate_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards]">
            <div className="w-20 h-20 bg-[var(--color-amarelo-conquista)]/15 border-2 border-[var(--color-amarelo-conquista)] rounded-full flex items-center justify-center mx-auto mb-4">
              <Award size={42} className="text-[var(--color-amarelo-conquista)] animate-bounce" />
            </div>

            <h3 className="text-xl font-black text-[var(--color-azul-autoridade)] mb-1">
              Excelente Trabalho! 🎉
            </h3>
            <p className="text-xs text-[var(--color-cinza-texto)] font-bold mb-4 uppercase tracking-wider">Atividade Concluída</p>

            <div className="bg-[var(--color-azul-lightest)] rounded-2xl p-4 border border-[var(--color-azul-light)]/40 mb-6">
              <p className="text-2xl font-black text-[var(--color-azul-autoridade)] flex items-center justify-center gap-1">
                <Zap size={22} className="text-[var(--color-amarelo-conquista)]" fill="currentColor" />
                +{gainedXp} XP
              </p>
              <p className="text-[10px] text-[var(--color-cinza-texto)] mt-1">XP adicionado ao perfil de {user?.alunoNome}</p>
            </div>

            {isLvlUp && (
              <div className="bg-amber-100/70 border border-amber-300 rounded-2xl p-4 mb-6 flex items-center justify-center gap-3 animate-pulse">
                <Flame size={28} className="text-orange-500" />
                <div className="text-left">
                  <p className="text-sm font-black text-amber-900 leading-tight">Subiu de Nível! 👑</p>
                  <p className="text-[10px] text-amber-800">Agora você é Nível {newLevel}</p>
                </div>
              </div>
            )}

            <button onClick={() => setShowCelebration(false)} className="btn btn-primary w-full py-3">
              Sensacional! Continuar Estudando
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
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
