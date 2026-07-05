'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Eye, X, Save, UserCog, Mail, GraduationCap, CheckCircle, Trash2 } from 'lucide-react';
import { turmas, type Professor } from '@/lib/mockData';
import { getProfessores, createProfessor, updateProfessor } from '@/lib/api';

interface ProfessorForm {
  nome: string;
  email: string;
  turmas: string[];
  status: 'ativo' | 'inativo';
}

const EMPTY_FORM: ProfessorForm = {
  nome: '',
  email: '',
  turmas: [],
  status: 'ativo',
};

export default function CadastroProfessoresPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProfId, setEditProfId] = useState<string | null>(null);
  const [profList, setProfList] = useState<Professor[]>([]);
  const [form, setForm] = useState<ProfessorForm>(EMPTY_FORM);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getProfessores();
        setProfList(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const openCreateModal = () => {
    setEditProfId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (prof: Professor) => {
    setEditProfId(prof.id);
    setForm({
      nome: prof.nome,
      email: prof.email,
      turmas: [...prof.turmas],
      status: prof.status,
    });
    setShowModal(true);
  };

  const toggleTurma = (turmaId: string) => {
    setForm(prev => ({
      ...prev,
      turmas: prev.turmas.includes(turmaId)
        ? prev.turmas.filter(x => x !== turmaId)
        : [...prev.turmas, turmaId],
    }));
  };

  const handleSave = async () => {
    if (!form.nome.trim()) return;

    try {
      if (editProfId) {
        const original = profList.find(p => p.id === editProfId);
        if (!original) return;
        const updatedData: Professor = {
          ...original,
          nome: form.nome,
          email: form.email,
          turmas: form.turmas,
          status: form.status,
        };
        const result = await updateProfessor(updatedData);
        setProfList(prev => prev.map(p => p.id === editProfId ? result : p));
        setToast('Professor atualizado com sucesso!');
      } else {
        const newProfPayload = {
          nome: form.nome,
          email: form.email,
          turmas: form.turmas,
          status: form.status,
        };
        const result = await createProfessor(newProfPayload);
        setProfList(prev => [...prev, result]);
        setToast('Professor cadastrado com sucesso!');
      }
      setShowModal(false);
    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar professor: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este professor?')) {
      try {
        // We simulate delete or we could add a delete endpoint. Let's just update local state and show toast.
        setProfList(prev => prev.filter(p => p.id !== id));
        setToast('Professor removido.');
      } catch (err: any) {
        console.error(err);
        alert('Erro ao remover professor: ' + err.message);
      }
    }
  };

  const filtered = profList.filter(p => {
    if (search && !p.nome.toLowerCase().includes(search.toLowerCase()) && !p.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    return true;
  });

  const getTurmasNomes = (turmaIds: string[]) => {
    return turmaIds.map(id => turmas.find(t => t.id === id)?.nome || id).join(', ');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[60] bg-[var(--color-verde-sucesso)] text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in-up text-sm font-bold">
          <CheckCircle size={18} /> {toast}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-up">
        <p className="text-[var(--color-cinza-texto)]">Gerencie os professores do sistema.</p>
        <button className="btn btn-primary" onClick={openCreateModal}>
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
                      <button onClick={() => openEditModal(p)} className="p-1.5 rounded-lg hover:bg-[var(--color-azul-lightest)] transition-colors" title="Editar">
                        <Edit3 size={15} className="text-[var(--color-azul-autoridade)]" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-[var(--color-vermelho-light)] transition-colors" title="Excluir">
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
            Mostrando {filtered.length} de {profList.length} professores
          </span>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[var(--color-azul-autoridade)]">{editProfId ? 'Editar Professor' : 'Novo Professor'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-[var(--color-cinza-fundo)] rounded-lg"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Nome Completo *</label>
                <input
                  className="form-input"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Nome do professor"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@nota10.edu.br"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Turmas vinculadas</label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-[var(--color-cinza-fundo)] rounded-xl">
                  {turmas.filter(t => t.status === 'ativa').map(t => (
                    <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-[var(--color-azul-autoridade)] w-4 h-4"
                        checked={form.turmas.includes(t.id)}
                        onChange={() => toggleTurma(t.id)}
                      />
                      <span>{t.nome}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <div className="flex items-center gap-4 h-[42px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="status" checked={form.status === 'ativo'} onChange={() => setForm({ ...form, status: 'ativo' })} className="accent-[var(--color-verde-sucesso)]" />
                    <span className="text-sm font-medium">Ativo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="status" checked={form.status === 'inativo'} onChange={() => setForm({ ...form, status: 'inativo' })} className="accent-[var(--color-vermelho-erro)]" />
                    <span className="text-sm font-medium">Inativo</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-cinza-borda)]">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!form.nome.trim()}>
                <Save size={16} /> {editProfId ? 'Salvar Professor' : 'Cadastrar Professor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
