'use client';

import React, { useRef, useEffect, useState, memo } from 'react';

export type CorujinhaState = 'padrao' | 'pensativa' | 'feliz' | 'triste';

interface CorujinhaAvatarProps {
  status: CorujinhaState;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const VIDEO_MAP: Record<string, string> = {
  idle: '/A.mp4',
  success: '/B.mp4',
  error: '/C.mp4',
};

// Vídeos de feedback (success/error) tocam COM áudio; idle é mudo
const UNMUTED_KEYS = new Set(['success', 'error']);

function stateToVideoKey(state: CorujinhaState): string {
  if (state === 'feliz') return 'success';
  if (state === 'triste') return 'error';
  return 'idle';
}

const SIZE_CONFIG = {
  sm: { cls: 'w-24 h-24' },
  md: { cls: 'w-32 h-32 md:w-36 md:h-36' },
  lg: { cls: 'w-44 h-44 md:w-48 md:h-48' },
} as const;

const STATE_STYLES: Record<CorujinhaState, {
  glow: string;
  badge: string;
  badgeCls: string;
  msg: string;
  border: string;
  anim: string;
}> = {
  padrao: {
    glow: 'shadow-[0_0_30px_rgba(59,130,246,0.12)]',
    badge: '🦉 Corujinha',
    badgeCls: 'bg-[var(--color-azul-autoridade)] text-white',
    msg: 'Pronto para turbinar seu cérebro? Vamos praticar!',
    border: 'border-blue-200',
    anim: '',
  },
  pensativa: {
    glow: 'shadow-[0_0_30px_rgba(147,51,234,0.18)]',
    badge: '🤔 Pensando...',
    badgeCls: 'bg-purple-600 text-white',
    msg: 'Pense bem... qual é a alternativa correta?',
    border: 'border-purple-200',
    anim: 'corujinha-pulse',
  },
  feliz: {
    glow: 'shadow-[0_0_40px_rgba(245,158,11,0.35)]',
    badge: '⭐ ACERTOU! ⭐',
    badgeCls: 'bg-gradient-to-r from-amber-400 to-yellow-300 text-[var(--color-azul-marinho)] font-extrabold shadow-lg',
    msg: 'Mandou muito bem! O conhecimento é o seu maior poder!',
    border: 'border-emerald-300',
    anim: 'corujinha-bounce',
  },
  triste: {
    glow: 'shadow-[0_0_30px_rgba(239,68,68,0.18)]',
    badge: '😢 Ops... Errou',
    badgeCls: 'bg-red-600 text-white font-bold',
    msg: 'Não foi dessa vez, mas cada erro é um passo rumo à aprovação!',
    border: 'border-red-200',
    anim: 'corujinha-shake',
  },
};

const POSTER_SVG = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
  <circle cx="100" cy="90" r="50" fill="#dbeafe"/>
  <circle cx="80" cy="82" r="12" fill="#1e3a5f"/>
  <circle cx="120" cy="82" r="12" fill="#1e3a5f"/>
  <circle cx="83" cy="79" r="4" fill="white"/>
  <circle cx="123" cy="79" r="4" fill="white"/>
  <path d="M92 100 Q100 110 108 100" stroke="#f59e0b" stroke-width="3" fill="none" stroke-linecap="round"/>
</svg>`)}`;

function CorujinhaAvatar({ status = 'padrao', message, size = 'md' }: CorujinhaAvatarProps) {
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({
    idle: null, success: null, error: null,
  });

  const [activeKey, setActiveKey] = useState<string>(stateToVideoKey(status));
  const [videosReady, setVideosReady] = useState(false);
  const prevKeyRef = useRef(activeKey);

  // Pré-carrega todos os 3 vídeos ao montar
  useEffect(() => {
    let loaded = 0;
    const total = Object.keys(VIDEO_MAP).length;
    Object.values(videoRefs.current).forEach((el) => {
      if (el) {
        el.addEventListener('canplaythrough', () => {
          loaded++;
          if (loaded >= total) setVideosReady(true);
        }, { once: true });
        el.load();
      }
    });
    const t = setTimeout(() => setVideosReady(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // Troca de vídeo com controle de áudio
  useEffect(() => {
    const newKey = stateToVideoKey(status);

    if (newKey !== prevKeyRef.current) {
      const oldEl = videoRefs.current[prevKeyRef.current];
      if (oldEl) {
        oldEl.pause();
        oldEl.currentTime = 0;
        oldEl.muted = true;
      }
      prevKeyRef.current = newKey;
      setActiveKey(newKey);
    }

    const newEl = videoRefs.current[newKey];
    if (newEl) {
      newEl.currentTime = 0;
      // Efeitos sonoros: desmuta os vídeos de feedback (success/error)
      newEl.muted = !UNMUTED_KEYS.has(newKey);
      newEl.play().catch(() => {});
    }
  }, [status]);

  const cfg = SIZE_CONFIG[size];
  const style = STATE_STYLES[status];

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-2 relative">
      {/* Vídeo Container */}
      <div className={`relative ${cfg.cls} flex items-center justify-center ${style.anim}`}>
        {!videosReady && (
          <img src={POSTER_SVG} alt="" className="absolute inset-0 w-full h-full object-cover z-0 [clip-path:circle(48%_at_50%_50%)] bg-transparent" />
        )}
        {Object.entries(VIDEO_MAP).map(([key, src]) => (
          <video
            key={key}
            ref={(el) => { videoRefs.current[key] = el; }}
            src={src}
            muted={!UNMUTED_KEYS.has(key)}
            loop
            playsInline
            preload="auto"
            className={`absolute inset-0 w-full h-full object-cover [clip-path:circle(48%_at_50%_50%)] bg-transparent transition-opacity duration-400 ease-in-out ${
              activeKey === key ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          />
        ))}
      </div>

      {/* Badge + Speech Bubble (compacto) */}
      <div className="relative z-10 max-w-[280px] sm:max-w-xs">
        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1 shadow-sm transition-all duration-300 ${style.badgeCls}`}>
          {style.badge}
        </span>
        <div className={`bg-white rounded-xl p-3 shadow-lg border-2 ${style.border} relative`}>
          <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-t-2 border-l-2 ${style.border} rotate-45`} />
          <p className="text-xs sm:text-sm font-semibold text-[var(--color-azul-marinho)] leading-snug">
            {message || style.msg}
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes corujinha-bounce-kf {
          0%, 100% { transform: translateY(0) scale(1); }
          30% { transform: translateY(-8px) scale(1.02); }
          60% { transform: translateY(-3px) scale(1.01); }
        }
        @keyframes corujinha-shake-kf {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-4px) rotate(-2deg); }
          30% { transform: translateX(4px) rotate(2deg); }
          45% { transform: translateX(-3px) rotate(-1deg); }
          60% { transform: translateX(3px) rotate(1deg); }
        }
        @keyframes corujinha-pulse-kf {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.97); }
        }
        .corujinha-bounce { animation: corujinha-bounce-kf 0.7s ease-out 2; }
        .corujinha-shake { animation: corujinha-shake-kf 0.5s ease-in-out 2; }
        .corujinha-pulse { animation: corujinha-pulse-kf 1.4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

export { CorujinhaAvatar };
export type { CorujinhaAvatarProps };

export default memo(function CorujinhaMascot({ state = 'padrao', message, size = 'md' }: {
  state: CorujinhaState;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  return <CorujinhaAvatar status={state} message={message} size={size} />;
});
