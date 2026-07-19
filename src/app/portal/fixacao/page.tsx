'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, CheckCircle2, XCircle, ArrowRight, RotateCcw, Award, Sparkles, HelpCircle, Loader2, Lock } from 'lucide-react';

export default function FixacaoApostilaPage() {
  const { user } = useAuth();
  const alunoId = user?.alunoId || 'a1';

  const [loading, setLoading] = useState(true);
  const [questoes, setQuestoes] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAlt, setSelectedAlt] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [finalResult, setFinalResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filtroBloco, setFiltroBloco] = useState('Bloco 1');

  const fetchQuestoes = async (bloco = 'Bloco 1') => {
    setLoading(true);
    setIsFinished(false);
    setCurrentIndex(0);
    setSelectedAlt(null);
    setIsAnswered(false);
    setAcertos(0);
    setErros(0);
    setFinalResult(null);

    try {
      const res = await fetch(`/api/questoes?bloco=${encodeURIComponent(bloco)}`);
      if (res.ok) {
        const data = await res.json();
        const lista = Array.isArray(data) && data.length > 0 ? data : [
          {
            id: 'mock-f1',
            disciplina: 'Português',
            bloco: bloco,
            enunciado: 'Sobre as regras de acentuação gráfica da língua portuguesa, assinale a alternativa cuja palavra seja paroxítona acentuada pela mesma regra que a palavra "FÁCEIS":',
            tipo: 'multipla_escolha',
            alternativas: [
              { id: 'A', texto: 'Tórax' },
              { id: 'B', texto: 'Possíveis' },
              { id: 'C', texto: 'Lâmpada' },
              { id: 'D', texto: 'Herói' }
            ],
            resposta_correta: 'B',
            explicacao: 'Tanto "fáceis" quanto "possíveis" são paroxítonas terminadas em ditongo oral seguidas do "s".',
            xp_valor: 15
          },
          {
            id: 'mock-f2',
            disciplina: 'Matemática',
            bloco: bloco,
            enunciado: 'Se a hipotenusa de um triângulo retângulo mede 10 cm e um dos catetos mede 6 cm, a medida do outro cateto é exatamente 8 cm.',
            tipo: 'verdadeiro_falso',
            alternativas: [
              { id: 'V', texto: 'Verdadeiro' },
              { id: 'F', texto: 'Falso' }
            ],
            resposta_correta: 'V',
            explicacao: 'Verdadeiro. Pelo Teorema de Pitágoras: a² = b² + c² -> 10² = 6² + c² -> 100 - 36 = c² -> c = √64 = 8 cm.',
            xp_valor: 15
          }
        ];
        setQuestoes(lista);
      }
    } catch (err) {
      console.error('Erro ao carregar questões de fixação:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestoes(filtroBloco);
  }, [filtroBloco]);

  const currentQ = questoes[currentIndex];

  const handleConfirm = () => {
    if (!selectedAlt || !currentQ || isAnswered) return;

    setIsAnswered(true);
    if (selectedAlt === currentQ.resposta_correta) {
      setAcertos(prev => prev + 1);
    } else {
      setErros(prev => prev + 1);
    }
  };

  const handleNext = async () => {
    if (currentIndex + 1 < questoes.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAlt(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      setSubmitting(true);
      const total = questoes.length;

      try {
        const res = await fetch('/api/questoes/finalizar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alunoId,
            atividadeRef: `fixacao_${filtroBloco.toLowerCase().replace(/\s+/g, '_')}`,
            totalQuestoes: total,
            acertos,
            erros,
            xpBase: 25
          })
        });

        if (res.ok) {
          const data = await res.json();
          setFinalResult(data);
        } else {
          setFinalResult({ success: true, acertos, erros, xpGanho: acertos * 15, percentual: Math.round((acertos / total) * 100) });
        }
      } catch (err) {
        console.error('Erro ao finalizar fixação:', err);
        setFinalResult({ success: true, acertos, erros, xpGanho: acertos * 15, percentual: Math.round((acertos / total) * 100) });
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-[var(--color-azul-autoridade)] animate-spin" />
        <p className="text-sm font-semibold text-[var(--color-cinza-texto)]">Carregando apostila e questões de fixação...</p>
      </div>
    );
  }

  let alternativasList = currentQ?.alternativas || [];
  if (typeof alternativasList === 'string') {
    try { alternativasList = JSON.parse(alternativasList); } catch (e) { alternativasList = []; }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--color-azul-marinho)] via-blue-900 to-[var(--color-azul-autoridade)] rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-500/30 text-blue-200 border border-blue-400/40 mb-2 uppercase">
            <BookOpen size={14} /> Apostila Digital & Fixação
          </span>
          <h1 className="text-2xl md:text-3xl font-black">
            Questões de Fixação do Módulo
          </h1>
          <p className="text-sm text-white/80 mt-1">
            Pratique com os exercícios passo a passo da apostila. A resposta é obrigatória em cada etapa para consolidação da matéria.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/20 shrink-0">
          <span className="text-xs uppercase font-bold text-blue-200">Módulo:</span>
          <select
            value={filtroBloco}
            onChange={(e) => setFiltroBloco(e.target.value)}
            className="bg-transparent text-white text-sm font-bold focus:outline-none cursor-pointer"
          >
            <option value="Bloco 1" className="text-gray-900">Bloco 1</option>
            <option value="Bloco 2" className="text-gray-900">Bloco 2</option>
            <option value="Bloco 3" className="text-gray-900">Bloco 3</option>
            <option value="Bloco 4" className="text-gray-900">Bloco 4</option>
          </select>
        </div>
      </div>

      {!isFinished && questoes.length > 0 ? (
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-[var(--color-cinza-borda)] space-y-6">
          {/* Barra de Progresso e Hard Block Banner */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-[var(--color-cinza-texto)]">
              <span className="flex items-center gap-1.5 text-[var(--color-azul-autoridade)]">
                <BookOpen size={16} /> Exercício {currentIndex + 1} de {questoes.length}
              </span>
              <span className="bg-gray-100 px-2.5 py-1 rounded-full text-gray-700">
                {currentQ.disciplina}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--color-azul-autoridade)] transition-all duration-500"
                style={{ width: `${((currentIndex + 1) / questoes.length) * 100}%` }}
              />
            </div>
          </div>

          {!isAnswered && (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-3.5 rounded-r-xl flex items-center gap-3 text-xs md:text-sm text-amber-900 font-medium">
              <Lock size={18} className="text-amber-600 shrink-0" />
              <span>
                <strong>Hard-block ativado:</strong> Para prosseguir para a próxima questão, você deve obrigatoriamente responder esta pergunta.
              </span>
            </div>
          )}

          {/* Enunciado */}
          <div className="py-2">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-relaxed">
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
                  onClick={() => setSelectedAlt(alt.id)}
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

          {/* Explicação */}
          {isAnswered && currentQ.explicacao && (
            <div className={`p-4 rounded-xl border text-sm flex items-start gap-3 animate-fade-in ${
              selectedAlt === currentQ.resposta_correta
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/80 border-amber-200 text-amber-900'
            }`}>
              <BookOpen className="shrink-0 mt-0.5" size={18} />
              <div>
                <strong className="font-bold block mb-1">Gabarito Comentado:</strong>
                {currentQ.explicacao}
              </div>
            </div>
          )}

          {/* Buttons com Hard Block */}
          <div className="pt-4 flex justify-end">
            {!isAnswered ? (
              <button
                type="button"
                disabled={!selectedAlt}
                onClick={handleConfirm}
                className={`px-8 py-3.5 rounded-xl font-bold text-sm md:text-base transition-all shadow-md flex items-center gap-2 ${
                  selectedAlt
                    ? 'bg-[var(--color-azul-autoridade)] text-white hover:bg-blue-900 cursor-pointer scale-100'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                }`}
              >
                Responder Questão <ArrowRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-8 py-3.5 rounded-xl font-bold text-sm md:text-base bg-[var(--color-amarelo-conquista)] text-[var(--color-azul-marinho)] hover:bg-yellow-400 transition-all shadow-lg flex items-center gap-2 animate-bounce-once"
              >
                {currentIndex + 1 < questoes.length ? 'Avançar para Próximo' : 'Concluir Fixação'} <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
      ) : isFinished ? (
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-[var(--color-cinza-borda)] text-center space-y-6 max-w-lg mx-auto animate-fade-in">
          <div className="w-20 h-20 bg-blue-100 text-[var(--color-azul-autoridade)] rounded-full flex items-center justify-center mx-auto shadow-inner">
            <BookOpen size={44} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[var(--color-azul-autoridade)]">
              Módulo de Fixação Concluído!
            </h2>
            <p className="text-sm text-[var(--color-cinza-escuro)]">
              Excelente! Você cumpriu todas as questões de fixação da apostila com hard-block e consolidou a matéria.
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

          <div className="bg-gradient-to-r from-blue-600 to-[var(--color-azul-autoridade)] text-white p-4 rounded-xl font-extrabold flex items-center justify-center gap-3 shadow-md">
            <Sparkles size={24} className="text-[var(--color-amarelo-conquista)]" />
            <span className="text-lg">XP Ganho na Fixação: +{finalResult?.xpGanho ?? acertos * 15} XP</span>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => fetchQuestoes(filtroBloco)}
              className="px-6 py-3 rounded-xl bg-[var(--color-azul-autoridade)] text-white font-bold text-sm hover:bg-blue-900 transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <RotateCcw size={18} /> Refazer Bloco
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
