'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search, Filter, Download, Edit3, RotateCcw, History, CheckCircle2, ChevronDown, Eye, Camera, FileEdit, BarChart3, UserCheck, Clock,
} from 'lucide-react';
import { acompanhamentoLabels, type Acompanhamento, type StatusRegistro, type RegistroLancado, type LogAuditoria } from '@/lib/mockData';
import { getRegistros, getLogs } from '@/lib/api';

function statusBadge(s: StatusRegistro) {
  switch (s) {
    case 'salvo': return <span className="badge badge-success"><CheckCircle2 size={12} /> Salvo</span>;
    case 'pendente': return <span className="badge badge-warning"><Clock size={12} /> Pendente</span>;
    case 'revisado': return <span className="badge badge-info"><Eye size={12} /> Revisado</span>;
  }
}

function origemBadge(o: string) {
  return o === 'foto'
    ? <span className="badge text-[10px]" style={{ background: '#ede9fe', color: '#7c3aed' }}><Camera size={10} /> Foto</span>
    : <span className="badge text-[10px]" style={{ background: '#e8eef7', color: '#1A3A6B' }}><FileEdit size={10} /> Manual</span>;
}

export default function HistoricoPage() {
  const [showLog, setShowLog] = useState(true);
  const [filterAcomp, setFilterAcomp] = useState('');
  const [filterTurma, setFilterTurma] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [registros, setRegistros] = useState<RegistroLancado[]>([]);
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [regsData, logsData] = await Promise.all([getRegistros(), getLogs()]);
        setRegistros(regsData);
        setLogs(logsData);
      } catch (err) {
        console.error('Erro ao carregar do Supabase:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = registros.filter(r => {
    if (filterAcomp && r.acompanhamento !== filterAcomp) return false;
    if (filterTurma && r.turma !== filterTurma) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  });

  if (loading) return <div className="p-10 text-center text-[var(--color-cinza-texto)]">Carregando dados do Supabase...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Description */}
      <div className="animate-fade-in-up">
        <p className="text-[var(--color-cinza-texto)]">
          Central de consulta, revisão e auditoria de todos os registros lançados.
        </p>
      </div>

      {/* Filters */}
      <div className="card animate-fade-in-up delay-1">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-[var(--color-azul-autoridade)]" />
          <h3 className="text-sm font-bold text-[var(--color-azul-autoridade)] m-0">Filtros avançados</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3">
          <select className="form-select" value={filterAcomp} onChange={e => setFilterAcomp(e.target.value)}>
            <option value="">Todos Acompanhamentos</option>
            <option value="pre_cmt_5">Pré-CMT 5º Ano</option>
            <option value="projeto_4">Projeto 4º Ano</option>
            <option value="reforco">Reforço</option>
          </select>
          <select className="form-select" value={filterTurma} onChange={e => setFilterTurma(e.target.value)}>
            <option value="">Todas Turmas</option>
            <option value="5A Manhã">5A Manhã</option>
            <option value="5B Tarde">5B Tarde</option>
            <option value="4A Manhã">4A Manhã</option>
            <option value="4B Tarde">4B Tarde</option>
            <option value="Reforço Geral">Reforço Geral</option>
          </select>
          <select className="form-select"><option>Todos Alunos</option></select>
          <select className="form-select"><option>Todos Professores</option></select>
          <select className="form-select"><option>Todas Disciplinas</option><option>Português</option><option>Matemática</option></select>
          <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Todos Status</option>
            <option value="salvo">Salvo</option>
            <option value="pendente">Pendente</option>
            <option value="revisado">Revisado</option>
          </select>
          <div className="flex gap-2">
            <button className="btn btn-secondary flex-1"><Search size={14} /> Filtrar</button>
            <button className="btn btn-outline" onClick={() => { setFilterAcomp(''); setFilterTurma(''); setFilterStatus(''); }}>
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 animate-fade-in-up delay-2">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Data</th>
                <th>Acompanhamento</th>
                <th>Turma</th>
                <th>Aluno</th>
                <th>Disciplina</th>
                <th>Bloco</th>
                <th>Professor</th>
                <th>Origem</th>
                <th>Status</th>
                <th className="text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="font-bold text-[var(--color-azul-autoridade)]">{r.id}</td>
                  <td className="text-sm whitespace-nowrap">{r.data}</td>
                  <td>
                    <span className={`badge text-xs ${
                      r.acompanhamento === 'pre_cmt_5' ? 'badge-info' :
                      r.acompanhamento === 'projeto_4' ? 'badge-warning' :
                      'badge-success'
                    }`}>
                      {acompanhamentoLabels[r.acompanhamento as Acompanhamento]}
                    </span>
                  </td>
                  <td className="text-sm font-medium">{r.turma}</td>
                  <td className="text-sm">{r.aluno}</td>
                  <td className="text-sm">{r.disciplina}</td>
                  <td className="text-sm text-[var(--color-cinza-texto)]">{r.bloco}</td>
                  <td className="text-xs text-[var(--color-cinza-texto)] whitespace-nowrap">{r.professor}</td>
                  <td>{origemBadge(r.origem)}</td>
                  <td>{statusBadge(r.status)}</td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-[var(--color-azul-lightest)] transition-colors" title="Visualizar">
                        <Eye size={14} className="text-[var(--color-azul-autoridade)]" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-[var(--color-azul-lightest)] transition-colors" title="Editar">
                        <Edit3 size={14} className="text-[var(--color-azul-autoridade)]" />
                      </button>
                      <Link href="/cadastros/alunos" className="p-1.5 rounded-lg hover:bg-[var(--color-cinza-fundo)] transition-colors" title="Abrir aluno">
                        <UserCheck size={14} className="text-[var(--color-cinza-texto)]" />
                      </Link>
                      <Link href="/relatorios" className="p-1.5 rounded-lg hover:bg-[var(--color-cinza-fundo)] transition-colors" title="Gerar relatório">
                        <BarChart3 size={14} className="text-[var(--color-cinza-texto)]" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-[var(--color-cinza-borda)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button className="btn btn-outline text-xs"><Download size={14} /> CSV</button>
            <button className="btn btn-outline text-xs"><Download size={14} /> Excel</button>
          </div>
          <span className="text-sm text-[var(--color-cinza-texto)]">
            Mostrando {filtered.length} de {registros.length} registros
          </span>
          <div className="flex gap-1">
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  p === 1 ? 'bg-[var(--color-azul-autoridade)] text-white' : 'hover:bg-[var(--color-cinza-fundo)] text-[var(--color-cinza-texto)]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Log */}
      <div className="card animate-fade-in-up delay-3">
        <button className="flex items-center justify-between w-full" onClick={() => setShowLog(!showLog)}>
          <h3 className="text-base font-bold text-[var(--color-azul-autoridade)] flex items-center gap-2 m-0">
            <History size={18} /> Log de Alterações
          </h3>
          <ChevronDown size={18} className={`transition-transform ${showLog ? 'rotate-180' : ''}`} />
        </button>

        {showLog && (
          <div className="mt-4 space-y-3">
            {logs.map((log, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-cinza-fundo)] text-sm">
                <CheckCircle2 size={16} className="text-[var(--color-azul-info)] mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-mono text-xs text-[var(--color-cinza-texto)]">{log.data}</span>
                  <span className="mx-2 text-[var(--color-cinza-borda)]">|</span>
                  <span className="font-semibold text-[var(--color-azul-autoridade)]">{log.usuario}</span>
                  <span className="mx-1">{log.acao}</span>
                  {log.detalhe && <span className="text-[var(--color-cinza-texto)]">— {log.detalhe}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
