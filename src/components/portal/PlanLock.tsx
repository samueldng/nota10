'use client';

import { Lock, ArrowRight, MessageCircle } from 'lucide-react';
import type { PlanoAluno } from '@/lib/mockData';
import { planoLabels, canAccessFeature } from '@/lib/mockData';
import { getWhatsAppUpgradeUrl, upgradeTexts } from '@/lib/portalData';
import { useAuth } from '@/context/AuthContext';

interface PlanLockProps {
  featureKey: string;
  children: React.ReactNode;
  requiredPlan?: 'acompanhamento' | 'elite';
  customMessage?: string;
}

export default function PlanLock({ featureKey, children, requiredPlan, customMessage }: PlanLockProps) {
  const { user } = useAuth();
  const plano = user?.plano || 'padrao';
  const nomeAluno = user?.alunoNome || 'Aluno';

  const isAccessible = canAccessFeature(featureKey, plano);

  if (isAccessible) {
    return <>{children}</>;
  }

  const targetPlan = requiredPlan || 'acompanhamento';
  const upgrade = upgradeTexts[targetPlan === 'elite' ? 'elite' : 'acompanhamento'];

  return (
    <div className="relative overflow-hidden rounded-2xl min-h-[360px]">
      {/* Blurred Content Preview */}
      <div className="pointer-events-none select-none" style={{ filter: 'blur(6px)', opacity: 0.4 }}>
        {children}
      </div>

      {/* Lock Overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-[var(--color-cinza-borda)] p-6 sm:p-8 max-w-md w-full mx-4 text-center animate-fade-in">
          {/* Lock Icon */}
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--color-azul-lightest)] flex items-center justify-center mb-4">
            <Lock size={28} className="text-[var(--color-azul-autoridade)]" />
          </div>

          {/* Message */}
          <h3 className="text-lg font-bold text-[var(--color-azul-autoridade)] mb-2">
            {customMessage || `Disponível no Plano ${planoLabels[targetPlan]}`}
          </h3>
          <p className="text-sm text-[var(--color-cinza-texto)] mb-5 leading-relaxed">
            {upgrade.argumento.substring(0, 150)}...
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-2">
            <a
              href={getWhatsAppUpgradeUrl(nomeAluno, planoLabels[targetPlan])}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary w-full py-3 no-underline"
            >
              {upgrade.ctaPrimario} <ArrowRight size={14} />
            </a>
            <a
              href={getWhatsAppUpgradeUrl(nomeAluno, planoLabels[targetPlan])}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline w-full py-2.5 no-underline text-xs"
            >
              <MessageCircle size={14} /> {upgrade.ctaWhatsApp}
            </a>
          </div>

          {/* Current plan info */}
          <p className="text-[10px] text-[var(--color-cinza-texto)] mt-4">
            Seu plano atual: <strong>Plano {planoLabels[plano]}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
