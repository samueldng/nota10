'use client';

import React from 'react';

export type CorujinhaState = 'padrao' | 'pensativa' | 'feliz' | 'triste';

interface CorujinhaMascotProps {
  state: CorujinhaState;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CorujinhaMascot({ state = 'padrao', message, size = 'md' }: CorujinhaMascotProps) {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-36 h-36 md:w-44 md:h-44',
    lg: 'w-48 h-48 md:w-56 md:h-56',
  }[size];

  const stateConfig = {
    padrao: {
      animClass: 'hover:scale-105 transition-transform duration-500 ease-in-out',
      glowClass: 'bg-blue-400/15',
      badgeText: 'Corujinha',
      badgeColor: 'bg-[var(--color-azul-autoridade)] text-white',
      defaultMsg: 'Pronto para turbinar seu cérebro? Vamos praticar!'
    },
    pensativa: {
      animClass: 'animate-pulse scale-95 transition-transform duration-300',
      glowClass: 'bg-purple-400/20',
      badgeText: 'Pensando...',
      badgeColor: 'bg-purple-600 text-white animate-pulse',
      defaultMsg: 'Pense bem... qual é a alternativa correta?'
    },
    feliz: {
      animClass: 'animate-bounce scale-110 transition-transform duration-300 drop-shadow-[0_10px_15px_rgba(245,158,11,0.5)]',
      glowClass: 'bg-amber-400/40 animate-pulse',
      badgeText: '★ ACERTOU! ★',
      badgeColor: 'bg-[var(--color-amarelo-conquista)] text-[var(--color-azul-marinho)] font-extrabold shadow-md',
      defaultMsg: 'Mandou muito bem! O conhecimento é o seu maior poder!'
    },
    triste: {
      animClass: '-translate-x-1 animate-ping-once transition-transform duration-200 opacity-90',
      glowClass: 'bg-red-400/20',
      badgeText: 'Ops... Errou',
      badgeColor: 'bg-red-600 text-white font-bold',
      defaultMsg: 'Não foi dessa vez, mas cada erro é um passo rumo à aprovação!'
    }
  }[state];

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-3 relative">
      {/* Background Aura / Glow */}
      <div className="relative flex items-center justify-center">
        <div className={`absolute rounded-full filter blur-xl transition-all duration-500 ${sizeClasses} ${stateConfig.glowClass}`} />
        
        {/* Owl Image / Asset */}
        <div className={`relative z-10 transition-all duration-300 ${sizeClasses} ${stateConfig.animClass}`}>
          <img
            src="/coruja.png"
            alt="Corujinha Mascot"
            className="w-full h-full object-contain filter drop-shadow-lg select-none"
            onError={(e) => {
              // Fallback se imagem não carregar imediatamente
              const target = e.currentTarget as HTMLImageElement;
              target.src = '/logo-nota10.png';
            }}
          />
        </div>
      </div>

      {/* Speech Bubble / Message Box */}
      <div className="relative z-10 max-w-sm">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 shadow-sm transition-colors duration-300 ${stateConfig.badgeColor}`}>
          {stateConfig.badgeText}
        </span>
        <div className="bg-white rounded-2xl p-4 shadow-xl border-2 border-[var(--color-azul-autoridade)]/10 relative">
          {/* Seta do balão */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t-2 border-l-2 border-[var(--color-azul-autoridade)]/10 rotate-45" />
          <p className="text-sm md:text-base font-bold text-[var(--color-azul-autoridade)] leading-relaxed">
            {message || stateConfig.defaultMsg}
          </p>
        </div>
      </div>
    </div>
  );
}
