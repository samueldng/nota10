'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import CorujinhaMascot, { CorujinhaState } from '@/components/portal/CorujinhaMascot';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Award, Sparkles, BookOpen, Loader2 } from 'lucide-react';

export default function RevisaoCorujinhaPage() {
  const { user } = useAuth();
  const alunoId = user?.alunoId || 'a1';

  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState<any>(null);
  const [questoes, setQuestoes] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAlt, setSelectedAlt] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [finalResult, setFinalResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filtroDisciplina, setFiltroDisciplina] = useState('todas');

  const [mascotState, setMascotState] = useState<CorujinhaState>('padrao');
  const [mascotMsg, setMascotMsg] = useState<string | undefined>(undefined);

  const fetchQuiz = async (disciplina = 'todas') => {
    setLoading(true);
    setIsFinished(false);
    setCurrentIndex(0);
    setSelectedAlt(null);
    setIsAnswered(false);
    setAcertos(0);
    setErros(0);
    setFinalResult(null);
    setMascotState('padrao');
    setMascotMsg(undefined);

    try {
      let url = `/api/quiz?limite=5`;
      if (disciplina !== 'todas') url += `&disciplina=${encodeURIComponent(disciplina)}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setQuizData(data);
        const qList = Array.isArray(data.questoes) ? data.questoes : [];
        setQuestoes(qList);
      }
    } catch (err) {
      console.error('Erro ao buscar quiz Corujinha:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz(filtroDisciplina);
  }, [filtroDisciplina]);

  const currentQ = questoes[currentIndex];

  const handleSelectAlt = (altId: string) => {
    if (isAnswered) return;
    setSelectedAlt(altId);
    setMascotState('pensativa');
    setMascotMsg('Você tem certeza? Clique em Confirmar quando estiver pronto!');
  };

  const handleConfirm = () => {
    if (!selectedAlt || !currentQ || isAnswered) return;

    setIsAnswered(true);
    const correta = currentQ.resposta_correta;

    if (selectedAlt === correta) {
      setAcertos(prev => prev + 1);
      setMascotState('feliz');
      setMascotMsg('Boa! Você acertou em cheio! O conhecimento é a chave do sucesso!');
    } else {
      setErros(prev => prev + 1);
      setMascotState('triste');
      setMascotMsg(`Que pena! A resposta correta era a letra ${correta}. Preste atenção na explicação abaixo!`);
    }
  };

  const handleNext = async () => {
    if (currentIndex + 1 < questoes.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAlt(null);
      setIsAnswered(false);
      setMascotState('padrao');
      setMascotMsg('Vamos para o próximo desafio! Concentre-se!');
    } else {
      // Finalizou o Quiz
      setIsFinished(true);
      setSubmitting(true);
      setMascotState('feliz');
      setMascotMsg('Parabéns por completar a revisão! Calculando o seu XP...');

      const total = questoes.length;
      try {
        const res = await fetch('/api/quiz/finalizar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alunoId,
            quizId: quizData?.id || 'corujinha_quiz',
            atividadeRef: 'revisao_corujinha',
            totalQuestoes: total,
            acertos,
            erros,
            xpBase: quizData?.xp_base || 30
          })
        });

        if (res.ok) {
          const data = await res.json();
          setFinalResult(data);
          if (data.acertos === total) {
            setMascotMsg('INCRÍVEL! GABARITOU! Você ganhou o máximo de XP possível!');
          } else if (data.percentual >= 60) {
            setMascotMsg(`Muito bem! Você teve um aproveitamento de ${data.percentual}%! Continue assim!`);
          } else {
            setMascotState('padrao');
            setMascotMsg(`Você concluiu com ${data.percentual}%. Que tal revisar a apostila e tentar novamente para ganhar mais XP?`);
          }
        } else {
          const data = await res.json().catch(() => ({}));
          setFinalResult({ success: false, error: data.error || 'Erro ao registrar progresso no servidor.', acertos, erros, xpGanho: 0, percentual: Math.round((acertos / total) * 100) });
          setMascotState('padrao');
          setMascotMsg('Atenção: Não conseguimos gravar seu progresso no servidor. Verifique sua conexão.');
        }
      } catch (err: any) {
        console.error('Erro ao finalizar quiz:', err);
        setFinalResult({ success: false, error: 'Erro de conexão ao salvar progresso no servidor.', acertos, erros, xpGanho: 0, percentual: Math.round((acertos / total) * 100) });
        setMascotState('padrao');
        setMascotMsg('Atenção: Não conseguimos gravar seu progresso no servidor. Verifique sua conexão.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-[var(--color-amarelo-conquista)] animate-spin" />
        <p className="text-sm font-semibold text-[var(--color-cinza-texto)]">A Corujinha está preparando os seus desafios...</p>
      </div>
    );
  }

  let alternativasList = currentQ?.alternativas || [];
  if (typeof alternativasList === 'string') {
    try { alternativasList = JSON.parse(alternativasList); } catch (e) { alternativasList = []; }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header e Filtro Rápido */}
      <div className="bg-gradient-to-r from-[var(--color-azul-marinho)] via-blue-900 to-[var(--color-azul-autoridade)] rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[var(--color-amarelo-conquista)] text-[var(--color-azul-marinho)] mb-2 uppercase">
            <Sparkles size={14} /> Revisão Gamificada Duolingo Style
          </span>
          <h1 className="text-2xl md:text-3xl font-black">
            Revisão com a Corujinha
          </h1>
          <p className="text-sm text-white/80 mt-1">
            Responda às questões selecionadas pelo nosso mascote e ganhe XP de acordo com seu desempenho!
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/20 shrink-0">
          <BookOpen size={18} className="text-[var(--color-amarelo-conquista)]" />
          <select
            value={filtroDisciplina}
            onChange={(e) => setFiltroDisciplina(e.target.value)}
            className="bg-transparent text-white text-sm font-bold focus:outline-none cursor-pointer"
          >
            <option value="todas" className="text-gray-900">Todas as Disciplinas</option>
            <option value="Português" className="text-gray-900">Português</option>
            <option value="Matemática" className="text-gray-900">Matemática</option>
            <option value="Redação" className="text-gray-900">Redação</option>
          </select>
        </div>
      </div>

      {/* Seção Corujinha Mascot */}
      <div className="py-2">
        <CorujinhaMascot state={mascotState} message={mascotMsg} size="md" />
      </div>

      {!isFinished && questoes.length > 0 ? (
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-[var(--color-cinza-borda)] space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-[var(--color-cinza-texto)]">
              <span>Questão {currentIndex + 1} de {questoes.length}</span>
              <span className="text-[var(--color-azul-autoridade)]">{currentQ?.disciplina || 'Geral'}</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-[var(--color-amarelo-conquista)] transition-all duration-500 rounded-full"
                style={{ width: `${((currentIndex + 1) / questoes.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Enunciado */}
          <div className="py-2">
            <h2 className="text-lg md:text-xl font-bold text-[var(--color-azul-autoridade)] leading-relaxed">
              {currentQ.enunciado}
            </h2>
          </div>

          {/* Alternativas */}
          <div className="space-y-3">
            {Array.isArray(alternativasList) && alternativasList.map((alt: any) => {
              const isSelected = selectedAlt === alt.id;
              const isCorreta = currentQ.resposta_correta === alt.id;

              let btnStyle = 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800';
              if (isSelected && !isAnswered) {
                btnStyle = 'border-[var(--color-azul-autoridade)] bg-blue-50 text-[var(--color-azul-autoridade)] ring-2 ring-[var(--color-azul-autoridade)]/30 font-semibold';
              } else if (isAnswered) {
                if (isCorreta) {
                  btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/40';
                } else if (isSelected && !isCorreta) {
                  btnStyle = 'border-red-500 bg-red-50 text-red-900 font-bold ring-2 ring-red-500/40 opacity-90';
                } else {
                  btnStyle = 'border-gray-100 bg-gray-50/50 text-gray-400';
                }
              }

              return (
                <button
                  key={alt.id}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelectAlt(alt.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3.5 text-left cursor-pointer ${btnStyle}`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 transition-colors ${
                    isAnswered && isCorreta
                      ? 'bg-emerald-600 text-white'
                      : isAnswered && isSelected && !isCorreta
                      ? 'bg-red-600 text-white'
                      : isSelected
                      ? 'bg-[var(--color-azul-autoridade)] text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {alt.id}
                  </span>
                  <span className="flex-1 text-sm md:text-base">{alt.texto}</span>
                  {isAnswered && isCorreta && <CheckCircle2 className="text-emerald-600 shrink-0" size={22} />}
                  {isAnswered && isSelected && !isCorreta && <XCircle className="text-red-600 shrink-0" size={22} />}
                </button>
              );
            })}
          </div>

          {/* Explicação pedagógica (se respondido) */}
          {isAnswered && currentQ.explicacao && (
            <div className={`p-4 rounded-xl border text-sm flex items-start gap-3 animate-fade-in ${
              selectedAlt === currentQ.resposta_correta
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/80 border-amber-200 text-amber-900'
            }`}>
              <BookOpen className="shrink-0 mt-0.5" size={18} />
              <div>
                <strong className="font-bold block mb-1">Explicação do Professor:</strong>
                {currentQ.explicacao}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 flex justify-end">
            {!isAnswered ? (
              <button
                type="button"
                disabled={!selectedAlt}
                onClick={handleConfirm}
                className={`px-8 py-3.5 rounded-xl font-bold text-sm md:text-base transition-all shadow-md flex items-center gap-2 ${
                  selectedAlt
                    ? 'bg-[var(--color-amarelo-conquista)] text-[var(--color-azul-marinho)] hover:bg-yellow-400 cursor-pointer scale-100'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                }`}
              >
                Confirmar Resposta <ArrowRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-8 py-3.5 rounded-xl font-bold text-sm md:text-base bg-[var(--color-azul-autoridade)] text-white hover:bg-blue-900 transition-all shadow-lg flex items-center gap-2 animate-bounce-once"
              >
                {currentIndex + 1 < questoes.length ? 'Próxima Questão' : 'Finalizar Revisão'} <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
      ) : isFinished ? (
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-[var(--color-cinza-borda)] text-center space-y-6 max-w-lg mx-auto animate-fade-in">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Award size={44} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[var(--color-azul-autoridade)]">
              Sessão de Revisão Concluída!
            </h2>
            <p className="text-sm text-[var(--color-cinza-escuro)]">
              Você completou o desafio da Corujinha. Confira seus resultados e o XP ganho:
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border">
            <div>
              <span className="block text-xs uppercase font-bold text-gray-500">Acertos</span>
              <span className="text-xl font-black text-emerald-600">{acertos}</span>
            </div>
            <div>
              <span className="block text-xs uppercase font-bold text-gray-500">Erros</span>
              <span className="text-xl font-black text-red-600">{erros}</span>
            </div>
            <div>
              <span className="block text-xs uppercase font-bold text-gray-500">Aproveitamento</span>
              <span className="text-xl font-black text-[var(--color-azul-autoridade)]">
                {finalResult?.percentual ?? Math.round((acertos / Math.max(questoes.length, 1)) * 100)}%
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-[var(--color-azul-marinho)] p-4 rounded-xl font-extrabold flex items-center justify-center gap-3 shadow-md">
            <Sparkles size={24} />
            <span className="text-lg">XP Ganho no Desafio: +{finalResult?.xpGanho ?? acertos * 10} XP</span>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => fetchQuiz(filtroDisciplina)}
              className="px-6 py-3 rounded-xl bg-[var(--color-azul-autoridade)] text-white font-bold text-sm hover:bg-blue-900 transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <RotateCcw size={18} /> Praticar Novamente
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed text-gray-500 space-y-4">
          <p>Não há questões disponíveis para esta disciplina no momento.</p>
          <button
            onClick={() => fetchQuiz('todas')}
            className="px-6 py-2.5 bg-[var(--color-azul-autoridade)] text-white font-bold rounded-xl text-sm"
          >
            Ver Todas as Disciplinas
          </button>
        </div>
      )}
    </div>
  );
}
