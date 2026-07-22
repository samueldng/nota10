'use client';

import React, { useRef, useEffect, useState, useCallback, memo } from 'react';

export type CorujinhaState = 'padrao' | 'pensativa' | 'feliz' | 'triste';

interface CorujinhaAvatarProps {
  status: CorujinhaState;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Mapeamento de estados para vídeos:
 *  - padrao / pensativa -> A.mp4 (Idle — piscando/olhando)
 *  - feliz              -> B.mp4 (Sucesso — comemoração/pulo)  
 *  - triste             -> C.mp4 (Erro — pensativa/triste)
 * 
 * Performance:
 *  - Pré-carrega os 3 vídeos uma única vez no mount (são ~2.5MB cada, total ~7.5MB)
 *  - Usa dual-slot crossfade com opacity transition (sem re-render do DOM)
 *  - Vídeos rodam muted + loop + playsInline para autoplay mobile sem interação
 *  - Poster SVG inline como placeholder instantâneo (0ms de branco)
 */
const VIDEO_MAP: Record<string, string> = {
  idle: '/A.mp4',
  success: '/B.mp4',
  error: '/C.mp4',
};

function stateToVideoKey(state: CorujinhaState): string {
  if (state === 'feliz') return 'success';
  if (state === 'triste') return 'error';
  return 'idle';
}

const SIZE_CONFIG = {
  sm: { box: 112, cls: 'w-28 h-28' },
  md: { box: 176, cls: 'w-44 h-44 md:w-48 md:h-48' },
  lg: { box: 224, cls: 'w-56 h-56 md:w-60 md:h-60' },
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
    glow: 'shadow-[0_0_40px_rgba(59,130,246,0.15)]',
    badge: '🦉 Corujinha',
    badgeCls: 'bg-[var(--color-azul-autoridade)] text-white',
    msg: 'Pronto para turbinar seu cérebro? Vamos praticar!',
    border: 'border-blue-200',
    anim: '',
  },
  pensativa: {
    glow: 'shadow-[0_0_40px_rgba(147,51,234,0.2)]',
    badge: '🤔 Pensando...',
    badgeCls: 'bg-purple-600 text-white',
    msg: 'Pense bem... qual é a alternativa correta?',
    border: 'border-purple-200',
    anim: 'corujinha-pulse',
  },
  feliz: {
    glow: 'shadow-[0_0_50px_rgba(245,158,11,0.4)]',
    badge: '⭐ ACERTOU! ⭐',
    badgeCls: 'bg-gradient-to-r from-amber-400 to-yellow-300 text-[var(--color-azul-marinho)] font-extrabold shadow-lg',
    msg: 'Mandou muito bem! O conhecimento é o seu maior poder!',
    border: 'border-emerald-300',
    anim: 'corujinha-bounce',
  },
  triste: {
    glow: 'shadow-[0_0_40px_rgba(239,68,68,0.2)]',
    badge: '😢 Ops... Errou',
    badgeCls: 'bg-red-600 text-white font-bold',
    msg: 'Não foi dessa vez, mas cada erro é um passo rumo à aprovação!',
    border: 'border-red-200',
    anim: 'corujinha-shake',
  },
};

// SVG placeholder inline (owl silhouette) para evitar flash branco enquanto o vídeo carrega
const POSTER_SVG = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
  <rect width="200" height="200" rx="24" fill="#f0f4ff"/>
  <circle cx="100" cy="90" r="50" fill="#dbeafe"/>
  <circle cx="80" cy="82" r="12" fill="#1e3a5f"/>
  <circle cx="120" cy="82" r="12" fill="#1e3a5f"/>
  <circle cx="83" cy="79" r="4" fill="white"/>
  <circle cx="123" cy="79" r="4" fill="white"/>
  <path d="M92 100 Q100 110 108 100" stroke="#f59e0b" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M60 60 Q75 40 90 65" stroke="#1e3a5f" stroke-width="2" fill="none"/>
  <path d="M140 60 Q125 40 110 65" stroke="#1e3a5f" stroke-width="2" fill="none"/>
</svg>`)}`;

