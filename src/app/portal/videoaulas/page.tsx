'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { Videoaula } from '@/lib/portalData';
import { PlayCircle, CheckCircle2, Lock, Zap, Clock, Play, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function VideoaulasPage() {
  const { user } = useAuth();
  const alunoId = user?.alunoId || 'a1';
  
  const [videoaulas, setVideoaulas] = useState<Videoaula[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // DB-driven completion state
  const [atividadesConcluidas, setAtividadesConcluidas] = useState<string[]>([]);

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

          // Server-driven drip content: bloqueado flag comes from backend.
          // No client-side date comparison — the server is the source of truth.
          let videoStatus: string;
          if (completed) {
            videoStatus = 'assistido';
          } else if (item.bloqueado) {
            videoStatus = 'bloqueado';
          } else {
            videoStatus = 'disponivel';
          }

          // Format the release date for display on locked items
          let dataLiberacao: string | null = null;
          if (item.bloqueado && item.dataDisponibilizacao) {
            const dt = new Date(item.dataDisponibilizacao);
            if (!isNaN(dt.getTime())) {
              dataLiberacao = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            }
          }
 
          return {
            id: item.id,
            titulo: item.titulo,
            disciplina: item.disciplina,
            bloco: extra.bloco,
            duracao: extra.duracao,
            status: videoStatus,
            xp: extra.xp,
            thumbnailColor: extra.thumbnailColor,
            videoSource: extra.videoSource,
            videoUrl: item.urlAcesso,
            turmaNome: item.turmaNome || '',
            dataLiberacao,
          } as any;
        });
        setVideoaulas(formatted);
      }
    } catch (err) {
      console.error('Erro ao carregar videoaulas:', err);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    const list = await loadProgresso();
    await loadVideos(list);
    setIsLoading(false);
  };

  useEffect(() => {
    if (user?.turmaId) {
      loadData();
    }
    
    const handleProgressUpdate = () => { loadData(); };
    window.addEventListener('nota10_progress_updated', handleProgressUpdate);
    return () => {
      window.removeEventListener('nota10_progress_updated', handleProgressUpdate);
    };
  }, [alunoId, user?.turmaId]);

  const disciplinas = Array.from(new Set(videoaulas.map(v => v.disciplina || 'Outros'))).sort((a, b) => {
    if (a === 'Introdução') return -1;
    if (b === 'Introdução') return 1;
    return a.localeCompare(b);
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <Loader2 className="animate-spin text-[var(--color-azul-autoridade)]" size={32} />
        <p className="text-sm font-bold text-[var(--color-cinza-texto)]">Carregando videoaulas...</p>
      </div>
    );
  }

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
        const assistidos = videos.filter(v => atividadesConcluidas.includes(v.id) || v.status === 'assistido').length;
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

            {/* Video Grid — each card is now a Link to /portal/videoaulas/[id] */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video) => {
                const completed = atividadesConcluidas.includes(video.id) || video.status === 'assistido';
                const isBlocked = video.status === 'bloqueado';

                const cardContent = (
                  <>
                    {/* Thumbnail */}
                    <div
                      className="h-28 -mx-5 -mt-5 mb-4 flex items-center justify-center relative bg-gradient-to-b from-black/20 to-black/60"
                      style={{ backgroundColor: video.thumbnailColor }}
                    >
                      {completed ? (
                        <CheckCircle2 size={36} className="text-white drop-shadow-md" />
                      ) : isBlocked ? (
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
                      {isBlocked && (
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
                    {isBlocked && video.dataLiberacao && (
                      <p className="text-[10px] font-bold text-amber-600 mb-1.5 flex items-center gap-1">
                        <Lock size={9} /> Disponível em {video.dataLiberacao}
                      </p>
                    )}
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
                  </>
                );

                // Blocked items render as non-clickable divs, available items navigate to detail page
                if (isBlocked) {
                  return (
                    <div
                      key={video.id}
                      className="card overflow-hidden transition-all opacity-40 grayscale cursor-not-allowed"
                    >
                      {cardContent}
                    </div>
                  );
                }

                return (
                  <Link
                    key={video.id}
                    href={`/portal/videoaulas/${video.id}`}
                    className="card overflow-hidden transition-all hover:shadow-md cursor-pointer hover:border-[var(--color-azul-autoridade)]/30 block no-underline"
                  >
                    {cardContent}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
