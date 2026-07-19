'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Loader2, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface CustomVideoPlayerProps {
  conteudoId: string;
  videoUrl: string;
  xpVal: number;
  onComplete: (xpGanho: number, leveledUp: boolean, newLevel: number) => void;
}

export default function CustomVideoPlayer({ conteudoId, videoUrl, xpVal, onComplete }: CustomVideoPlayerProps) {
  const { user } = useAuth();
  const alunoId = user?.alunoId || 'a1';
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

  // 1. Initial State Fetch
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    async function loadState() {
      try {
        const res = await fetch(`/api/player?alunoId=${alunoId}&conteudoId=${conteudoId}`);
        if (res.ok) {
          const data = await res.json();
          if (videoRef.current && data.current_time_seconds) {
            videoRef.current.currentTime = parseFloat(data.current_time_seconds);
          }
          if (data.status === 'completed') {
            setIsCompleted(true);
          }
        }
      } catch (err) {
        console.error('Error loading video state:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadState();
    loadComments();

    // 2. Heartbeat (every 5 seconds)
    interval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        const ct = videoRef.current.currentTime;
        const dur = videoRef.current.duration;
        if (!isNaN(ct) && !isNaN(dur)) {
          fetch('/api/player', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alunoId, conteudoId, currentTime: ct, duration: dur })
          }).catch(e => console.error('Heartbeat falhou:', e));
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [alunoId, conteudoId]);

  async function loadComments() {
    try {
      const res = await fetch(`/api/player/comentarios?conteudoId=${conteudoId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // 3. Prevent Skip
  const [lastTime, setLastTime] = useState(0);
  
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    
    // Anti-skip logic
    if (!isCompleted && current > lastTime + 5) {
      // Se avançou subitamente, volta
      videoRef.current.currentTime = lastTime;
    } else {
      setLastTime(current);
    }
  };

  const handleEnded = async () => {
    if (isCompleted) return;
    try {
      const res = await fetch('/api/player/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alunoId, conteudoId })
      });
      if (res.ok) {
        const data = await res.json();
        setIsCompleted(true);
        if (data.success && data.xpGanho > 0) {
          onComplete(data.xpGanho, data.leveledUp, data.novoNivel);
        }
      }
    } catch (e) {
      console.error('Erro ao completar vídeo', e);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await fetch('/api/player/comentarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alunoId, conteudoId, texto: newComment })
      });
      if (res.ok) {
        setNewComment('');
        loadComments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="relative bg-black aspect-video rounded-xl overflow-hidden group">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80">
            <Loader2 className="animate-spin text-white w-8 h-8" />
          </div>
        )}
        
        {/* Usamos controlsList="nodownload noplaybackrate" e ocultamos controles nativos 
            para ter total controle sobre avançar/voltar. */}
        <video 
          ref={videoRef}
          src={videoUrl === 'local' ? '/aula_local.mp4' : videoUrl} 
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          controls={false}
          disablePictureInPicture
        />
        
        {/* Custom Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="text-white hover:text-[var(--color-amarelo-conquista)] transition-colors">
              {isPlaying ? <Pause size={28} /> : <Play size={28} />}
            </button>
            <div className="flex-1">
               <div className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden relative">
                 <div 
                   className="absolute top-0 left-0 h-full bg-[var(--color-amarelo-conquista)] transition-all"
                   style={{ width: \`\${videoRef.current ? (lastTime / (videoRef.current.duration || 1)) * 100 : 0}%\` }}
                 />
               </div>
            </div>
            <div className="text-white text-xs font-mono">
               Avanço desabilitado
            </div>
          </div>
        </div>
      </div>

      {/* Comentários Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-[var(--color-cinza-borda)]">
        <h4 className="text-lg font-bold text-[var(--color-azul-autoridade)] flex items-center gap-2 mb-4">
          <MessageSquare size={20} />
          Dúvidas e Comentários
        </h4>
        
        <form onSubmit={submitComment} className="flex gap-2 mb-6">
          <input 
            type="text" 
            placeholder="Deixe seu comentário ou dúvida..." 
            className="flex-1 input"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={!newComment.trim()}>Enviar</button>
        </form>

        <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
          {comments.map(c => (
            <div key={c.id} className="bg-[var(--color-cinza-fundo)] p-3 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[var(--color-azul-autoridade)]">{c.aluno_nome}</span>
                <span className="text-[10px] text-[var(--color-cinza-texto)]">{new Date(c.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
              <p className="text-sm text-[var(--color-cinza-escuro)]">{c.texto}</p>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-center text-sm text-[var(--color-cinza-texto)] py-4">Nenhum comentário ainda. Seja o primeiro!</p>
          )}
        </div>
      </div>
    </div>
  );
}
