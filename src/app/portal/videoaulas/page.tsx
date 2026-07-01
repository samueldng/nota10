'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getVideoaulas, completeTask, isItemCompleted } from '@/lib/portalData';
import type { Videoaula } from '@/lib/portalData';
import { PlayCircle, CheckCircle2, Lock, Zap, Clock, X, Award, Flame, Play } from 'lucide-react';

export default function VideoaulasPage() {
  const { user } = useAuth();
  const alunoId = user?.alunoId || 'a1';
  
  const [videoaulas, setVideoaulas] = useState<Videoaula[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Videoaula | null>(null);
  
  // Celebration modal state
  const [showCelebration, setShowCelebration] = useState(false);
  const [gainedXp, setGainedXp] = useState(0);
  const [newLevel, setNewLevel] = useState(0);
  const [isLvlUp, setIsLvlUp] = useState(false);

  const loadVideos = () => {
    setVideoaulas(getVideoaulas(alunoId));
  };

  useEffect(() => {
    loadVideos();
    
    // Listen for progress updates
    window.addEventListener('nota10_progress_updated', loadVideos);
    return () => {
      window.removeEventListener('nota10_progress_updated', loadVideos);
    };
  }, [alunoId]);

  const handleOpenVideo = (video: Videoaula) => {
    if (video.status === 'bloqueado') return;
    setSelectedVideo(video);
  };

  const handleSimulateWatch = () => {
    if (!selectedVideo) return;
    
    const wasCompleted = isItemCompleted(alunoId, selectedVideo.id);
    if (!wasCompleted) {
      // Complete video task and get XP
      const res = completeTask(alunoId, selectedVideo.id, selectedVideo.xp);
      
      setGainedXp(selectedVideo.xp);
      setIsLvlUp(res.leveledUp);
      setNewLevel(res.newLevel);
      setShowCelebration(true);
    }
    
    setSelectedVideo(null);
    loadVideos();
  };

  // Extrair ID do youtube se houver
  const getYoutubeEmbedUrl = (url: string) => {
    let videoId = '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      videoId = match[2];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
  };

  const disciplinas = ['Português', 'Matemática'];

  return (
    <div className="max-w-5xl mx-auto space-y-8 relative">
      {disciplinas.map((disciplina) => {
        const videos = videoaulas.filter(v => v.disciplina === disciplina);
        const assistidos = videos.filter(v => isItemCompleted(alunoId, v.id)).length;
        const total = videos.length;
        const progresso = total > 0 ? Math.round((assistidos / total) * 100) : 0;

        return (
          <div key={disciplina} className="animate-fade-in-up">
            {/* Discipline Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--color-azul-autoridade)]">{disciplina}</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[var(--color-cinza-texto)]">{assistidos}/{total} concluídos</span>
                <div className="w-32 h-2.5 bg-[var(--color-cinza-fundo)] rounded-full overflow-hidden border border-[var(--color-cinza-borda)]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progresso}%`,
                      background: disciplina === 'Português' ? 'linear-gradient(90deg, #3B82F6, #8B5CF6)' : 'linear-gradient(90deg, #22C55E, #14B8A6)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Video Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video) => {
                const completed = isItemCompleted(alunoId, video.id);
                return (
                  <div
                    key={video.id}
                    onClick={() => handleOpenVideo(video)}
                    className={`card overflow-hidden transition-all ${
                      video.status === 'bloqueado'
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:shadow-md cursor-pointer hover:border-[var(--color-azul-autoridade)]/30'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div
                      className="h-28 -mx-5 -mt-5 mb-4 flex items-center justify-center relative bg-gradient-to-b from-black/20 to-black/60"
                      style={{ backgroundColor: video.thumbnailColor }}
                    >
                      {completed ? (
                        <CheckCircle2 size={36} className="text-white drop-shadow-md" />
                      ) : video.status === 'bloqueado' ? (
                        <Lock size={36} className="text-white/50" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all">
                          <Play size={20} className="text-white fill-white ml-0.5" />
                        </div>
                      )}
                      
                      {completed && (
                        <span className="absolute top-2 right-2 bg-[var(--color-verde-sucesso)] text-white text-[9px] font-black px-2.5 py-0.5 rounded-lg shadow-sm">
                          ✓ Concluído
                        </span>
                      )}
                      {video.status === 'bloqueado' && (
                        <span className="absolute top-2 right-2 bg-black/50 text-white/80 text-[9px] font-black px-2.5 py-0.5 rounded-lg shadow-sm">
                          🔒 Bloqueado
                        </span>
                      )}
                      {video.status === 'disponivel' && !completed && (
                        <span className="absolute top-2 right-2 bg-[var(--color-amarelo-conquista)] text-[var(--color-azul-autoridade)] text-[9px] font-black px-2.5 py-0.5 rounded-lg shadow-sm">
                          Novo
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <h4 className="text-sm font-bold text-[var(--color-azul-autoridade)] mb-1.5 leading-tight truncate">
                      {video.titulo}
                    </h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-cinza-texto)]">
                        <span className="flex items-center gap-0.5"><Clock size={10} /> {video.duracao}</span>
                        <span className="badge badge-info text-[9px] py-0">{video.bloco}</span>
                      </div>
                      <span className="text-[10px] font-black text-[var(--color-amarelo-conquista)] flex items-center gap-0.5">
                        <Zap size={9} fill="currentColor" /> +{video.xp} XP
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* VIDEO PLAYER MODAL */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setSelectedVideo(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-fade-in-up">
            <div className="bg-[var(--color-azul-autoridade)] text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white m-0 truncate max-w-xl">{selectedVideo.titulo}</h4>
                <p className="text-[10px] text-white/60 m-0 mt-0.5">{selectedVideo.disciplina} • {selectedVideo.bloco}</p>
              </div>
              <button onClick={() => setSelectedVideo(null)} className="p-1 hover:bg-white/10 rounded-lg text-white/80 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Video container */}
            <div className="bg-black aspect-video flex items-center justify-center">
              {selectedVideo.videoSource === 'youtube' && selectedVideo.videoUrl ? (
                <iframe
                  className="w-full h-full"
                  src={getYoutubeEmbedUrl(selectedVideo.videoUrl)}
                  title={selectedVideo.titulo}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="text-center p-10 space-y-4">
                  <PlayCircle size={48} className="text-white/60 mx-auto animate-pulse" />
                  <div>
                    <p className="text-sm font-bold text-white">Simulador de Vídeo Local</p>
                    <p className="text-xs text-white/50">Reproduzindo: {selectedVideo.videoUrl || 'aula_local.mp4'}</p>
                  </div>
                  <div className="w-16 h-1 bg-white/20 mx-auto rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--color-amarelo-conquista)] animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Actions / XP award */}
            <div className="p-4 bg-gray-50 flex items-center justify-between border-t border-[var(--color-cinza-borda)]">
              <div className="flex items-center gap-1">
                <Zap size={14} className="text-[var(--color-amarelo-conquista)]" fill="currentColor" />
                <span className="text-xs font-bold text-[var(--color-cinza-escuro)]">Assista até o fim para ganhar +{selectedVideo.xp} XP</span>
              </div>
              <button onClick={handleSimulateWatch} className="btn btn-primary text-xs py-2 px-4 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Concluir e Ganhar XP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREMIUM CELEBRATION MODAL */}
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
    </div>
  );
}
