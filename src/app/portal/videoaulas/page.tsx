'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { Videoaula } from '@/lib/portalData';
import { PlayCircle, CheckCircle2, Lock, Zap, Clock, X, Award, Flame, Play, Loader2 } from 'lucide-react';
import CustomVideoPlayer from '@/components/portal/CustomVideoPlayer';

export default function VideoaulasPage() {
  const { user } = useAuth();
  const alunoId = user?.alunoId || 'a1';
  
  const [videoaulas, setVideoaulas] = useState<Videoaula[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Videoaula | null>(null);
  
  // DB-driven completion state
  const [atividadesConcluidas, setAtividadesConcluidas] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Celebration modal state
  const [showCelebration, setShowCelebration] = useState(false);
  const [gainedXp, setGainedXp] = useState(0);
  const [newLevel, setNewLevel] = useState(0);
  const [isLvlUp, setIsLvlUp] = useState(false);

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

  const loadVideos = async (completedList: string[]) => {
    try {
      const res = await fetch(`/api/conteudos?alunoId=${alunoId}&tipoConteudo=videoaula`);
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map((item: any) => {
          let extra = {
            bloco: 'Bloco 1',
            duracao: '15:00',
            xp: 15,
            videoSource: 'youtube',
            thumbnailColor: item.disciplina === 'Português' ? '#8B5CF6' : '#F59E0B'
          };
          if (item.descricao) {
            try {
              extra = { ...extra, ...JSON.parse(item.descricao) };
            } catch (e) {}
          }
          
          const completed = completedList.includes(item.id);
 
          return {
            id: item.id,
            titulo: item.titulo,
            disciplina: item.disciplina,
            bloco: extra.bloco,
            duracao: extra.duracao,
            status: completed ? 'assistido' : 'disponivel',
            xp: extra.xp,
            thumbnailColor: extra.thumbnailColor,
            videoSource: extra.videoSource,
            videoUrl: item.urlAcesso,
            turmaNome: item.turmaNome || '',
          } as any;
        });
        setVideoaulas(formatted);
      }
    } catch (err) {
      console.error('Erro ao carregar videoaulas:', err);
    }
  };

  const loadData = async () => {
    const list = await loadProgresso();
    await loadVideos(list);
  };

  useEffect(() => {
    if (user?.turmaId) {
      loadData();
    }
    
    // Listen for progress updates
    const handleProgressUpdate = () => {
      loadData();
    };
    window.addEventListener('nota10_progress_updated', handleProgressUpdate);
    return () => {
      window.removeEventListener('nota10_progress_updated', handleProgressUpdate);
    };
  }, [alunoId, user?.turmaId]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleOpenVideo = (video: Videoaula) => {
    if (video.status === 'bloqueado') return;
    setSelectedVideo(video);
  };

  const disciplinas = Array.from(new Set(videoaulas.map(v => v.disciplina || 'Outros'))).sort((a, b) => {
    // Custom sort to always put 'Introdução' first
    if (a === 'Introdução') return -1;
    if (b === 'Introdução') return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 relative">
      {disciplinas.length === 0 && (
        <div className="text-center p-12 card border-dashed border-2 bg-[var(--color-cinza-fundo)]">
          <PlayCircle size={48} className="mx-auto text-[var(--color-cinza-texto)] mb-4" />
          <h3 className="text-lg font-bold text-[var(--color-azul-autoridade)]">Nenhuma videoaula disponível</h3>
          <p className="text-sm text-[var(--color-cinza-texto)]">Nenhum conteúdo foi liberado para sua turma no momento.</p>
        </div>
      )}
      {disciplinas.map((disciplina) => {
        const videos = videoaulas.filter(v => v.disciplina === disciplina);
        const assistidos = videos.filter(v => atividadesConcluidas.includes(v.id)).length;
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
                const completed = atividadesConcluidas.includes(video.id);
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
                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-cinza-texto)] flex-wrap">
                        <span className="flex items-center gap-0.5"><Clock size={10} /> {video.duracao}</span>
                        <span className="badge badge-info text-[9px] py-0">{video.bloco}</span>
                        {video.turmaNome && (
                          <span className="px-1.5 py-0.5 rounded bg-[var(--color-azul-lightest)] text-[var(--color-azul-autoridade)] text-[8px] font-black uppercase tracking-wider">
                            {video.turmaNome}
                          </span>
                        )}
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
                <p className="text-[10px] text-white/60 m-0 mt-0.5">
                  {selectedVideo.disciplina} • {selectedVideo.bloco}
                  {selectedVideo.turmaNome && ` • ${selectedVideo.turmaNome}`}
                </p>
              </div>
              <button onClick={() => setSelectedVideo(null)} className="p-1 hover:bg-white/10 rounded-lg text-white/80 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Video container */}
            <div className="bg-[var(--color-cinza-fundo)]">
              <CustomVideoPlayer 
                conteudoId={selectedVideo.id}
                videoUrl={selectedVideo.videoUrl || 'local'}
                xpVal={selectedVideo.xp || 15}
                onComplete={(xpGanho, leveledUp, novoNivel) => {
                  setGainedXp(xpGanho);
                  setIsLvlUp(leveledUp);
                  setNewLevel(novoNivel);
                  setSelectedVideo(null); // Fecha o modal silenciosamente ao concluir
                  if (xpGanho > 0) {
                    setShowCelebration(true);
                    setToast(`+${xpGanho} XP!`);
                  }
                  window.dispatchEvent(new Event('nota10_progress_updated'));
                  loadData();
                }}
              />
            </div>

            {/* Actions / XP status */}
            <div className="p-4 bg-gray-50 flex items-center justify-between border-t border-[var(--color-cinza-borda)]">
              <div className="flex items-center gap-1">
                <Zap size={14} className="text-[var(--color-amarelo-conquista)]" fill="currentColor" />
                <span className="text-xs font-bold text-[var(--color-cinza-escuro)]">
                  Assista até o fim para ganhar +{selectedVideo.xp || 15} XP
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold">
                {atividadesConcluidas.includes(selectedVideo.id) ? (
                  <span className="flex items-center gap-1 text-[var(--color-verde-sucesso)] font-black">
                    <CheckCircle2 size={16} /> Concluído
                  </span>
                ) : (
                  <span className="text-[var(--color-cinza-texto)] flex items-center gap-1.5">
                    <Clock size={14} className="text-[var(--color-azul-autoridade)]" />
                    <span>Conclusão automática ao término do vídeo</span>
                  </span>
                )}
              </div>
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
