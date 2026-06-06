'use client';

import { useState } from 'react';
import {
  Plus, Search, Edit3, Eye, Trash2, GraduationCap, X, Save, Clock, BookOpen, UserCog
} from 'lucide-react';
import {
  turmas as mockTurmas,
  professores,
  disciplinas,
  acompanhamentoLabels,
  type Acompanhamento,
  getAlunosByTurma
} from '@/lib/mockData';

export default function CadastroTurmasPage() {
  const [search, setSearch] = useState('');
  const [filterAcomp, setFilterAcomp] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTurmaId, setEditTurmaId] = useState<string | null>(null);

  const editTurma = editTurmaId ? mockTurmas.find(t => t.id === editTurmaId) : null;

  const filtered = mockTurmas.filter((t) => {
    if (search && !t.nome.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterAcomp && t.acompanhamento !== filterAcomp) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    return true;
  });

  const getProfessoresNomes = (profIds: string[]) => {
    return profIds.map(id => professores.find(p => p.id === id)?.nome || id).join(', ');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-up">
        <p className="text-[var(--color-cinza-texto)]">Gerencie as turmas de cada acompanhamento.</p>
        <button className="btn btn-primary" onClick={() => { setEditTurmaId(null); setShowModal(true); }}>
          <Plus size={16} /> Nova Turma
        </button>
      </div>

      <div className="card animate-fade-in-up delay-1">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-cinza-texto)]" />
            <input type="text" placeholder="Buscar turma..." className="form-input pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="form-select w-auto" value={filterAcomp} onChange={(e) => setFilterAcomp(e.target.value)}>
            <option value="">Todos Acompanhamentos</option>
            <option value="pre_cmt_5">Pré-CMT 5º Ano</option>
            <option value="projeto_4">Projeto 4º Ano</option>
            <option value="reforco">Reforço</option>
          </select>
          <select className="form-select w-auto" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Todos Status</option>
            <option value="ativa">Ativa</option>
            <option value="inativa">Inativa</option>
          </select>
        </div>
      </div>

      <div className="card p-0 animate-fade-in-up delay-2">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome / Turno</th>
                <th>Acompanhamento</th>
                <th>Dias / Horário</th>
                <th>Disciplinas</th>
                <th>Professores</th>
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
                      turma.acompanhamento === 'pre_cmt_5' ? 'badge-info' :
                      turma.acompanhamento === 'projeto_4' ? 'badge-warning' :
                      'badge-success'
                    }`}>
                      {acompanhamentoLabels[turma.acompanhamento]}
                    </span>
                  </td>
                  <td>
                    <div className="text-sm">
                      <span className="block">{turma.dias}</span>
                      <span className="flex items-center gap-1 text-xs text-[var(--color-cinza-texto)]"><Clock size={10} /> {turma.horario}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {turma.disciplinas.map(d => <span key={d} className="badge bg-gray-100 text-[10px]"><BookOpen size={10} /> {d}</span>)}
                    </div>
                  </td>
                  <td>
                    <span className="text-sm font-medium">{getProfessoresNomes(turma.professores)}</span>
                  </td>
                  <td className="text-center font-bold">{turma.alunosCount}</td>
                  <td>
                    <span className={`badge ${turma.status === 'ativa' ? 'badge-success' : 'badge-error'}`}>
                      {turma.status === 'ativa' ? '🟢 Ativa' : '🔴 Inativa'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => { setEditTurmaId(turma.id); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-[var(--color-azul-lightest)] transition-colors" title="Editar">
                        <Edit3 size={15} className="text-[var(--color-azul-autoridade)]" />
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
            Mostrando {filtered.length} de {mockTurmas.length} turmas
          </span>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-in-up p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[var(--color-azul-autoridade)]">{editTurma ? 'Editar Turma' : 'Nova Turma'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-[var(--color-cinza-fundo)] rounded-lg"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Nome da Turma</label>
                  <input className="form-input" defaultValue={editTurma?.nome || ''} placeholder="Ex: 5C Manhã" />
                </div>
                <div className="form-group">
                  <label className="form-label">Acompanhamento</label>
                  <select className="form-select" defaultValue={editTurma?.acompanhamento || ''}>
                    <option value="pre_cmt_5">Pré-CMT 5º Ano</option>
                    <option value="projeto_4">Projeto 4º Ano</option>
                    <option value="reforco">Reforço</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="form-group">
                  <label className="form-label">Turno</label>
                  <select className="form-select" defaultValue={editTurma?.turno || ''}>
                    <option>Manhã</option><option>Tarde</option><option>Noite</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Dias da Semana</label>
                  <input className="form-input" defaultValue={editTurma?.dias || ''} placeholder="Ex: Seg, Qua" />
                </div>
                <div className="form-group">
                  <label className="form-label">Horário</label>
                  <input className="form-input" defaultValue={editTurma?.horario || ''} placeholder="Ex: 08:00 - 12:00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Disciplinas vinculadas</label>
                  <div className="grid grid-cols-2 gap-2 p-3 bg-[var(--color-cinza-fundo)] rounded-xl">
                    {disciplinas.concat('Multidisciplinar').map(d => (
                      <label key={d} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" className="accent-[var(--color-azul-autoridade)] w-4 h-4" defaultChecked={editTurma?.disciplinas.includes(d)} />
                        <span>{d}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Professores vinculados</label>
                  <div className="flex flex-col gap-2 p-3 bg-[var(--color-cinza-fundo)] rounded-xl max-h-[120px] overflow-y-auto">
                    {professores.filter(p => p.status === 'ativo').map(p => (
                      <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" className="accent-[var(--color-azul-autoridade)] w-4 h-4" defaultChecked={editTurma?.professores.includes(p.id)} />
                        <span>{p.nome}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <div className="flex items-center gap-4 h-[42px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="statusTurma" defaultChecked={editTurma?.status !== 'inativa'} className="accent-[var(--color-verde-sucesso)]" />
                    <span className="text-sm font-medium">Ativa</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="statusTurma" defaultChecked={editTurma?.status === 'inativa'} className="accent-[var(--color-vermelho-erro)]" />
                    <span className="text-sm font-medium">Inativa</span>
                  </label>
                </div>
              </div>

              {editTurma && (
                <div className="bg-white border border-[var(--color-cinza-borda)] rounded-xl p-4 mt-2">
                  <p className="text-xs font-bold text-[var(--color-azul-autoridade)] mb-3 flex items-center justify-between">
                    <span>Alunos matriculados ({editTurma.alunosCount})</span>
                    <button className="text-[var(--color-azul-info)] hover:underline">Ver todos →</button>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {getAlunosByTurma(editTurma.id).slice(0, 4).map(a => (
                      <div key={a.id} className="flex items-center gap-2 text-xs bg-[var(--color-cinza-fundo)] p-2 rounded">
                        <UserCog size={12} className="text-[var(--color-cinza-texto)]" />
                        <span className="truncate">{a.nome}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-cinza-borda)]">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => setShowModal(false)}>
                <Save size={16} /> Salvar Turma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
