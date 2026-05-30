'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  Edit3,
  Eye,
  Trash2,
  X,
  Save,
  UserCheck,
  Phone,
} from 'lucide-react';

interface Aluno {
  id: string;
  numero: string;
  nome: string;
  turma: string;
  produto: string;
  status: 'ativo' | 'inativo';
  responsavel: string;
  telefone: string;
}

const mockAlunos: Aluno[] = [
  { id: '1', numero: '0123', nome: 'Ana Clara Pereira da Silva', turma: '5A Manhã', produto: 'Pré-CMT 5°', status: 'ativo', responsavel: 'Maria Pereira da Silva', telefone: '(11) 99999-1234' },
  { id: '2', numero: '0124', nome: 'Bruno Santos Lima', turma: '5A Manhã', produto: 'Pré-CMT 5°', status: 'ativo', responsavel: 'Cláudia Santos', telefone: '(11) 99999-5678' },
  { id: '3', numero: '0125', nome: 'Carla Beatriz Rocha', turma: '5B Tarde', produto: 'Pré-CMT 5°', status: 'inativo', responsavel: 'Fernanda Rocha', telefone: '(11) 99999-9012' },
  { id: '4', numero: '0126', nome: 'Davi Fernandes Costa', turma: '5A Manhã', produto: 'Pré-CMT 5°', status: 'ativo', responsavel: 'José Costa', telefone: '(11) 99999-3456' },
  { id: '5', numero: '0127', nome: 'Eduarda Martins Souza', turma: '4A Manhã', produto: 'Projeto 4°', status: 'ativo', responsavel: 'Rita Martins', telefone: '(11) 99999-7890' },
  { id: '6', numero: '0128', nome: 'Felipe Almeida Oliveira', turma: '4A Manhã', produto: 'Projeto 4°', status: 'ativo', responsavel: 'Marcos Almeida', telefone: '(11) 99999-2345' },
  { id: '7', numero: '0129', nome: 'Gabriela Pereira Santos', turma: 'Reforço Geral', produto: 'Reforço', status: 'ativo', responsavel: 'Paula Pereira', telefone: '(11) 99999-6789' },
  { id: '8', numero: '0130', nome: 'Henrique Ribeiro Gomes', turma: '5B Tarde', produto: 'Pré-CMT 5°', status: 'ativo', responsavel: 'Luciana Ribeiro', telefone: '(11) 99999-0123' },
];

export default function CadastroAlunosPage() {
  const [search, setSearch] = useState('');
  const [filterTurma, setFilterTurma] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editAluno, setEditAluno] = useState<Aluno | null>(null);

  const filtered = mockAlunos.filter((a) => {
    if (search && !a.nome.toLowerCase().includes(search.toLowerCase()) && !a.numero.includes(search)) return false;
    if (filterTurma && a.turma !== filterTurma) return false;
    if (filterStatus && a.status !== filterStatus) return false;
    return true;
  });

  const openEdit = (aluno: Aluno) => {
    setEditAluno(aluno);
    setShowModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-up">
        <p className="text-[var(--color-cinza-texto)]">
          Gerencie os alunos de cada turma.
        </p>
        <button className="btn btn-primary" onClick={() => { setEditAluno(null); setShowModal(true); }}>
          <Plus size={16} />
          Novo Aluno
        </button>
      </div>

      {/* Filters */}
      <div className="card animate-fade-in-up delay-1">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-cinza-texto)]" />
            <input
              type="text"
              placeholder="Buscar aluno por nome ou número..."
              className="form-input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="form-select w-auto" value={filterTurma} onChange={(e) => setFilterTurma(e.target.value)}>
            <option value="">Todas as Turmas</option>
            <option value="5A Manhã">5A Manhã</option>
            <option value="5B Tarde">5B Tarde</option>
            <option value="4A Manhã">4A Manhã</option>
            <option value="Reforço Geral">Reforço Geral</option>
          </select>
          <select className="form-select w-auto" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Todos Status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 animate-fade-in-up delay-2">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Nome Completo</th>
                <th>Turma</th>
                <th>Produto</th>
                <th>Responsável</th>
                <th>Telefone</th>
                <th>Status</th>
                <th className="text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((aluno) => (
                <tr key={aluno.id}>
                  <td className="font-mono text-sm font-bold text-[var(--color-azul-autoridade)]">{aluno.numero}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <UserCheck size={16} className="text-[var(--color-azul-autoridade)]" />
                      <span className="font-semibold">{aluno.nome}</span>
                    </div>
                  </td>
                  <td className="text-sm">{aluno.turma}</td>
                  <td>
                    <span className={`badge ${
                      aluno.produto === 'Pré-CMT 5°' ? 'badge-info' :
                      aluno.produto === 'Projeto 4°' ? 'badge-warning' :
                      'badge-success'
                    }`}>
                      {aluno.produto}
                    </span>
                  </td>
                  <td className="text-sm">{aluno.responsavel}</td>
                  <td>
                    <span className="flex items-center gap-1 text-sm">
                      <Phone size={12} className="text-[var(--color-cinza-texto)]" />
                      {aluno.telefone}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${aluno.status === 'ativo' ? 'badge-success' : 'badge-error'}`}>
                      {aluno.status === 'ativo' ? '🟢 Ativo' : '🔴 Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(aluno)} className="p-1.5 rounded-lg hover:bg-[var(--color-azul-lightest)] transition-colors" title="Editar">
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
        <div className="px-6 py-4 border-t border-[var(--color-cinza-borda)]">
          <span className="text-sm text-[var(--color-cinza-texto)]">
            Mostrando {filtered.length} de {mockAlunos.length} alunos
          </span>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[var(--color-azul-autoridade)]">
                {editAluno ? 'Editar Aluno' : 'Novo Aluno'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-[var(--color-cinza-fundo)] rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input className="form-input" defaultValue={editAluno?.nome || ''} placeholder="Nome completo do aluno" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Turma</label>
                  <select className="form-select" defaultValue={editAluno?.turma || ''}>
                    <option>5A Manhã</option>
                    <option>5B Tarde</option>
                    <option>4A Manhã</option>
                    <option>4B Tarde</option>
                    <option>Reforço Geral</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <div className="flex items-center gap-4 h-[42px]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="status" defaultChecked={editAluno?.status !== 'inativo'} className="accent-[var(--color-verde-sucesso)]" />
                      <span className="text-sm font-medium">Ativo</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="status" defaultChecked={editAluno?.status === 'inativo'} className="accent-[var(--color-vermelho-erro)]" />
                      <span className="text-sm font-medium">Inativo</span>
                    </label>
                  </div>
                </div>
              </div>

              {editAluno && (
                <div className="bg-[var(--color-cinza-fundo)] rounded-xl p-4">
                  <p className="text-sm font-bold text-[var(--color-azul-autoridade)] mb-2">
                    Responsáveis vinculados:
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-azul-autoridade)]" />
                      <span className="font-medium">{editAluno.responsavel}</span>
                      <span className="text-[var(--color-cinza-texto)]">(Mãe)</span>
                      <span className="text-[var(--color-cinza-texto)]">— {editAluno.telefone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-azul-autoridade)]" />
                      <span className="font-medium">José Carlos Silva</span>
                      <span className="text-[var(--color-cinza-texto)]">(Pai)</span>
                      <span className="text-[var(--color-cinza-texto)]">— (11) 99999-5678</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-cinza-borda)]">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => setShowModal(false)}>
                <Save size={16} />
                Salvar alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
