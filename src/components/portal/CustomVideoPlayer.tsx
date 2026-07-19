'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Loader2, Maximize, Minimize, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import VideoComments from '@/components/portal/VideoComments';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface CustomVideoPlayerProps {
  conteudoId: string;
  videoUrl: string;
  xpVal: number;
  onComplete: (xpGanho: number, leveledUp: boolean, newLevel: number) => void;
}

const getYoutubeVideoId = (url: string) => {
  if (!url || url === 'local') return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function CustomVideoPlayer({ conteudoId, videoUrl, xpVal, onComplete }: CustomVideoPlayerProps) {
  const { user } = useAuth();
  const alunoId = user?.alunoId || 'a1';
  
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const lastTimeRef = useRef<number>(0);
  const onCompleteCalledRef = useRef<boolean>(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastTime, setLastTime] = useState(0);
  const [ytProgress, setYtProgress] = useState(0);
  const [volume, setVolume] = useState(100);

  const ytId = getYoutubeVideoId(videoUrl);
  const isYoutube = Boolean(ytId);

  // 1. Initial State Fetch and Heartbeat
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    async function loadState() {
      try {
        const res = await fetch(`/api/player?alunoId=${alunoId}&conteudoId=${conteudoId}`);
        if (res.ok) {
          const data = await res.json();
          const initialTime = parseFloat(data.current_time_seconds || 0);
          if (!isNaN(initialTime) && initialTime > 0) {
            lastTimeRef.current = initialTime;
            setLastTime(initialTime);
            if (videoRef.current) {
              videoRef.current.currentTime = initialTime;
            }
            if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
              ytPlayerRef.current.seekTo(initialTime, true);
            }
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

    // 2. Heartbeat (every 5 seconds)
    interval = setInterval(() => {
      let ct = 0;
      let dur = 0;
      let active = false;

      if (isYoutube && ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
        const state = ytPlayerRef.current.getPlayerState ? ytPlayerRef.current.getPlayerState() : -1;
        // YT.PlayerState.PLAYING = 1
        if (state === 1) {
          ct = ytPlayerRef.current.getCurrentTime();
          dur = ytPlayerRef.current.getDuration() || 0;
          active = true;
        }
      } else if (!isYoutube && videoRef.current && !videoRef.current.paused) {
        ct = videoRef.current.currentTime;
        dur = videoRef.current.duration || 0;
        active = true;
      }

      if (active && !isNaN(ct) && !isNaN(dur) && dur > 0) {
        fetch('/api/player', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alunoId, conteudoId, currentTime: ct, duration: dur })
        }).catch(e => console.error('Heartbeat falhou:', e));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [alunoId, conteudoId, isYoutube]);

  // YouTube IFrame API Initialization
  useEffect(() => {
    if (!isYoutube || !ytId) return;

    let isMounted = true;
    let checkInterval: NodeJS.Timeout | null = null;

    const initPlayer = () => {
      if (!isMounted || !ytContainerRef.current || !window.YT || !window.YT.Player) return;

      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {}
      }

      ytPlayerRef.current = new window.YT.Player(ytContainerRef.current, {
        videoId: ytId,
        playerVars: {
          controls: 0,
          disablekb: 1,
          rel: 0,
          modestbranding: 1,
          autoplay: 1,
          playsinline: 1,
          fs: 1,
        },
        events: {
          onReady: (event: any) => {
            if (!isMounted) return;
            ytPlayerRef.current = event.target;
            if (lastTimeRef.current > 0) {
              event.target.seekTo(lastTimeRef.current, true);
            }
            event.target.playVideo();
          },
          onStateChange: (event: any) => {
            if (!isMounted) return;
            // YT.PlayerState.ENDED = 0, PLAYING = 1, PAUSED = 2
            if (event.data === 0) {
              handleEnded();
            } else if (event.data === 1) {
              setIsPlaying(true);
            } else if (event.data === 2) {
              setIsPlaying(false);
            }
          }
        }
      });
    };

    if (!window.YT || !window.YT.Player) {
      if (!document.getElementById('youtube-iframe-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        if (firstScriptTag && firstScriptTag.parentNode) {
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
          document.head.appendChild(tag);
        }
      }

      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevReady) prevReady();
        initPlayer();
      };

      checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          if (checkInterval) clearInterval(checkInterval);
          initPlayer();
        }
      }, 100);
    } else {
      initPlayer();
    }

    return () => {
      isMounted = false;
      if (checkInterval) clearInterval(checkInterval);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {}
      }
      ytPlayerRef.current = null;
    };
  }, [isYoutube, ytId]);

  // Anti-skip logic for YouTube (polling progress every 500ms)
  useEffect(() => {
    if (!isYoutube) return;
    const interval = setInterval(() => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
        const current = ytPlayerRef.current.getCurrentTime();
        const duration = ytPlayerRef.current.getDuration() || 1;
        const state = ytPlayerRef.current.getPlayerState ? ytPlayerRef.current.getPlayerState() : -1;

        if (state === 1 && !isNaN(current)) {
          if (!isCompleted && current > lastTimeRef.current + 5 && lastTimeRef.current > 0) {
            ytPlayerRef.current.seekTo(lastTimeRef.current, true);
          } else {
            lastTimeRef.current = current;
            setLastTime(current);
            setYtProgress((current / duration) * 100);
          }
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isYoutube, isCompleted]);

  // Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = Boolean(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFull);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Anti-skip logic for HTML5 video
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    
    if (!isCompleted && current > lastTimeRef.current + 5 && lastTimeRef.current > 0) {
      videoRef.current.currentTime = lastTimeRef.current;
    } else {
      lastTimeRef.current = current;
      setLastTime(current);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (isYoutube && ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      if (val === 0) {
        ytPlayerRef.current.mute();
      } else {
        if (ytPlayerRef.current.isMuted && ytPlayerRef.current.isMuted()) {
          ytPlayerRef.current.unMute();
        }
        ytPlayerRef.current.setVolume(val);
      }
    } else if (!isYoutube && videoRef.current) {
      videoRef.current.volume = val / 100;
      videoRef.current.muted = val === 0;
    }
  };

  const toggleMute = () => {
    if (volume === 0) {
      setVolume(100);
      if (isYoutube && ytPlayerRef.current && typeof ytPlayerRef.current.unMute === 'function') {
        ytPlayerRef.current.unMute();
        ytPlayerRef.current.setVolume(100);
      } else if (!isYoutube && videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.volume = 1;
      }
    } else {
      setVolume(0);
      if (isYoutube && ytPlayerRef.current && typeof ytPlayerRef.current.mute === 'function') {
        ytPlayerRef.current.mute();
      } else if (!isYoutube && videoRef.current) {
        videoRef.current.muted = true;
      }
    }
  };

  const handleEnded = async () => {
    if (isCompleted && !onCompleteCalledRef.current) {
      onCompleteCalledRef.current = true;
      onComplete(0, false, 0);
      return;
    }
    if (onCompleteCalledRef.current) return;
    
    try {
      onCompleteCalledRef.current = true;
      let dur = 100;
      if (isYoutube && ytPlayerRef.current && typeof ytPlayerRef.current.getDuration === 'function') {
        dur = ytPlayerRef.current.getDuration() || 100;
      } else if (!isYoutube && videoRef.current) {
        dur = videoRef.current.duration || 100;
      }

      const res = await fetch('/api/player/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          alunoId, 
          conteudoId, 
          completed: true, 
          currentTime: dur, 
          duration: dur 
        })
      });
      if (res.ok) {
        const data = await res.json();
        setIsCompleted(true);
        if (data.success) {
          onComplete(data.xpGanho || 0, data.leveledUp || false, data.novoNivel || 0);
        } else {
          onComplete(0, false, 0);
        }
      } else {
        onComplete(0, false, 0);
      }
    } catch (e) {
      console.error('Erro ao completar vídeo', e);
      onComplete(0, false, 0);
    }
  };

  const togglePlay = () => {
    if (isYoutube) {
      if (!ytPlayerRef.current || typeof ytPlayerRef.current.getPlayerState !== 'function') return;
      const state = ytPlayerRef.current.getPlayerState();
      if (state === 1) {
        ytPlayerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      }
    } else {
      if (!videoRef.current) return;
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;

    const isFull = Boolean(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );

    if (!isFull) {
      const el = playerContainerRef.current as any;
      if (el.requestFullscreen) {
        el.requestFullscreen().catch((err: any) => console.error(err));
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      } else if (el.mozRequestFullScreen) {
        el.mozRequestFullScreen();
      } else if (el.msRequestFullscreen) {
        el.msRequestFullscreen();
      }
    } else {
      const doc = document as any;
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch((err: any) => console.error(err));
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    }
  };

  const progressPercentage = isYoutube
    ? ytProgress
    : videoRef.current && videoRef.current.duration
      ? (lastTime / videoRef.current.duration) * 100
      : 0;

  return (
    <div className="w-full flex flex-col gap-4">
      <div 
        ref={playerContainerRef}
        className={`relative bg-black rounded-xl overflow-hidden group ${
          isFullscreen ? 'w-full h-full flex flex-col justify-center items-center' : 'aspect-video'
        }`}
      >
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80">
            <Loader2 className="animate-spin text-white w-8 h-8" />
          </div>
        )}
        
        {isYoutube ? (
          <div className="w-full h-full relative flex items-center justify-center bg-black">
            <div ref={ytContainerRef} className="w-full h-full pointer-events-auto" />
          </div>
        ) : (
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
        )}
        
        {/* Custom Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-auto">
          <div className="flex items-center gap-4">
            <button 
              onClick={togglePlay} 
              className="text-white hover:text-[var(--color-amarelo-conquista)] transition-colors p-1"
              type="button"
              title={isPlaying ? "Pausar" : "Reproduzir"}
            >
              {isPlaying ? <Pause size={28} /> : <Play size={28} />}
            </button>
            <div className="flex-1">
               <div className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden relative">
                 <div 
                   className="absolute top-0 left-0 h-full bg-[var(--color-amarelo-conquista)] transition-all duration-300"
                   style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                 />
               </div>
            </div>
            
            <div className="flex items-center gap-2 text-white ml-2">
              <button 
                onClick={toggleMute}
                className="hover:text-[var(--color-amarelo-conquista)] transition-colors p-1"
                type="button"
                title={volume === 0 ? "Ativar som" : "Mudo"}
              >
                {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input 
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="w-16 md:w-24 h-1.5 accent-[var(--color-amarelo-conquista)] cursor-pointer"
                title={`Volume: ${volume}%`}
              />
            </div>

            {isCompleted && (
              <span className="text-emerald-400 text-xs font-mono font-bold ml-2">✓ Concluído</span>
            )}

            <button 
              onClick={toggleFullscreen}
              className="text-white hover:text-[var(--color-amarelo-conquista)] transition-colors p-1 ml-2"
              type="button"
              title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            >
              {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Comentários Section */}
      <VideoComments conteudoId={conteudoId} />
    </div>
  );
}
