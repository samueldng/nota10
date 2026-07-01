'use client';

import { Lock, ArrowRight, MessageCircle, CheckCircle2, Star, TrendingUp } from 'lucide-react';
import { planoLabels } from '@/lib/mockData';
import type { PlanoAluno } from '@/lib/mockData';
import { upgradeTexts, getWhatsAppUpgradeUrl } from '@/lib/portalData';
import { useAuth } from '@/context/AuthContext';

interface UpgradeScreenProps {
  targetPlan: 'acompanhamento' | 'elite';
  previewContent?: React.ReactNode;
}

export default function UpgradeScreen({ targetPlan, previewContent }: UpgradeScreenProps) {
  const { user } = useAuth();
  const nomeAluno = user?.alunoNome || 'Aluno';
  const plano = user?.plano || 'padrao';
  const upgrade = upgradeTexts[targetPlan];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Blurred Preview */}
      {previewContent && (
        <div className="relative mb-8">
          <div className="pointer-events-none select-none" style={{ filter: 'blur(6px)', opacity: 0.3, maxHeight: '300px', overflow: 'hidden' }}>
            {previewContent}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--color-cinza-fundo)]" />
        </div>
      )}

      {/* Main Upgrade Card */}
      <div className="card text-center animate-fade-in-up" style={{ background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 50%, #FFFBEB 100%)' }}>
        {/* Lock Icon */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-[var(--color-azul-autoridade)] flex items-center justify-center mb-6 shadow-lg">
          <Lock size={36} className="text-[var(--color-amarelo-conquista)]" />
        </div>

        <h2 className="text-2xl font-bold text-[var(--color-azul-autoridade)] mb-2">
          {upgrade.titulo}
        </h2>
        <p className="text-xs font-bold text-[var(--color-amarelo-conquista)] uppercase tracking-wider mb-4">
          {upgrade.subtitulo}
        </p>
        <p className="text-sm text-[var(--color-cinza-escuro)] leading-relaxed max-w-lg mx-auto mb-6">
          {upgrade.argumento}
        </p>

        {/* Benefits List */}
        <div className="bg-white rounded-2xl border border-[var(--color-cinza-borda)] p-5 max-w-md mx-auto mb-6 text-left">
          <p className="text-xs font-bold text-[var(--color-azul-autoridade)] uppercase mb-3 flex items-center gap-1.5">
            <Star size={14} className="text-[var(--color-amarelo-conquista)]" fill="currentColor" />
            O que está incluído:
          </p>
          <div className="space-y-2">
            {upgrade.bullets.map((bullet, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[var(--color-verde-sucesso)] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-[var(--color-cinza-escuro)]">{bullet}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-6">
          <a
            href={getWhatsAppUpgradeUrl(nomeAluno, planoLabels[targetPlan])}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary flex-1 py-3.5 text-sm no-underline"
          >
            {upgrade.ctaPrimario} <ArrowRight size={14} />
          </a>
          <a
            href={getWhatsAppUpgradeUrl(nomeAluno, planoLabels[targetPlan])}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline flex-1 py-3.5 text-xs no-underline"
          >
            <MessageCircle size={14} /> {upgrade.ctaWhatsApp}
          </a>
        </div>

        {/* Social Proof */}
        <div className="bg-white/80 rounded-xl p-4 max-w-md mx-auto border border-[var(--color-cinza-borda)]">
          <div className="flex items-center gap-2 justify-center">
            <TrendingUp size={14} className="text-[var(--color-verde-sucesso)]" />
            <p className="text-xs text-[var(--color-cinza-escuro)] font-medium italic">
              &ldquo;{upgrade.provaSocial}&rdquo;
            </p>
          </div>
        </div>

        <p className="text-[10px] text-[var(--color-cinza-texto)] mt-4">
          Seu plano atual: <strong>Plano {planoLabels[plano]}</strong>
        </p>
      </div>
    </div>
  );
}
