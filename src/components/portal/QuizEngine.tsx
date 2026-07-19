'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, ChevronRight, Award, Zap } from 'lucide-react';

interface Questao {
  id: string;
  tipo: 'multipla_escolha' | 'verdadeiro_falso' | 'texto';
  enunciado: string;
  alternativas?: string[];
  respostaCorreta?: string | number;
  xp: number;
}

interface QuizEngineProps {
  questoes: Questao[];
  titulo: string;
  onFinish: (resultado: { totalAcertos: number; totalErros: number; percentual: number; xpGanho: number }) => void;
}

export default function QuizEngine({ questoes, titulo, onFinish }: QuizEngineProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { given: string | number | boolean; isCorrect: boolean }>>({});
  const [textAnswer, setTextAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const questao = questoes[currentIndex];

  const handleAnswer = (resposta: string | number | boolean) => {
    if (feedback !== null) return;
    
    const isCorrect = String(resposta).toLowerCase() === String(questao.respostaCorreta).toLowerCase();
    
    setAnswers(prev => ({ ...prev, [questao.id]: { given: resposta, isCorrect } }));
    setFeedback(isCorrect ? 'correct' : 'incorrect');
  };

  const handleNext = () => {
    setFeedback(null);
    setTextAnswer('');
    if (currentIndex < questoes.length - 1) {
      setCurrentIndex(curr => curr + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    const acertos = Object.values(answers).filter(a => a.isCorrect).length;
    const erros = questoes.length - acertos;
    const percentual = (acertos / questoes.length) * 100;
    
    let xpGanho = 0;
    questoes.forEach(q => {
      if (answers[q.id]?.isCorrect) {
        xpGanho += q.xp;
      }
    });

    setIsFinished(true);
    onFinish({ totalAcertos: acertos, totalErros: erros, percentual, xpGanho });
  };

  if (isFinished) {
    const acertos = Object.values(answers).filter(a => a.isCorrect).length;
    const percentual = (acertos / questoes.length) * 100;
    const xpGanho = questoes.reduce((acc, q) => acc + (answers[q.id]?.isCorrect ? q.xp : 0), 0);

    return (
      <div className="card p-8 text-center animate-fade-in-up">
        <Award size={64} className="mx-auto text-[var(--color-amarelo-conquista)] mb-4" />
        <h2 className="text-2xl font-black text-[var(--color-azul-autoridade)] mb-2">Quiz Concluído!</h2>
        <p className="text-[var(--color-cinza-texto)] mb-6">{titulo}</p>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-[var(--color-verde-light)] rounded-xl">
            <p className="text-2xl font-extrabold text-[var(--color-verde-sucesso)]">{acertos}</p>
            <p className="text-[10px] text-[var(--color-cinza-texto)] font-bold uppercase">Acertos</p>
          </div>
          <div className="p-4 bg-red-50 rounded-xl">
            <p className="text-2xl font-extrabold text-[var(--color-vermelho-erro)]">{questoes.length - acertos}</p>
            <p className="text-[10px] text-[var(--color-cinza-texto)] font-bold uppercase">Erros</p>
          </div>
          <div className="p-4 bg-[var(--color-amarelo-alerta-light)] rounded-xl">
            <p className="text-2xl font-extrabold text-[var(--color-amarelo-conquista)] flex items-center justify-center gap-1">
              <Zap size={18} fill="currentColor" />{xpGanho}
            </p>
            <p className="text-[10px] text-[var(--color-cinza-texto)] font-bold uppercase">XP Ganho</p>
          </div>
        </div>
        
        <div className="w-full h-4 bg-[var(--color-cinza-fundo)] rounded-full overflow-hidden border border-[var(--color-cinza-borda)]">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percentual}%`, background: 'linear-gradient(90deg, var(--color-verde-sucesso), #10B981)' }} />
        </div>
        <p className="mt-2 text-sm font-bold text-[var(--color-cinza-escuro)]">{percentual.toFixed(0)}% de Aproveitamento</p>
      </div>
    );
  }

  return (
    <div className="card p-6 md:p-8 max-w-3xl mx-auto w-full animate-fade-in-up">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-lg text-[var(--color-azul-autoridade)]">{titulo}</h3>
          <span className="text-xs font-bold text-[var(--color-cinza-texto)] bg-[var(--color-cinza-fundo)] px-3 py-1 rounded-full">
            {currentIndex + 1} / {questoes.length}
          </span>
        </div>
        <div className="w-full h-2 bg-[var(--color-cinza-fundo)] rounded-full overflow-hidden border border-[var(--color-cinza-borda)]">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${((currentIndex) / questoes.length) * 100}%`, background: 'var(--color-azul-autoridade)' }} />
        </div>
      </div>

      <div className="mb-8">
        <p className="text-lg font-bold text-[var(--color-cinza-escuro)] mb-6">{questao.enunciado}</p>

        <div className="space-y-3">
          {questao.tipo === 'multipla_escolha' && questao.alternativas?.map((alt, i) => {
            const label = String.fromCharCode(65 + i);
            const isSelected = answers[questao.id]?.given === i;
            
            return (
              <button
                key={i}
                disabled={feedback !== null}
                onClick={() => handleAnswer(i)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4
                  ${feedback !== null ? 'cursor-default' : 'hover:border-[var(--color-azul-autoridade)] hover:bg-[var(--color-azul-lightest)]'}
                  ${isSelected && feedback === 'correct' ? 'border-[var(--color-verde-sucesso)] bg-[var(--color-verde-light)]' : ''}
                  ${isSelected && feedback === 'incorrect' ? 'border-[var(--color-vermelho-erro)] bg-red-50' : ''}
                  ${!isSelected ? 'border-[var(--color-cinza-borda)]' : ''}
                `}
              >
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-cinza-fundo)] border border-[var(--color-cinza-borda)] text-sm font-black">{label}</span>
                <span className="text-sm text-[var(--color-cinza-escuro)]">{alt}</span>
              </button>
            );
          })}

          {questao.tipo === 'verdadeiro_falso' && (
            <div className="flex gap-4">
              {[true, false].map((val) => {
                const isSelected = answers[questao.id]?.given === val;
                return (
                  <button
                    key={String(val)}
                    disabled={feedback !== null}
                    onClick={() => handleAnswer(val)}
                    className={`flex-1 p-4 rounded-xl border-2 font-black text-lg transition-all
                      ${feedback !== null ? 'cursor-default' : 'hover:border-[var(--color-azul-autoridade)]'}
                      ${isSelected && feedback === 'correct' ? 'border-[var(--color-verde-sucesso)] bg-[var(--color-verde-light)]' : ''}
                      ${isSelected && feedback === 'incorrect' ? 'border-[var(--color-vermelho-erro)] bg-red-50' : ''}
                      ${!isSelected ? 'border-[var(--color-cinza-borda)]' : ''}
                    `}
                  >
                    {val ? 'VERDADEIRO' : 'FALSO'}
                  </button>
                );
              })}
            </div>
          )}

          {questao.tipo === 'texto' && (
            <div className="flex flex-col gap-4">
              <input 
                type="text" 
                disabled={feedback !== null}
                value={textAnswer}
                onChange={e => setTextAnswer(e.target.value)}
                placeholder="Digite sua resposta..."
                className="form-input"
              />
              <button
                disabled={feedback !== null || !textAnswer.trim()}
                onClick={() => handleAnswer(textAnswer.trim())}
                className="btn btn-primary w-full py-3 disabled:opacity-50"
              >Confirmar</button>
            </div>
          )}
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 animate-fade-in-up
          ${feedback === 'correct' ? 'bg-[var(--color-verde-light)] text-[var(--color-verde-sucesso)]' : 'bg-red-50 text-[var(--color-vermelho-erro)]'}
        `}>
          {feedback === 'correct' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
          <span className="font-bold">
            {feedback === 'correct' ? 'Resposta Correta! Muito bem.' : 'Resposta Incorreta.'}
          </span>
        </div>
      )}

      {feedback && (
        <div className="flex justify-end">
          <button 
            onClick={handleNext}
            className="btn btn-primary flex items-center gap-2 py-3 px-6"
          >
            {currentIndex < questoes.length - 1 ? 'Próxima Questão' : 'Ver Resultado'}
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
