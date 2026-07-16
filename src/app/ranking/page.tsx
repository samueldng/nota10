'use client';

import { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Star,
  Zap,
  Award,
} from 'lucide-react';

interface RankingAluno {
  id: string;
  posicao: number;
  nome: string;
  turma_nome: string;
  xp_periodo: number;
  nivel_atual: number;
  selos: string[];
}

function PosicaoMedalha({ pos }: { pos: number }) {
  if (pos === 1) return <div className="w-10 h-10 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-500 flex items-center justify-center shadow-lg"><Trophy size={20} className="text-white" /></div>;
  if (pos === 2) return <div className="w-10 h-10 rounded-full bg-gradient-to-b from-gray-300 to-gray-400 flex items-center justify-center shadow"><Medal size={20} className="text-white" /></div>;
  if (pos === 3) return <div className="w-10 h-10 rounded-full bg-gradient-to-b from-amber-500 to-amber-700 flex items-center justify-center shadow"><Award size={20} className="text-white" /></div>;
  return <div className="w-10 h-10 rounded-full bg-[var(--color-cinza-fundo)] flex items-center justify-center font-bold text-[var(--color-cinza-texto)]">{pos}</div>;
}

export default function RankingPage() {
  const [rankingData, setRankingData] = useState<RankingAluno[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [turmaFilter, setTurmaFilter] = useState('');
  const [acompanhamentoFilter, setAcompanhamentoFilter] = useState('');
  const [periodoFilter, setPeriodoFilter] = useState('semanal');
  const [turmasDisponiveis, setTurmasDisponiveis] = useState<any[]>([]);

  // Carregar os dados de ranking com base nos filtros ativos
  useEffect(() => {
    async function fetchRanking() {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (turmaFilter) queryParams.append('turmaId', turmaFilter);
        if (acompanhamentoFilter) queryParams.append('acompanhamento', acompanhamentoFilter);
        if (periodoFilter) queryParams.append('periodo', periodoFilter);

        const res = await fetch(`/api/ranking?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setRankingData(data);
        }
      } catch (err) {
        console.error('Erro ao buscar ranking:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRanking();
  }, [turmaFilter, acompanhamentoFilter, periodoFilter]);

  // Carregar as turmas disponíveis no sistema
  useEffect(() => {
    async function fetchTurmas() {
      try {
        const res = await fetch('/api/turmas');
        if (res.ok) setTurmasDisponiveis(await res.json());
      } catch (err) {}
    }
    fetchTurmas();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="animate-fade-in-up">
        <p className="text-[var(--color-cinza-texto)]">
          Estimule rotina, constância e participação. O ranking valoriza a dedicação diária e o XP conquistado.
        </p>
      </div>

      {/* Filtros Dinâmicos */}
      <div className="card animate-fade-in-up delay-1">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="form-group">
            <label className="form-label">Acompanhamento</label>
            <select
              className="form-select"
              value={acompanhamentoFilter}
              onChange={e => setAcompanhamentoFilter(e.target.value)}
            >
              <option value="">Todos os Acompanhamentos</option>
              <option value="pre_cmt_5">Pré-CMT 5º Ano</option>
              <option value="projeto_4">Projeto 4º Ano</option>
              <option value="reforco">Reforço</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Turma</label>
            <select className="form-select" value={turmaFilter} onChange={e => setTurmaFilter(e.target.value)}>
              <option value="">Todas as Turmas</option>
              {turmasDisponiveis.map(t => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Período</label>
            <select
              className="form-select"
              value={periodoFilter}
              onChange={e => setPeriodoFilter(e.target.value)}
            >
              <option value="semanal">Semanal</option>
              <option value="mensal">Mensal</option>
              <option value="geral">Geral</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Ranking */}
      <div className="space-y-3 animate-fade-in-up delay-2">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin w-10 h-10 border-4 border-[var(--color-azul-autoridade)] border-t-transparent rounded-full"></div>
          </div>
        ) : rankingData.length === 0 ? (
          <div className="text-center p-8 text-[var(--color-cinza-texto)] bg-[var(--color-cinza-fundo)] rounded-xl border border-dashed">
            Nenhum aluno encontrado para os filtros selecionados.
          </div>
        ) : (
          rankingData.map((aluno) => (
            <div
              key={aluno.id}
              className={`card transition-all ${aluno.posicao <= 3 ? 'border-l-4' : ''}`}
              style={aluno.posicao <= 3 ? { borderLeftColor: aluno.posicao === 1 ? '#F5C800' : aluno.posicao === 2 ? '#9CA3AF' : '#D97706' } : {}}
            >
              <div className="flex items-center gap-4">
                <PosicaoMedalha pos={aluno.posicao} />
  
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-[var(--color-azul-autoridade)] text-sm m-0">{aluno.nome}</h4>
                    <span className="text-xs text-[var(--color-cinza-texto)]">• {aluno.turma_nome}</span>
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-[var(--color-azul-lightest)] text-[var(--color-azul-autoridade)] text-[10px] font-bold">
                      Nível {aluno.nivel_atual}
                    </span>
                  </div>
                  {aluno.selos && aluno.selos.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {aluno.selos.map(selo => (
                        <span key={selo} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-blue-500">
                          <Star size={10} /> {selo}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
  
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-extrabold text-[var(--color-azul-autoridade)] leading-none flex items-center justify-end gap-1">
                    <Zap size={18} className="text-[var(--color-amarelo-conquista)] fill-[var(--color-amarelo-conquista)]" />
                    {aluno.xp_periodo}
                  </p>
                  <p className="text-[10px] text-[var(--color-cinza-texto)] font-medium">XP ganho</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
