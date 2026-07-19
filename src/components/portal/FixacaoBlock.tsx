'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, Zap } from 'lucide-react';

interface QuestaoFixacao {
  id: string;
  enunciado: string;
  alternativas: string[];
  respostaCorreta: number;
  xp: number;
}

interface FixacaoBlockProps {
  questoes: QuestaoFixacao[];
  titulo: string;
  onFinish: (resultado: { totalAcertos: number; totalErros: number; percentualAproveitamento: number }) => void;
}

export default function FixacaoBlock({ questoes, titulo, onFinish }: FixacaoBlockProps) {
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [submetido, setSubmetido] = useState(false);

  const handleSelect = (questaoId: string, indexAlt: number) => {
    if (submetido) return;
    setRespostas(prev => ({
      ...prev,
      [questaoId]: indexAlt
    }));
  };

  const todasRespondidas = questoes.every(q => respostas[q.id] !== undefined);

  const handleSubmit = () => {
    if (!todasRespondidas) return;
    
    setSubmetido(true);
    
    let acertos = 0;
    questoes.forEach(q => {
      if (respostas[q.id] === q.respostaCorreta) {
        acertos++;
      }
    });
    
    const erros = questoes.length - acertos;
    const percentualAproveitamento = (acertos / questoes.length) * 100;
    
    onFinish({
      totalAcertos: acertos,
      totalErros: erros,
      percentualAproveitamento
    });
  };

  return (
    <div className="card p-6 md:p-8 max-w-4xl mx-auto">
      <h2 className="text-xl font-black text-[var(--color-azul-autoridade)] mb-6 pb-4 border-b border-[var(--color-cinza-borda)]">
        {titulo}
      </h2>

      <div className="space-y-8 mb-8">
        {questoes.map((q, qIndex) => {
          const selected = respostas[q.id];
          const isCorrect = selected === q.respostaCorreta;
          
          return (
            <div key={q.id} className="p-5 rounded-xl border border-[var(--color-cinza-borda)] bg-[var(--color-cinza-fundo)]">
              <div className="flex items-start justify-between gap-4 mb-4">
                <p className="text-sm font-bold text-[var(--color-cinza-escuro)]">
                  <span className="text-[var(--color-azul-autoridade)] mr-2">{qIndex + 1}.</span>
                  {q.enunciado}
                </p>
                
                {submetido && (
                  <div className="flex-shrink-0">
                    {isCorrect ? (
                      <CheckCircle2 className="text-[var(--color-verde-sucesso)]" size={24} />
                    ) : (
                      <XCircle className="text-[var(--color-vermelho-erro)]" size={24} />
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {q.alternativas.map((alt, altIndex) => {
                  const isSelected = selected === altIndex;
                  const isActuallyCorrect = q.respostaCorreta === altIndex;
                  
                  let borderColor = isSelected ? 'border-[var(--color-azul-autoridade)]' : 'border-[var(--color-cinza-borda)]';
                  let bgColor = 'bg-white';
                  
                  if (submetido) {
                    if (isActuallyCorrect) {
                      bgColor = 'bg-[var(--color-verde-light)]';
                      borderColor = 'border-[var(--color-verde-sucesso)]';
                    } else if (isSelected && !isActuallyCorrect) {
                      bgColor = 'bg-red-50';
                      borderColor = 'border-[var(--color-vermelho-erro)]';
                    }
                  }

                  return (
                    <label 
                      key={altIndex}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${submetido ? 'cursor-default' : 'cursor-pointer hover:border-[var(--color-azul-autoridade)]'} ${bgColor} ${borderColor}`}
                    >
                      <input 
                        type="radio" 
                        name={`fixacao-${q.id}`} 
                        checked={isSelected}
                        disabled={submetido}
                        onChange={() => handleSelect(q.id, altIndex)}
                        className="w-4 h-4 accent-[var(--color-azul-autoridade)]"
                      />
                      <span className={`text-sm ${submetido && isActuallyCorrect ? 'font-bold text-[var(--color-verde-sucesso)]' : 'text-[var(--color-cinza-escuro)]'}`}>
                        {alt}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-[var(--color-cinza-borda)]">
        <p className="text-xs text-[var(--color-cinza-texto)]">
          {Object.keys(respostas).length} de {questoes.length} respondidas
        </p>
        <button
          onClick={handleSubmit}
          disabled={!todasRespondidas || submetido}
          className="btn btn-primary py-3 px-8 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submetido ? '✅ Submetido' : 'Avançar'}
        </button>
      </div>
    </div>
  );
}
