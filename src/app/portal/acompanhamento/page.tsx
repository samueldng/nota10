'use client';

import { useAuth } from '@/context/AuthContext';
import { canAccessFeature } from '@/lib/mockData';
import { getRegistroSemanal } from '@/lib/portalData';
import UpgradeScreen from '@/components/portal/UpgradeScreen';
import {
  UserCheck, XCircle, Clock, CheckCircle2, AlertTriangle,
  Eye, Heart, Star, FileText,
} from 'lucide-react';

// Mock preview data for blurred upgrade background
function AcompanhamentoPreview() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Presenças', value: '36', color: '#22C55E' },
          { label: 'Faltas', value: '4', color: '#EF4444' },
          { label: 'Atrasos', value: '2', color: '#F59E0B' },
          { label: 'Frequência', value: '90%', color: '#3B82F6' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.color + '20', color: s.color }}>
              <UserCheck size={20} />
            </div>
            <div>
              <p className="text-2xl font-extrabold leading-none" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs font-bold text-[var(--color-azul-autoridade)] mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <h4 className="text-sm font-bold text-[var(--color-azul-autoridade)] mb-3">Atividades e Engajamento</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-[var(--color-verde-light)] rounded-xl text-center">
            <p className="text-lg font-extrabold text-[var(--color-verde-sucesso)]">85%</p>
            <p className="text-[10px] text-[var(--color-cinza-texto)]">Videoaulas</p>
          </div>
          <div className="p-3 bg-[var(--color-azul-lightest)] rounded-xl text-center">
            <p className="text-lg font-extrabold text-[var(--color-azul-autoridade)]">78%</p>
            <p className="text-[10px] text-[var(--color-cinza-texto)]">Fixação</p>
          </div>
          <div className="p-3 bg-[var(--color-roxo-light)] rounded-xl text-center">
            <p className="text-lg font-extrabold text-[#8B5CF6]">92%</p>
            <p className="text-[10px] text-[var(--color-cinza-texto)]">Palavra-chave</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AcompanhamentoPage() {
  const { user } = useAuth();
  const plano = user?.plano || 'padrao';
  const alunoId = user?.alunoId || 'a1';

  // Plan-gated: Padrão gets upgrade screen
  if (!canAccessFeature('acompanhamento', plano)) {
    return (
      <UpgradeScreen
        targetPlan="acompanhamento"
        previewContent={<AcompanhamentoPreview />}
      />
    );
  }

  // Full content for Acompanhamento and Elite
  const registro = getRegistroSemanal(alunoId);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 animate-fade-in-up">
        {[
          { label: 'Presenças', value: '36', sub: '90% de frequência', icon: <UserCheck size={22} />, color: '#22C55E', bg: '#dcfce7' },
          { label: 'Faltas', value: '4', sub: '10% de ausência', icon: <XCircle size={22} />, color: '#EF4444', bg: '#fee2e2' },
          { label: 'Atrasos', value: '2', sub: 'Pontualidade em dia', icon: <Clock size={22} />, color: '#F59E0B', bg: '#fef3c7' },
          { label: 'Videoaulas', value: '85%', sub: 'Engajamento', icon: <Eye size={22} />, color: '#8B5CF6', bg: '#ede9fe' },
          { label: 'Fixação', value: '82%', sub: 'Absorção de conteúdo', icon: <CheckCircle2 size={22} />, color: '#22C55E', bg: '#dcfce7' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div>
              <p className="text-2xl font-extrabold leading-none" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs font-bold text-[var(--color-azul-autoridade)] mt-0.5">{s.label}</p>
              <p className="text-[10px] text-[var(--color-cinza-texto)]">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Atividades e Engajamento */}
      <div className="card animate-fade-in-up delay-1">
        <h3 className="text-base font-bold text-[var(--color-azul-autoridade)] mb-4 flex items-center gap-2">
          <Star size={18} className="text-[var(--color-amarelo-conquista)]" fill="currentColor" />
          Atividades e Engajamento
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Videoaulas Assistidas', value: '17/20', pct: 85, color: '#8B5CF6' },
            { label: 'Palavra-chave', value: '18/20', pct: 90, color: '#22C55E' },
            { label: 'Fixação', value: '16/20', pct: 80, color: '#3B82F6' },
            { label: 'Apostila', value: '14/20', pct: 70, color: '#F59E0B' },
          ].map((a) => (
            <div key={a.label} className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-2">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={a.color} strokeWidth="3" strokeDasharray={`${a.pct}, 100`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-[var(--color-azul-autoridade)]">{a.pct}%</span>
              </div>
              <p className="text-xs font-bold text-[var(--color-cinza-escuro)]">{a.value}</p>
              <p className="text-[10px] text-[var(--color-cinza-texto)]">{a.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Comportamento em Sala */}
      <div className="card animate-fade-in-up delay-2">
        <h3 className="text-base font-bold text-[var(--color-azul-autoridade)] mb-4 flex items-center gap-2">
          <Heart size={18} className="text-[var(--color-vermelho-erro)]" />
          Comportamento em Sala
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Atenção', value: registro.atencao === 'atento' ? 'Atento' : 'Distraído', emoji: registro.atencao === 'atento' ? '🟢' : '🟡' },
            { label: 'Participação', value: 'Boa', emoji: '👍' },
            { label: 'Comportamento', value: registro.comportamento === 'excelente' ? 'Excelente' : 'Bom', emoji: registro.comportamento === 'excelente' ? '🌟' : '👍' },
            { label: 'Uniforme', value: 'Completo', emoji: '✅' },
          ].map((b) => (
            <div key={b.label} className="p-4 bg-[var(--color-cinza-fundo)] rounded-xl border border-[var(--color-cinza-borda)] text-center">
              <p className="text-2xl mb-1">{b.emoji}</p>
              <p className="text-xs font-bold text-[var(--color-azul-autoridade)]">{b.value}</p>
              <p className="text-[10px] text-[var(--color-cinza-texto)]">{b.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Observação Semanal da Professora */}
      {registro.observacaoProfessora && (
        <div className="card animate-fade-in-up delay-3 border-l-4 border-l-[var(--color-azul-autoridade)]">
          <h3 className="text-base font-bold text-[var(--color-azul-autoridade)] mb-3 flex items-center gap-2">
            <FileText size={18} />
            Observação Semanal da Professora
          </h3>
          <p className="text-sm text-[var(--color-cinza-escuro)] italic leading-relaxed bg-[var(--color-cinza-fundo)] p-4 rounded-xl">
            &ldquo;{registro.observacaoProfessora}&rdquo;
          </p>
          <p className="text-[10px] text-[var(--color-cinza-texto)] mt-2 text-right">{registro.semana}</p>
        </div>
      )}
    </div>
  );
}
