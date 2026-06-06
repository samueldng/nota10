'use client';

import { useState } from 'react';
import { Plus, Search, Edit3, Eye, X, Save, UserCog, Mail, GraduationCap } from 'lucide-react';
import { professores as mockProfessores, turmas } from '@/lib/mockData';

export default function CadastroProfessoresPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);

  const filtered = mockProfessores.filter(p => {
    if (search && !p.nome.toLowerCase().includes(search.toLowerCase()) && !p.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    return true;
  });

  const getTurmasNomes = (turmaIds: string[]) => {
    return turmaIds.map(id => turmas.find(t => t.id === id)?.nome || id).join(', ');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-up">
        <p className="text-[var(--color-cinza-texto)]">Gerencie os professores do sistema.</p>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Novo Professor
        </button>
      </div>

      <div className="card animate-fade-in-up delay-1">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-cinza-texto)]" />
            <input type="text" placeholder="Buscar professor..." className="form-input pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-select w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Todos Status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
      </div>

      <div className="card p-0 animate-fade-in-up delay-2">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Turmas vinculadas</th>
                <th>Status</th>
                <th className="text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <UserCog size={16} className="text-[var(--color-azul-autoridade)]" />
                      <span className="font-semibold">{p.nome}</span>
                    </div>
                  </td>
                  <td>
                    <span className="flex items-center gap-1 text-sm text-[var(--color-cinza-texto)]">
                      <Mail size={12} /> {p.email}
                    </span>
                  </td>
                  <td>
                    {p.turmas.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {p.turmas.map(tId => {
                          const t = turmas.find(x => x.id === tId);
                          return t ? (
                            <span key={tId} className="badge badge-info text-[10px]">
                              <GraduationCap size={10} /> {t.nome}
                            </span>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--color-cinza-texto)]">Nenhuma turma</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${p.status === 'ativo' ? 'badge-success' : 'badge-error'}`}>
                      {p.status === 'ativo' ? '🟢 Ativo' : '🔴 Inativo'}
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-[var(--color-cinza-borda)]">
          <span className="text-sm text-[var(--color-cinza-texto)]">
            Mostrando {filtered.length} de {mockProfessores.length} professores
          </span>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[var(--color-azul-autoridade)]">Novo Professor</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-[var(--color-cinza-fundo)] rounded-lg"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input className="form-input" placeholder="Nome do professor" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="email@nota10.edu.br" />
              </div>
              <div className="form-group">
                <label className="form-label">Turmas vinculadas</label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-[var(--color-cinza-fundo)] rounded-xl">
                  {turmas.filter(t => t.status === 'ativa').map(t => (
                    <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" className="accent-[var(--color-azul-autoridade)] w-4 h-4" />
                      <span>{t.nome}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <div className="flex items-center gap-4 h-[42px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="status" defaultChecked className="accent-[var(--color-verde-sucesso)]" />
                    <span className="text-sm font-medium">Ativo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="status" className="accent-[var(--color-vermelho-erro)]" />
                    <span className="text-sm font-medium">Inativo</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-cinza-borda)]">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => setShowModal(false)}>
                <Save size={16} /> Salvar Professor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
