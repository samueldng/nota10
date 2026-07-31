'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Loader2,
  FileText,
  Star,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Target,
  Award
} from 'lucide-react';
import { RelatorioOficial } from '@/components/RelatorioOficial';

type Acompanhamento = 'pre_cmt_5' | 'projeto_4' | 'reforco';

interface TurmaOption {
  id: string;
  nome: string;
  acompanhamento: Acompanhamento;
}

interface AlunoOption {
  id: string;
  nome: string;
  turmaId: string;
}

interface ParecerIA {
  pontosFortes: string[];
  pontosAMelhorar: string[];
  orientacaoPratica: string;
  parecerGeral: string;
}

interface RelatorioResult {
  aluno: {
    id: string;
    nome: string;
    numero: string;
    xpTotal: number;
    nivel: number;
    frequencia: number;
  };
  parecer: ParecerIA;
}

const acompanhamentoLabels: Record<Acompanhamento, string> = {
  pre_cmt_5: 'Pré-CMT 5º Ano',
  projeto_4: 'Projeto 4º Ano',
  reforco: 'Reforço',
};

export default function RelatoriosPage() {
  // ── Filtros ──
  const [selectedAcomp, setSelectedAcomp] = useState<Acompanhamento | ''>('');
  const [selectedTurma, setSelectedTurma] = useState('');
  const [selectedAluno, setSelectedAluno] = useState('');
  const [selectedPeriodo, setSelectedPeriodo] = useState('');

  // ── Dados ──
  const [turmas, setTurmas] = useState<TurmaOption[]>([]);
  const [alunos, setAlunos] = useState<AlunoOption[]>([]);

  // ── Estado ──
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<RelatorioResult | null>(null);

  // Carregar turmas no mount
  useEffect(() => {
    async function loadTurmas() {
      try {
        const res = await fetch('/api/turmas');
        if (res.ok) setTurmas(await res.json());
      } catch (err) {
        console.error('Erro ao carregar turmas:', err);
      }
    }
    loadTurmas();
  }, []);

  // Carregar alunos quando turma muda
  useEffect(() => {
    if (!selectedTurma) {
      setAlunos([]);
      setSelectedAluno('');
      return;
    }
    async function loadAlunos() {
      try {
        const res = await fetch('/api/alunos');
        if (res.ok) {
          const todos = await res.json();
          setAlunos(todos.filter((a: AlunoOption) => a.turmaId === selectedTurma));
          setSelectedAluno('');
        }
      } catch (err) {
        console.error('Erro ao carregar alunos:', err);
      }
    }
    loadAlunos();
  }, [selectedTurma]);

  // Reset cascata
  useEffect(() => {
    setSelectedTurma('');
    setSelectedAluno('');
    setResult(null);
  }, [selectedAcomp]);

  const turmasFiltradas = turmas.filter(t => t.acompanhamento === selectedAcomp);

  const canGenerate = selectedAcomp && selectedTurma && selectedAluno;

  const handleGerar = async () => {
    if (!canGenerate) return;
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/relatorios/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alunoId: selectedAluno,
          periodo: selectedPeriodo || undefined,
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erro ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar relatório');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="animate-fade-in-up">
        <p className="text-sm text-[var(--color-cinza-texto)]">
          Acompanhe o desempenho e o desenvolvimento do aluno com gráficos por disciplina e parecer pedagógico gerado por IA.
        </p>
      </div>

      {/* Formulário de Filtros */}
      <div className="card animate-fade-in-up">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          
          {/* Acompanhamento */}
          <div className="form-group">
            <label className="form-label font-bold text-xs uppercase tracking-wider">Acompanhamento</label>
            <select
              className="form-select"
              value={selectedAcomp}
              onChange={e => setSelectedAcomp(e.target.value as Acompanhamento | '')}
            >
              <option value="">Selecione...</option>
              {Object.entries(acompanhamentoLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Turma */}
          <div className="form-group">
            <label className="form-label font-bold text-xs uppercase tracking-wider">Turma</label>
            <select
              className="form-select"
              value={selectedTurma}
              onChange={e => setSelectedTurma(e.target.value)}
              disabled={!selectedAcomp}
            >
              <option value="">Selecione...</option>
              {turmasFiltradas.map(t => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </div>

          {/* Aluno */}
          <div className="form-group">
            <label className="form-label font-bold text-xs uppercase tracking-wider">Aluno</label>
            <select
              className="form-select"
              value={selectedAluno}
              onChange={e => setSelectedAluno(e.target.value)}
              disabled={!selectedTurma}
            >
              <option value="">Selecione...</option>
              {alunos.map(a => (
                <option key={a.id} value={a.id}>{a.nome}</option>
              ))}
            </select>
          </div>

          {/* Período */}
          <div className="form-group">
            <label className="form-label font-bold text-xs uppercase tracking-wider">Período</label>
            <input
              type="date"
              className="form-input"
              value={selectedPeriodo}
              onChange={e => setSelectedPeriodo(e.target.value)}
            />
          </div>
        </div>

        {/* Botão Gerar */}
        <div className="mt-6">
          <button
            className="btn btn-primary w-full sm:w-auto px-8 py-3 text-sm font-bold flex items-center justify-center gap-2"
            onClick={handleGerar}
            disabled={!canGenerate || isLoading}
          >
            {isLoading ? (
              <><Loader2 size={18} className="animate-spin" /> Gerando parecer...</>
            ) : (
              <><TrendingUp size={18} /> Gerar relatório</>
            )}
          </button>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="card animate-fade-in-up border-l-4 border-[var(--color-vermelho-erro)] bg-red-50">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-[var(--color-vermelho-erro)] shrink-0" />
            <p className="text-sm font-medium text-[var(--color-vermelho-erro)]">{error}</p>
          </div>
        </div>
      )}

      {/* Resultado do Relatório */}
      {result && (
        <div className="space-y-5 animate-fade-in-up">

          {/* Card do Aluno */}
          <div className="card border-t-4 border-[var(--color-azul-autoridade)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[var(--color-azul-lightest)] flex items-center justify-center">
                  <FileText size={24} className="text-[var(--color-azul-autoridade)]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-azul-autoridade)]">{result.aluno.nome}</h2>
                  <p className="text-xs text-[var(--color-cinza-texto)]">
                    Nº {result.aluno.numero} · Nível {result.aluno.nivel || 1} · {result.aluno.xpTotal || 0} XP · Frequência {result.aluno.frequencia}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-success text-xs">
                  <CheckCircle2 size={12} /> Parecer gerado
                </span>
              </div>
            </div>
          </div>

          <RelatorioOficial dadosGerais={result} parecerIA={result.parecer} />

        </div>
      )}
    </div>
  );
}
