'use client';

import { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Edit3,
  RotateCcw,
  History,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';

interface Registro {
  id: number;
  data: string;
  aluno: string;
  turma: string;
  produto: string;
  disciplina: string;
  presenca: 'P' | 'A' | 'F';
  video: number;
  palavraChave: number;
  fixacao: number;
  atencao: number;
  participacao: number;
  comportamento: number;
  buscaResp: number;
  lancadoPor: string;
}

const mockRegistros: Registro[] = [
  { id: 1, data: '28/05/2026', aluno: 'Ana Clara Silva', turma: '5A Manhã', produto: 'Pré-CMT 5°', disciplina: 'Português', presenca: 'P', video: 5, palavraChave: 4, fixacao: 4, atencao: 5, participacao: 4, comportamento: 5, buscaResp: 4, lancadoPor: 'Prof. João' },
  { id: 2, data: '28/05/2026', aluno: 'Bruno Santos Lima', turma: '5A Manhã', produto: 'Pré-CMT 5°', disciplina: 'Português', presenca: 'P', video: 4, palavraChave: 3, fixacao: 3, atencao: 4, participacao: 3, comportamento: 4, buscaResp: 3, lancadoPor: 'Prof. João' },
  { id: 3, data: '28/05/2026', aluno: 'Carla Beatriz Rocha', turma: '5A Manhã', produto: 'Pré-CMT 5°', disciplina: 'Português', presenca: 'A', video: 0, palavraChave: 0, fixacao: 0, atencao: 0, participacao: 0, comportamento: 0, buscaResp: 0, lancadoPor: 'Prof. João' },
  { id: 4, data: '28/05/2026', aluno: 'Davi Fernandes Costa', turma: '5A Manhã', produto: 'Pré-CMT 5°', disciplina: 'Português', presenca: 'P', video: 5, palavraChave: 5, fixacao: 4, atencao: 4, participacao: 5, comportamento: 4, buscaResp: 5, lancadoPor: 'Prof. João' },
  { id: 5, data: '27/05/2026', aluno: 'Eduarda Martins', turma: '4A Manhã', produto: 'Projeto 4°', disciplina: 'Matemática', presenca: 'P', video: 3, palavraChave: 4, fixacao: 3, atencao: 3, participacao: 4, comportamento: 5, buscaResp: 2, lancadoPor: 'Prof. Ana' },
  { id: 6, data: '27/05/2026', aluno: 'Felipe Almeida', turma: '4A Manhã', produto: 'Projeto 4°', disciplina: 'Matemática', presenca: 'P', video: 4, palavraChave: 3, fixacao: 4, atencao: 5, participacao: 4, comportamento: 3, buscaResp: 4, lancadoPor: 'Prof. Ana' },
  { id: 7, data: '26/05/2026', aluno: 'Gabriela Pereira', turma: 'Reforço', produto: 'Reforço', disciplina: 'Todas', presenca: 'P', video: 5, palavraChave: 5, fixacao: 5, atencao: 5, participacao: 5, comportamento: 5, buscaResp: 5, lancadoPor: 'Prof. Carlos' },
  { id: 8, data: '26/05/2026', aluno: 'Henrique Ribeiro', turma: '5B Tarde', produto: 'Pré-CMT 5°', disciplina: 'Matemática', presenca: 'F', video: 0, palavraChave: 0, fixacao: 0, atencao: 0, participacao: 0, comportamento: 0, buscaResp: 0, lancadoPor: 'Prof. Maria' },
];

const logAlteracoes = [
  { data: '28/05 14:32', usuario: 'Prof. João', acao: 'editou registro #1', detalhe: 'Fixação: 3 → 4' },
  { data: '27/05 09:15', usuario: 'Coord. Ana', acao: 'adicionou registro #5', detalhe: '' },
  { data: '26/05 16:45', usuario: 'Prof. Carlos', acao: 'editou registro #7', detalhe: 'Vídeo: 4 → 5' },
  { data: '25/05 11:20', usuario: 'Prof. Maria', acao: 'lançou registros #8', detalhe: 'Via foto' },
];

function scoreColor(val: number) {
  if (val === 0) return 'text-[var(--color-cinza-texto)]';
  if (val >= 4) return 'text-[var(--color-verde-sucesso)]';
  if (val >= 3) return 'text-[var(--color-amarelo-alerta)]';
  return 'text-[var(--color-vermelho-erro)]';
}

function presencaBadge(p: 'P' | 'A' | 'F') {
  if (p === 'P') return <span className="badge badge-success">P</span>;
  if (p === 'A') return <span className="badge badge-warning">A</span>;
  return <span className="badge badge-error">F</span>;
}

export default function RegistrosPage() {
  const [showLog, setShowLog] = useState(true);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Filters */}
      <div className="card animate-fade-in-up">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-[var(--color-azul-autoridade)]" />
          <h3 className="text-sm font-bold text-[var(--color-azul-autoridade)] m-0">Filtros avançados</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <select className="form-select"><option>Todos Produtos</option><option>Pré-CMT 5°</option><option>Projeto 4°</option><option>Reforço</option></select>
          <select className="form-select"><option>Todas Turmas</option><option>5A Manhã</option><option>5B Tarde</option><option>4A Manhã</option></select>
          <select className="form-select"><option>Todos Alunos</option></select>
          <input type="text" className="form-input" placeholder="Período: 01/05 - 31/05" />
          <select className="form-select"><option>Todas Disciplinas</option><option>Português</option><option>Matemática</option></select>
          <div className="flex gap-2">
            <button className="btn btn-secondary flex-1">
              <Search size={14} />
              Filtrar
            </button>
            <button className="btn btn-outline">
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 animate-fade-in-up delay-1">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Data</th>
                <th>Aluno</th>
                <th>Produto</th>
                <th>Disc.</th>
                <th className="text-center">Pres.</th>
                <th className="text-center">Víd.</th>
                <th className="text-center">P.Ch.</th>
                <th className="text-center">Fix.</th>
                <th className="text-center">Aten.</th>
                <th className="text-center">Part.</th>
                <th className="text-center">Comp.</th>
                <th className="text-center">B.R.</th>
                <th>Por</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {mockRegistros.map((r) => (
                <tr key={r.id}>
                  <td className="font-bold text-[var(--color-azul-autoridade)]">{r.id}</td>
                  <td className="text-sm whitespace-nowrap">{r.data}</td>
                  <td className="font-medium whitespace-nowrap">{r.aluno}</td>
                  <td>
                    <span className={`badge text-xs ${
                      r.produto === 'Pré-CMT 5°' ? 'badge-info' :
                      r.produto === 'Projeto 4°' ? 'badge-warning' :
                      'badge-success'
                    }`}>
                      {r.produto}
                    </span>
                  </td>
                  <td className="text-sm">{r.disciplina}</td>
                  <td className="text-center">{presencaBadge(r.presenca)}</td>
                  <td className={`text-center font-bold ${scoreColor(r.video)}`}>{r.video || '—'}</td>
                  <td className={`text-center font-bold ${scoreColor(r.palavraChave)}`}>{r.palavraChave || '—'}</td>
                  <td className={`text-center font-bold ${scoreColor(r.fixacao)}`}>{r.fixacao || '—'}</td>
                  <td className={`text-center font-bold ${scoreColor(r.atencao)}`}>{r.atencao || '—'}</td>
                  <td className={`text-center font-bold ${scoreColor(r.participacao)}`}>{r.participacao || '—'}</td>
                  <td className={`text-center font-bold ${scoreColor(r.comportamento)}`}>{r.comportamento || '—'}</td>
                  <td className={`text-center font-bold ${scoreColor(r.buscaResp)}`}>{r.buscaResp || '—'}</td>
                  <td className="text-xs text-[var(--color-cinza-texto)] whitespace-nowrap">{r.lancadoPor}</td>
                  <td>
                    <button className="p-1.5 rounded-lg hover:bg-[var(--color-azul-lightest)] transition-colors">
                      <Edit3 size={14} className="text-[var(--color-azul-autoridade)]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-[var(--color-cinza-borda)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button className="btn btn-outline text-xs">
              <Download size={14} />
              CSV
            </button>
            <button className="btn btn-outline text-xs">
              <Download size={14} />
              Excel
            </button>
          </div>
          <span className="text-sm text-[var(--color-cinza-texto)]">
            Mostrando 8 de 156 registros
          </span>
          <div className="flex gap-1">
            {[1, 2, 3, '...', 20].map((p, i) => (
              <button
                key={i}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  p === 1
                    ? 'bg-[var(--color-azul-autoridade)] text-white'
                    : 'hover:bg-[var(--color-cinza-fundo)] text-[var(--color-cinza-texto)]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Log */}
      <div className="card animate-fade-in-up delay-2">
        <button
          className="flex items-center justify-between w-full"
          onClick={() => setShowLog(!showLog)}
        >
          <h3 className="text-base font-bold text-[var(--color-azul-autoridade)] flex items-center gap-2 m-0">
            <History size={18} />
            Log de Alterações
          </h3>
          <ChevronDown size={18} className={`transition-transform ${showLog ? 'rotate-180' : ''}`} />
        </button>

        {showLog && (
          <div className="mt-4 space-y-3">
            {logAlteracoes.map((log, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-cinza-fundo)] text-sm"
              >
                <CheckCircle2 size={16} className="text-[var(--color-azul-info)] mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-mono text-xs text-[var(--color-cinza-texto)]">{log.data}</span>
                  <span className="mx-2 text-[var(--color-cinza-borda)]">|</span>
                  <span className="font-semibold text-[var(--color-azul-autoridade)]">{log.usuario}</span>
                  <span className="mx-1">{log.acao}</span>
                  {log.detalhe && (
                    <span className="text-[var(--color-cinza-texto)]">— {log.detalhe}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
