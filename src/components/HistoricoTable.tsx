'use client';

import { useState, useTransition } from 'react';
import { format, parseISO } from 'date-fns';
import { Filter, Search, RotateCcw, Eye, Pencil, User, BarChart2, CheckCircle2, Clock, CheckCheck, Camera, Keyboard, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { getHistoricoPaginado, HistoricoParams } from '@/actions/historico';

type Registro = {
  id: number;
  data: string;
  acompanhamento: string; // Já vem traduzido pelo servidor
  turma: string;
  aluno: string;
  disciplina: string;
  bloco: string;
  professor: string;
  origem: string;
  status: string;
};

type PaginadoResponse = {
  registros: Registro[];
  totalRegistros: number;
  totalPages: number;
  currentPage: number;
};

type OptionObj = { value: string; label: string };

type OptionsList = {
  acompanhamentos: OptionObj[];
  turmas: string[];
  alunos: string[];
  professores: string[];
  disciplinas: string[];
  status: string[];
};

export default function HistoricoTable({ initialData, options }: { initialData: PaginadoResponse, options: OptionsList }) {
  const [isPending, startTransition] = useTransition();
  
  // Data State
  const [data, setData] = useState<PaginadoResponse>(initialData);
  
  // Filter State
  const [filtroAcomp, setFiltroAcomp] = useState('');
  const [filtroTurma, setFiltroTurma] = useState('');
  const [filtroAluno, setFiltroAluno] = useState('');
  const [filtroProfessor, setFiltroProfessor] = useState('');
  const [filtroDisciplina, setFiltroDisciplina] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  const fetchPage = (page: number, currentFilters?: HistoricoParams) => {
    startTransition(async () => {
      const params: HistoricoParams = currentFilters || {
        page,
        limit: 50,
        filtroAcomp,
        filtroTurma,
        filtroAluno,
        filtroProfessor,
        filtroDisciplina,
        filtroStatus,
      };
      
      try {
        const result = await getHistoricoPaginado(params);
        setData(result as any);
      } catch (err) {
        console.error("Erro ao buscar página:", err);
      }
    });
  };

  const handleApplyFilters = () => {
    // Ao aplicar filtros, reseta para a página 1
    fetchPage(1);
  };

  const clearFilters = () => {
    setFiltroAcomp('');
    setFiltroTurma('');
    setFiltroAluno('');
    setFiltroProfessor('');
    setFiltroDisciplina('');
    setFiltroStatus('');
    
    // Dispara a busca limpando os filtros
    fetchPage(1, {
      page: 1, limit: 50, filtroAcomp: '', filtroTurma: '', filtroAluno: '', filtroProfessor: '', filtroDisciplina: '', filtroStatus: ''
    });
  };

  const goToPrevPage = () => {
    if (data.currentPage > 1) fetchPage(data.currentPage - 1);
  };

  const goToNextPage = () => {
    if (data.currentPage < data.totalPages) fetchPage(data.currentPage + 1);
  };

  // Badges agora apenas recebem as strings já traduzidas do servidor
  const getAcompBadge = (nome: string) => {
    if (!nome) return <span className="text-gray-400">—</span>;
    if (nome.includes('Pré-CMT')) return <span className="px-2 py-1 bg-slate-100 text-slate-700 font-semibold text-xs rounded-md">{nome}</span>;
    if (nome.includes('Reforço')) return <span className="px-2 py-1 bg-green-100 text-green-700 font-semibold text-xs rounded-md">{nome}</span>;
    if (nome.includes('Projeto')) return <span className="px-2 py-1 bg-amber-100 text-amber-700 font-semibold text-xs rounded-md">{nome}</span>;
    return <span className="px-2 py-1 bg-gray-100 text-gray-700 font-semibold text-xs rounded-md">{nome}</span>;
  };

  const getStatusBadge = (status: string) => {
    if (!status) return <span className="text-gray-400">—</span>;
    const s = status.toLowerCase();
    if (s === 'salvo') return <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 font-semibold text-xs rounded-md"><CheckCircle2 size={12} /> Salvo</span>;
    if (s === 'revisado') return <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 font-semibold text-xs rounded-md"><CheckCheck size={12} /> Revisado</span>;
    if (s === 'pendente') return <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 font-semibold text-xs rounded-md"><Clock size={12} /> Pendente</span>;
    return <span className="px-2 py-1 bg-gray-100 text-gray-700 font-semibold text-xs rounded-md">{status}</span>;
  };

  const getOrigemBadge = (origem: string) => {
    if (!origem) return <span className="text-gray-400">—</span>;
    const o = origem.toLowerCase();
    if (o === 'manual') return <span className="inline-flex items-center gap-1 px-2 py-1 border border-blue-200 bg-blue-50 text-blue-600 font-semibold text-xs rounded-md"><Keyboard size={12} /> Manual</span>;
    if (o === 'foto' || o === 'ocr') return <span className="inline-flex items-center gap-1 px-2 py-1 border border-purple-200 bg-purple-50 text-purple-600 font-semibold text-xs rounded-md"><Camera size={12} /> Foto</span>;
    return <span className="px-2 py-1 border border-gray-200 bg-gray-50 text-gray-600 font-semibold text-xs rounded-md">{origem}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Filtros Avançados */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-5">
        <div className="flex items-center gap-2 text-slate-700 font-semibold mb-4">
          <Filter size={18} />
          <h2>Filtros avançados</h2>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <select 
            value={filtroAcomp} onChange={(e) => setFiltroAcomp(e.target.value)}
            className="flex-1 min-w-[150px] text-sm p-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-azul-primario)]"
          >
            <option value="">Todos Acompanhamentos</option>
            {options.acompanhamentos.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          
          <select 
            value={filtroTurma} onChange={(e) => setFiltroTurma(e.target.value)}
            className="flex-1 min-w-[150px] text-sm p-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-azul-primario)]"
          >
            <option value="">Todas Turmas</option>
            {options.turmas.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          <select 
            value={filtroAluno} onChange={(e) => setFiltroAluno(e.target.value)}
            className="flex-1 min-w-[150px] text-sm p-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-azul-primario)]"
          >
            <option value="">Todos Alunos</option>
            {options.alunos.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          <select 
            value={filtroProfessor} onChange={(e) => setFiltroProfessor(e.target.value)}
            className="flex-1 min-w-[150px] text-sm p-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-azul-primario)]"
          >
            <option value="">Todos Professores</option>
            {options.professores.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          <select 
            value={filtroDisciplina} onChange={(e) => setFiltroDisciplina(e.target.value)}
            className="flex-1 min-w-[150px] text-sm p-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-azul-primario)]"
          >
            <option value="">Todas Disciplinas</option>
            {options.disciplinas.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          <select 
            value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}
            className="flex-1 min-w-[150px] text-sm p-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-azul-primario)]"
          >
            <option value="">Todos Status</option>
            {options.status.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          <div className="flex gap-2">
            <button 
              onClick={handleApplyFilters}
              disabled={isPending}
              className="flex items-center justify-center min-w-[100px] gap-2 px-6 py-2 bg-[var(--color-amarelo-conquista)] hover:bg-yellow-500 disabled:opacity-70 disabled:cursor-wait text-white font-semibold rounded-lg shadow-sm transition-colors text-sm"
            >
              {isPending ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Filtrar
            </button>
            <button onClick={clearFilters} disabled={isPending} className="p-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-50 rounded-lg shadow-sm transition-colors" title="Limpar Filtros">
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Dados */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden relative">
        
        {/* Loading Overlay */}
        {isPending && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
            <Loader2 size={32} className="animate-spin text-[var(--color-azul-primario)]" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs uppercase bg-slate-50 text-slate-700 font-bold border-b border-gray-200">
              <tr>
                <th className="px-4 py-4 w-12 text-center">#</th>
                <th className="px-4 py-4">Data</th>
                <th className="px-4 py-4">Acompanhamento</th>
                <th className="px-4 py-4">Turma</th>
                <th className="px-4 py-4">Aluno</th>
                <th className="px-4 py-4">Disciplina</th>
                <th className="px-4 py-4">Bloco</th>
                <th className="px-4 py-4">Professor</th>
                <th className="px-4 py-4">Origem</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.registros.length > 0 ? (
                data.registros.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-center font-bold text-slate-800">{reg.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {reg.data ? (
                        reg.data.includes('-') && reg.data.length === 10
                          ? format(parseISO(reg.data), 'dd/MM/yyyy')
                          : reg.data
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{getAcompBadge(reg.acompanhamento)}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium whitespace-nowrap">{reg.turma || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{reg.aluno || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{reg.disciplina || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{reg.bloco || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{reg.professor || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{getOrigemBadge(reg.origem)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(reg.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-3 text-slate-400">
                        <button className="hover:text-[var(--color-azul-primario)] transition-colors"><Eye size={16} /></button>
                        <button className="hover:text-[var(--color-amarelo-conquista)] transition-colors"><Pencil size={16} /></button>
                        <button className="hover:text-green-600 transition-colors"><User size={16} /></button>
                        <button className="hover:text-purple-600 transition-colors"><BarChart2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search size={32} className="text-slate-300" />
                      <p>Nenhum registro corresponde aos filtros selecionados.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Paginação Server-Side (Controles UI) */}
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <div className="text-sm text-gray-500">
              Página <span className="font-semibold text-gray-700">{data.currentPage}</span> de <span className="font-semibold text-gray-700">{data.totalPages}</span>
              <span className="mx-2">•</span>
              <span className="font-semibold text-gray-700">{data.totalRegistros}</span> registros no total
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={goToPrevPage}
                disabled={data.currentPage === 1 || isPending}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} /> Anterior
              </button>
              <button 
                onClick={goToNextPage}
                disabled={data.currentPage === data.totalPages || isPending}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Próxima <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
