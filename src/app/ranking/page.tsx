'use client';

import { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Star,
  TrendingUp,
  Award,
  Zap,
  Target,
  Users,
  ChevronDown,
} from 'lucide-react';

interface RankingAluno {
  id?: string;
  posicao: number;
  nome: string;
  turma: string;
  pontuacaoTotal: number;
  presenca: number;
  videoaula: number;
  palavraChave: number;
  fixacao: number;
  comportamento: number;
  atencao: number;
  participacao: number;
  selos: string[];
  evolucao: 'subiu' | 'desceu' | 'manteve';
}

const seloIcons: Record<string, React.ReactNode> = {
  'Constância': <Zap size={12} />,
  'Evolução': <TrendingUp size={12} />,
  'Participação': <Users size={12} />,
  'Rotina Completa': <Target size={12} />,
  'Destaque da Semana': <Star size={12} />,
};

const seloColors: Record<string, string> = {
  'Constância': '#F5C800',
  'Evolução': '#22C55E',
  'Participação': '#3B82F6',
  'Rotina Completa': '#8B5CF6',
  'Destaque da Semana': '#EF4444',
};

function PosicaoMedalha({ pos }: { pos: number }) {
  if (pos === 1) return <div className="w-10 h-10 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-500 flex items-center justify-center shadow-lg"><Trophy size={20} className="text-white" /></div>;
  if (pos === 2) return <div className="w-10 h-10 rounded-full bg-gradient-to-b from-gray-300 to-gray-400 flex items-center justify-center shadow"><Medal size={20} className="text-white" /></div>;
  if (pos === 3) return <div className="w-10 h-10 rounded-full bg-gradient-to-b from-amber-500 to-amber-700 flex items-center justify-center shadow"><Award size={20} className="text-white" /></div>;
  return <div className="w-10 h-10 rounded-full bg-[var(--color-cinza-fundo)] flex items-center justify-center font-bold text-[var(--color-cinza-texto)]">{pos}</div>;
}

export default function RankingPage() {
  const [expandedAluno, setExpandedAluno] = useState<number | null>(null);
  const [rankingData, setRankingData] = useState<RankingAluno[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [turmaFilter, setTurmaFilter] = useState('');
  const [turmasDisponiveis, setTurmasDisponiveis] = useState<any[]>([]);

  useEffect(() => {
    async function fetchRanking() {
      setIsLoading(true);
      try {
        let url = '/api/ranking';
        if (turmaFilter) url += `?turmaId=${turmaFilter}`;
        const res = await fetch(url);
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
  }, [turmaFilter]);

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
          Estimule rotina, constância e participação. O ranking valoriza a dedicação diária, não apenas notas.
        </p>
      </div>

      {/* Filters */}
      <div className="card animate-fade-in-up delay-1">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="form-group">
            <label className="form-label">Acompanhamento</label>
            <select className="form-select">
              <option>Pré-CMT 5º Ano</option>
              <option>Projeto 4º Ano</option>
              <option>Reforço</option>
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
            <select className="form-select">
              <option>Semanal</option>
              <option>Mensal</option>
              <option>Bimestral</option>
              <option>Personalizado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Selos legend */}
      <div className="card animate-fade-in-up delay-2">
        <h3 className="text-sm font-bold text-[var(--color-azul-autoridade)] mb-3 flex items-center gap-2">
          <Award size={16} /> Selos de destaque
        </h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(seloIcons).map(([selo, icon]) => (
            <div key={selo} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-white" style={{ background: seloColors[selo] }}>
              {icon} {selo}
            </div>
          ))}
        </div>
      </div>

      {/* Ranking Table */}
      <div className="space-y-3 animate-fade-in-up delay-3">
        {isLoading ? (
          <div className="flex justify-center p-12">
             <div className="animate-spin w-10 h-10 border-4 border-[var(--color-azul-autoridade)] border-t-transparent rounded-full"></div>
          </div>
        ) : rankingData.length === 0 ? (
          <div className="text-center p-8 text-[var(--color-cinza-texto)] bg-[var(--color-cinza-fundo)] rounded-xl border border-dashed">
            Nenhum aluno encontrado.
          </div>
        ) : (
          rankingData.map((aluno) => (
            <div key={aluno.id || aluno.posicao} className={`card transition-all ${aluno.posicao <= 3 ? 'border-l-4' : ''}`} style={aluno.posicao <= 3 ? { borderLeftColor: aluno.posicao === 1 ? '#F5C800' : aluno.posicao === 2 ? '#9CA3AF' : '#D97706' } : {}}>
              <div className="flex items-center gap-4">
                <PosicaoMedalha pos={aluno.posicao} />
  
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-[var(--color-azul-autoridade)] text-sm m-0">{aluno.nome}</h4>
                    <span className="text-xs text-[var(--color-cinza-texto)]">• {aluno.turma}</span>
                    {aluno.evolucao === 'subiu' && <span className="text-[10px] text-[var(--color-verde-sucesso)] font-bold">↑ Subiu</span>}
                    {aluno.evolucao === 'desceu' && <span className="text-[10px] text-[var(--color-vermelho-erro)] font-bold">↓ Desceu</span>}
                  </div>
                  {aluno.selos?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {aluno.selos.map(selo => (
                        <span key={selo} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: seloColors[selo] }}>
                          {seloIcons[selo]} {selo}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
  
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-extrabold text-[var(--color-azul-autoridade)] leading-none">{aluno.pontuacaoTotal}</p>
                  <p className="text-[10px] text-[var(--color-cinza-texto)] font-medium">pontos</p>
                </div>
  
                <button className="p-2 hover:bg-[var(--color-cinza-fundo)] rounded-lg" onClick={() => setExpandedAluno(expandedAluno === aluno.posicao ? null : aluno.posicao)}>
                  <ChevronDown size={16} className={`transition-transform ${expandedAluno === aluno.posicao ? 'rotate-180' : ''}`} />
                </button>
              </div>
  
              {/* Expanded details */}
              {expandedAluno === aluno.posicao && (
                <div className="mt-4 pt-4 border-t border-[var(--color-cinza-borda)] animate-fade-in">
                  <p className="text-xs font-bold text-[var(--color-azul-autoridade)] mb-3 uppercase">Composição da pontuação</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    {[
                      { label: 'Presença', value: aluno.presenca, max: 20, color: '#22C55E' },
                      { label: 'Videoaula', value: aluno.videoaula, max: 20, color: '#8B5CF6' },
                      { label: 'Palavra-chave', value: aluno.palavraChave, max: 16, color: '#3B82F6' },
                      { label: 'Fixação', value: aluno.fixacao, max: 16, color: '#F59E0B' },
                      { label: 'Comportamento', value: aluno.comportamento, max: 10, color: '#EF4444' },
                      { label: 'Atenção', value: aluno.atencao, max: 10, color: '#06B6D4' },
                      { label: 'Participação', value: aluno.participacao, max: 8, color: '#EC4899' },
                    ].map(item => (
                      <div key={item.label} className="text-center">
                        <p className="text-[10px] font-bold text-[var(--color-cinza-texto)] uppercase mb-1">{item.label}</p>
                        <div className="w-full h-2 bg-[var(--color-cinza-fundo)] rounded-full overflow-hidden mb-1">
                          <div className="h-full rounded-full transition-all" style={{ width: `${(item.value / item.max) * 100}%`, background: item.color }} />
                        </div>
                        <p className="text-sm font-bold" style={{ color: item.color }}>{item.value}<span className="text-[10px] text-[var(--color-cinza-texto)] font-normal">/{item.max}</span></p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
