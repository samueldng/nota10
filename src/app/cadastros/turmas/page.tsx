'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  Edit3,
  Eye,
  Trash2,
  GraduationCap,
  X,
  Save,
} from 'lucide-react';

interface Turma {
  id: string;
  nome: string;
  produto: string;
  turno: string;
  dias: string;
  semestre: string;
  professor: string;
  alunos: number;
  status: 'ativa' | 'inativa';
}

const mockTurmas: Turma[] = [
  { id: 'T001', nome: '5A Manhã', produto: 'Pré-CMT 5°', turno: 'Manhã', dias: 'Seg, Qua', semestre: '1° Sem 2026', professor: 'João Silva', alunos: 28, status: 'ativa' },
  { id: 'T002', nome: '5B Tarde', produto: 'Pré-CMT 5°', turno: 'Tarde', dias: 'Ter, Qui', semestre: '1° Sem 2026', professor: 'Maria Lucia', alunos: 25, status: 'ativa' },
  { id: 'T003', nome: '5C Manhã', produto: 'Pré-CMT 5°', turno: 'Manhã', dias: 'Sex, Sáb', semestre: '2° Sem 2026', professor: 'Ana Paula', alunos: 22, status: 'ativa' },
  { id: 'T004', nome: '4A Manhã', produto: 'Projeto 4°', turno: 'Manhã', dias: 'Seg, Qua', semestre: '1° Sem 2026', professor: 'Ana Paula', alunos: 10, status: 'ativa' },
  { id: 'T005', nome: '4B Tarde', produto: 'Projeto 4°', turno: 'Tarde', dias: 'Ter, Qui', semestre: '1° Sem 2026', professor: 'Carlos Roberto', alunos: 10, status: 'ativa' },
  { id: 'T006', nome: 'Reforço Geral', produto: 'Reforço', turno: 'Tarde', dias: 'Seg-Qui', semestre: '1° Sem 2026', professor: 'Carlos Roberto', alunos: 12, status: 'ativa' },
  { id: 'T007', nome: '5A Manhã 2025', produto: 'Pré-CMT 5°', turno: 'Manhã', dias: 'Seg, Qua', semestre: '2° Sem 2025', professor: 'João Silva', alunos: 30, status: 'inativa' },
];

export default function CadastroTurmasPage() {
  const [search, setSearch] = useState('');
  const [filterProduto, setFilterProduto] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);

  const filtered = mockTurmas.filter((t) => {
    if (search && !t.nome.toLowerCase().includes(search.toLowerCase()) && !t.professor.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterProduto && t.produto !== filterProduto) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-up">
        <p className="text-[var(--color-cinza-texto)]">
          Gerencie as turmas de cada produto.
        </p>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          Nova Turma
        </button>
      </div>

      {/* Filters */}
      <div className="card animate-fade-in-up delay-1">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-cinza-texto)]" />
            <input
              type="text"
              placeholder="Buscar turma ou professor..."
              className="form-input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="form-select w-auto" value={filterProduto} onChange={(e) => setFilterProduto(e.target.value)}>
            <option value="">Todos os Produtos</option>
            <option value="Pré-CMT 5°">Pré-CMT 5°</option>
            <option value="Projeto 4°">Projeto 4°</option>
            <option value="Reforço">Reforço</option>
          </select>
          <select className="form-select w-auto" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Todos Status</option>
            <option value="ativa">Ativa</option>
            <option value="inativa">Inativa</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 animate-fade-in-up delay-2">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome / Turno</th>
                <th>Produto</th>
                <th>Dias</th>
                <th>Semestre</th>
                <th>Professor</th>
                <th className="text-center">Alunos</th>
                <th>Status</th>
                <th className="text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((turma) => (
                <tr key={turma.id}>
                  <td className="font-mono text-sm font-bold text-[var(--color-azul-autoridade)]">{turma.id}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <GraduationCap size={16} className="text-[var(--color-azul-autoridade)]" />
                      <div>
                        <span className="font-semibold block">{turma.nome}</span>
                        <span className="text-xs text-[var(--color-cinza-texto)]">{turma.turno}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      turma.produto === 'Pré-CMT 5°' ? 'badge-info' :
                      turma.produto === 'Projeto 4°' ? 'badge-warning' :
                      'badge-success'
                    }`}>
                      {turma.produto}
                    </span>
                  </td>
                  <td className="text-sm">{turma.dias}</td>
                  <td className="text-sm">{turma.semestre}</td>
                  <td className="font-medium">{turma.professor}</td>
                  <td className="text-center font-bold">{turma.alunos}</td>
                  <td>
                    <span className={`badge ${turma.status === 'ativa' ? 'badge-success' : 'badge-error'}`}>
                      {turma.status === 'ativa' ? '🟢 Ativa' : '🔴 Inativa'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-[var(--color-azul-lightest)] transition-colors" title="Editar">
                        <Edit3 size={15} className="text-[var(--color-azul-autoridade)]" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-[var(--color-cinza-fundo)] transition-colors" title="Visualizar">
                        <Eye size={15} className="text-[var(--color-cinza-texto)]" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-[var(--color-vermelho-light)] transition-colors" title="Excluir">
                        <Trash2 size={15} className="text-[var(--color-vermelho-erro)]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-[var(--color-cinza-borda)] flex items-center justify-between">
          <span className="text-sm text-[var(--color-cinza-texto)]">
            Mostrando {filtered.length} de {mockTurmas.length} turmas
          </span>
          <div className="flex gap-1">
            {[1, 2, 3].map((p) => (
              <button
                key={p}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[var(--color-azul-autoridade)]">Nova Turma</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-[var(--color-cinza-fundo)] rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Nome da Turma</label>
                <input className="form-input" placeholder="Ex: 5C Manhã" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Produto</label>
                  <select className="form-select">
                    <option>Pré-CMT 5°</option>
                    <option>Projeto 4°</option>
                    <option>Reforço</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Turno</label>
                  <select className="form-select">
                    <option>Manhã</option>
                    <option>Tarde</option>
                    <option>Noite</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Dias da Semana</label>
                  <input className="form-input" placeholder="Ex: Seg, Qua" />
                </div>
                <div className="form-group">
                  <label className="form-label">Semestre / Ano</label>
                  <input className="form-input" placeholder="Ex: 1° Sem 2026" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Professor Responsável</label>
                <select className="form-select">
                  <option>João Silva</option>
                  <option>Maria Lucia</option>
                  <option>Ana Paula</option>
                  <option>Carlos Roberto</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-cinza-borda)]">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => setShowModal(false)}>
                <Save size={16} />
                Salvar Turma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
