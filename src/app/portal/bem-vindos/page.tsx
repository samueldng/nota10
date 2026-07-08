'use client';

import { conteudoBemVindos } from '@/lib/portalData';
import Image from 'next/image';
import { BookOpen, Users, Monitor, FileText, Calendar, Shield, CheckCircle2 } from 'lucide-react';

const sectionIcons: Record<string, React.ReactNode> = {
  metodo: <BookOpen size={22} />,
  familia: <Users size={22} />,
  plataforma: <Monitor size={22} />,
  apostila: <FileText size={22} />,
  rotina: <Calendar size={22} />,
  combinados: <Shield size={22} />,
};

const sectionColors = ['#1A3A6B', '#8B5CF6', '#22C55E', '#F59E0B', '#3B82F6', '#EF4444'];

export default function BemVindosPage() {
  const c = conteudoBemVindos;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header with Written Lema */}
      <div className="text-center animate-fade-in-up">
        <h2 className="text-3xl font-extrabold text-[var(--color-azul-autoridade)] mb-2 tracking-tight">
          Bem-vindos ao Nota 10! 🎓
        </h2>
        <p className="text-sm text-[var(--color-cinza-texto)] max-w-xl mx-auto mb-4">
          Tudo o que você precisa saber para aproveitar ao máximo a plataforma e apoiar a jornada do seu filho.
        </p>
        
        {/* Written Lema / Slogan */}
        <div className="inline-flex items-center justify-center gap-2 sm:gap-3 px-6 py-2 bg-[var(--color-azul-lightest)] rounded-full border border-[var(--color-azul-light)]/35 text-xs sm:text-sm font-extrabold tracking-wider text-[var(--color-azul-autoridade)] uppercase shadow-sm">
          <span>Base Forte</span>
          <span className="text-[var(--color-amarelo-conquista)] font-black text-base">•</span>
          <span>Rotina</span>
          <span className="text-[var(--color-amarelo-conquista)] font-black text-base">•</span>
          <span>Acompanhamento</span>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6 items-start">
        {/* Left column: logo precmt */}
        <div className="bg-white rounded-3xl border border-[var(--color-cinza-borda)] p-5 md:sticky md:top-24 flex flex-col items-center justify-center shadow-sm animate-fade-in-up delay-1">
          <div className="flex items-center justify-center py-4">
            <img
              src="/Materias/WhatsApp Image 2026-07-07 at 11.41.56.jpeg"
              alt="Pré CMT Nota 10"
              className="h-20 w-auto object-contain drop-shadow-md"
            />
          </div>
          <div className="w-full border-t border-[var(--color-cinza-borda)] mt-2 pt-3 text-center">
            <span className="text-[9px] font-bold tracking-widest text-[var(--color-azul-autoridade)] uppercase block">
              Programa Preparatório
            </span>
            <span className="text-[9px] font-semibold text-[var(--color-cinza-texto)] block mt-0.5">
              Colégio Militar
            </span>
          </div>
        </div>

        {/* Right column: informational cards */}
        <div className="space-y-6">
          {/* O que é o Método */}
          <div className="card mt-0">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white" style={{ backgroundColor: sectionColors[0] }}>
                {sectionIcons.metodo}
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--color-azul-autoridade)] mb-2">{c.metodo.titulo}</h3>
                <p className="text-sm text-[var(--color-cinza-escuro)] leading-relaxed">{c.metodo.texto}</p>
              </div>
            </div>
          </div>

          {/* Papel da Família */}
          <div className="card">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white" style={{ backgroundColor: sectionColors[1] }}>
                {sectionIcons.familia}
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--color-azul-autoridade)] mb-2">{c.familia.titulo}</h3>
                <p className="text-sm text-[var(--color-cinza-escuro)] leading-relaxed">{c.familia.texto}</p>
              </div>
            </div>
          </div>

          {/* Como Usar a Plataforma */}
          <div className="card">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white" style={{ backgroundColor: sectionColors[2] }}>
                {sectionIcons.plataforma}
              </div>
              <h3 className="text-base font-bold text-[var(--color-azul-autoridade)] pt-2">{c.plataforma.titulo}</h3>
            </div>
            <div className="space-y-3 ml-0 sm:ml-16">
              {c.plataforma.passos.map((passo, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[var(--color-verde-sucesso)] text-white flex items-center justify-center text-xs font-black flex-shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-sm text-[var(--color-cinza-escuro)] pt-1">{passo}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Como Usar a Apostila */}
          <div className="card">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white" style={{ backgroundColor: sectionColors[3] }}>
                {sectionIcons.apostila}
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--color-azul-autoridade)] mb-2">{c.apostila.titulo}</h3>
                <p className="text-sm text-[var(--color-cinza-escuro)] leading-relaxed">{c.apostila.texto}</p>
              </div>
            </div>
          </div>

          {/* Rotina de Estudos */}
          <div className="card">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white" style={{ backgroundColor: sectionColors[4] }}>
                {sectionIcons.rotina}
              </div>
              <h3 className="text-base font-bold text-[var(--color-azul-autoridade)] pt-2">{c.rotina.titulo}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ml-0 sm:ml-16">
              {c.rotina.passos.map((p, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border ${
                    p.dia === 'Sábado'
                      ? 'bg-[var(--color-cinza-fundo)] border-[var(--color-cinza-borda)]'
                      : p.atividade.includes('AULA PRESENCIAL')
                      ? 'bg-[var(--color-azul-lightest)] border-[var(--color-azul-autoridade)]/20'
                      : 'bg-white border-[var(--color-cinza-borda)]'
                  }`}
                >
                  <p className="text-xs font-black text-[var(--color-azul-autoridade)] uppercase mb-1">{p.dia}</p>
                  <p className="text-xs text-[var(--color-cinza-escuro)] leading-relaxed">{p.atividade}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Combinados */}
          <div className="card">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white" style={{ backgroundColor: sectionColors[5] }}>
                {sectionIcons.combinados}
              </div>
              <h3 className="text-base font-bold text-[var(--color-azul-autoridade)] pt-2">{c.combinados.titulo}</h3>
            </div>
            <div className="space-y-2 ml-0 sm:ml-16">
              {c.combinados.regras.map((regra, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-[var(--color-azul-autoridade)] mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-[var(--color-cinza-escuro)]">{regra}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