function CorujinhaAvatar({ status = 'padrao', message, size = 'md' }: CorujinhaAvatarProps) {
  // 3 vídeo refs — um para cada animação, pré-carregados
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({
    idle: null,
    success: null,
    error: null,
  });

  const [activeKey, setActiveKey] = useState<string>(stateToVideoKey(status));
  const [videosReady, setVideosReady] = useState(false);
  const prevKeyRef = useRef(activeKey);

  // Pré-carrega todos os 3 vídeos ao montar
  useEffect(() => {
    let loadedCount = 0;
    const total = Object.keys(VIDEO_MAP).length;

    Object.entries(videoRefs.current).forEach(([, el]) => {
      if (el) {
        const handleCanPlay = () => {
          loadedCount++;
          if (loadedCount >= total) setVideosReady(true);
        };
        el.addEventListener('canplaythrough', handleCanPlay, { once: true });
        el.load();
      }
    });

    // Timeout de segurança — não espera mais de 4s
    const timeout = setTimeout(() => setVideosReady(true), 4000);
    return () => clearTimeout(timeout);
  }, []);

  // Play o vídeo ativo, pausa os demais
  useEffect(() => {
    const newKey = stateToVideoKey(status);
    
    if (newKey !== prevKeyRef.current) {
      // Pausa o antigo
      const oldEl = videoRefs.current[prevKeyRef.current];
      if (oldEl) {
        oldEl.pause();
        oldEl.currentTime = 0;
      }
      
      prevKeyRef.current = newKey;
      setActiveKey(newKey);
    }

    // Play o novo
    const newEl = videoRefs.current[newKey];
    if (newEl) {
      newEl.currentTime = 0;
      newEl.play().catch(() => {});
    }
  }, [status]);

  const cfg = SIZE_CONFIG[size];
  const style = STATE_STYLES[status];

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-3 relative py-2">
      {/* Container da Animação */}
      <div className={`relative ${cfg.cls} rounded-2xl overflow-hidden ${style.glow} transition-shadow duration-500 ${style.anim}`}>
        {/* Poster SVG instantâneo */}
        {!videosReady && (
          <img
            src={POSTER_SVG}
            alt=""
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        )}

        {/* Os 3 vídeos empilhados — crossfade via opacity */}
        {Object.entries(VIDEO_MAP).map(([key, src]) => (
          <video
            key={key}
            ref={(el) => { videoRefs.current[key] = el; }}
            src={src}
            muted
            loop
            playsInline
            preload="auto"
            poster={POSTER_SVG}
            className={`absolute inset-0 w-full h-full object-cover rounded-2xl transition-opacity duration-400 ease-in-out ${
              activeKey === key ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          />
        ))}
      </div>

      {/* Badge + Speech Bubble */}
      <div className="relative z-10 max-w-xs sm:max-w-sm">
        <span className={`inline-block px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2 shadow-sm transition-all duration-300 ${style.badgeCls}`}>
          {style.badge}
        </span>
        <div className={`bg-white rounded-2xl p-4 shadow-xl border-2 ${style.border} relative`}>
          {/* Seta do balão */}
          <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t-2 border-l-2 ${style.border} rotate-45`} />
          <p className="text-sm md:text-base font-bold text-[var(--color-azul-marinho)] leading-relaxed">
            {message || style.msg}
          </p>
        </div>
      </div>

      {/* CSS das animações de feedback */}
      <style jsx>{`
        @keyframes corujinha-bounce-kf {
          0%, 100% { transform: translateY(0) scale(1); }
          30% { transform: translateY(-10px) scale(1.03); }
          60% { transform: translateY(-4px) scale(1.01); }
        }
        @keyframes corujinha-shake-kf {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          15% { transform: translateX(-5px) rotate(-2deg); }
          30% { transform: translateX(5px) rotate(2deg); }
          45% { transform: translateX(-4px) rotate(-1deg); }
          60% { transform: translateX(4px) rotate(1deg); }
          75% { transform: translateX(-2px); }
        }
        @keyframes corujinha-pulse-kf {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.97); opacity: 0.92; }
        }
        .corujinha-bounce {
          animation: corujinha-bounce-kf 0.7s ease-out 2;
        }
        .corujinha-shake {
          animation: corujinha-shake-kf 0.55s ease-in-out 2;
        }
        .corujinha-pulse {
          animation: corujinha-pulse-kf 1.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// Re-export com nome legado para compatibilidade com CorujinhaMascot
export { CorujinhaAvatar };
export type { CorujinhaAvatarProps };

// Exportação padrão como CorujinhaMascot para retrocompatibilidade
export default memo(function CorujinhaMascot({ state = 'padrao', message, size = 'md' }: {
  state: CorujinhaState;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  return <CorujinhaAvatar status={state} message={message} size={size} />;
});

// Re-export do type para compatibilidade (já exportado no topo via `export type`)
