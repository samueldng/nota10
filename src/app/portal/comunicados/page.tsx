'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getComunicados } from '@/lib/portalData';
import type { ComunicadoEscola } from '@/lib/mockData';
import { Megaphone, Calendar, AlertTriangle, Info, Bell } from 'lucide-react';

const tipoConfig: Record<string, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
  urgente: {
    label: 'Urgente',
    bg: 'bg-[var(--color-vermelho-light)]',
    text: 'text-[var(--color-vermelho-erro)]',
    border: 'border-[var(--color-vermelho-erro)]/30',
    icon: <AlertTriangle size={16} />,
  },
  informativo: {
    label: 'Informativo',
    bg: 'bg-[var(--color-azul-lightest)]',
    text: 'text-[var(--color-azul-autoridade)]',
    border: 'border-[var(--color-azul-light)]/40',
    icon: <Info size={16} />,
  },
  aviso: {
    label: 'Aviso',
    bg: 'bg-[var(--color-amarelo-alerta-light)]',
    text: 'text-[var(--color-amarelo-alerta)]',
    border: 'border-[var(--color-amarelo-alerta)]/30',
    icon: <Bell size={16} />,
  },
};

export default function ComunicadosPage() {
  const { user } = useAuth();
  const turmaId = user?.turmaId;
  const [comunicados, setComunicados] = useState<any[]>([]);

  useEffect(() => {
    if (!turmaId) return;

    fetch(`/api/comunicados?turmaId=${turmaId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const formatted = data.map((com: any) => ({
            id: com.id,
            titulo: com.titulo,
            conteudo: com.descricao,
            tipo: com.tipoCriticidade,
            data: com.dataPublicacao ? new Date(com.dataPublicacao).toLocaleDateString('pt-BR') : '',
          }));
          setComunicados(formatted);
        }
      })
      .catch((err) => console.error('Erro ao carregar comunicados:', err));
  }, [turmaId]);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {comunicados.length > 0 ? (
        comunicados.map((com, index) => {
          const cfg = tipoConfig[com.tipo] || tipoConfig.informativo;
          return (
            <div
              key={com.id}
              className={`card border-l-4 animate-fade-in-up flex flex-col sm:flex-row gap-4 p-5 ${
                com.tipo === 'urgente' ? 'border-l-[var(--color-vermelho-erro)]' :
                com.tipo === 'aviso' ? 'border-l-[var(--color-amarelo-alerta)]' :
                'border-l-[var(--color-azul-autoridade)]'
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                    {cfg.icon}
                    {cfg.label}
                  </span>
                  <span className="text-[10px] text-[var(--color-cinza-texto)] flex items-center gap-1">
                    <Calendar size={11} /> {com.data}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[var(--color-azul-autoridade)] leading-snug">
                  {com.titulo}
                </h3>
                <p className="text-sm text-[var(--color-cinza-escuro)] leading-relaxed">
                  {com.conteudo}
                </p>
              </div>
            </div>
          );
        })
      ) : (
        <div className="card text-center py-12 animate-fade-in-up">
          <Megaphone size={28} className="text-[var(--color-cinza-texto)] mx-auto mb-3" />
          <p className="text-sm text-[var(--color-cinza-texto)]">Nenhum comunicado ativo no momento.</p>
        </div>
      )}
    </div>
  );
}
