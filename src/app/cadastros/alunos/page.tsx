'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Edit3, Eye, X, Save, UserCheck, Phone, MapPin, CheckCircle,
} from 'lucide-react';
import { acompanhamentoLabels, planoLabels, type Acompanhamento, type Aluno, type PlanoAluno } from '@/lib/mockData';
import { getAlunos, createAluno, updateAluno } from '@/lib/api';

// ── Helpers ──

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 3) return `(${digits.slice(0, 2)})${digits.slice(2)}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)})${digits.slice(2, 3)} ${digits.slice(3)}`;
  return `(${digits.slice(0, 2)})${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function generateNextNumero(alunos: Aluno[]): string {
  const maxNum = alunos.reduce((max, a) => {
    const n = parseInt(a.numero, 10);
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);
  return String(maxNum + 1).padStart(4, '0');
}

interface AlunoForm {
  nome: string;
  acompanhamento: Acompanhamento;
  plano: PlanoAluno;
  turmasIds: string[];
  status: 'ativo' | 'inativo';
  senhaInicial: string;
  resp1Nome: string;
  resp1Tel: string;
  resp2Nome: string;
  resp2Tel: string;
  rua: string;
  bairro: string;
  cidade: string;
}

const EMPTY_FORM: AlunoForm = {
  nome: '',
  acompanhamento: 'pre_cmt_5',
  plano: 'padrao',
  turmasIds: [],
  status: 'ativo',
  senhaInicial: '',
  resp1Nome: '',
  resp1Tel: '',
  resp2Nome: '',
  resp2Tel: '',
  rua: '',
  bairro: '',
  cidade: '',
};

export default function CadastroAlunosPage() {
  const [search, setSearch] = useState('');
  const [filterTurma, setFilterTurma] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editAlunoId, setEditAlunoId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmasList, setTurmasList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<AlunoForm>(EMPTY_FORM);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAlunos();
        setAlunos(data);

        const turmasRes = await fetch('/api/turmas');
        if (turmasRes.ok) {
          const tData = await turmasRes.json();
          setTurmasList(tData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const openCreateModal = () => {
    setEditAlunoId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (aluno: Aluno & { matriculas?: any[] }) => {
    setEditAlunoId(aluno.id);
    const resolvedIds = aluno.matriculas?.map((m: any) => m.turmaId) || (aluno.turmaId ? [aluno.turmaId] : []);
    setForm({
      nome: aluno.nome,
      acompanhamento: aluno.acompanhamento,
      plano: aluno.plano || 'padrao',
      turmasIds: resolvedIds,
      status: aluno.status,
      senhaInicial: aluno.senhaInicial || '',
      resp1Nome: aluno.responsavel1.nome,
      resp1Tel: aluno.responsavel1.telefone,
      resp2Nome: aluno.responsavel2.nome,
      resp2Tel: aluno.responsavel2.telefone,
      rua: aluno.endereco.rua,
      bairro: aluno.endereco.bairro,
      cidade: aluno.endereco.cidade,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) return;

    if (form.turmasIds.length === 0) {
      alert('Selecione pelo menos uma turma.');
      return;
    }

    const isDuplicate = alunos.some(a => {
      if (editAlunoId && a.id === editAlunoId) return false;
      const matchNome = a.nome.trim().toLowerCase() === form.nome.trim().toLowerCase();
      const matchPhone = a.responsavel1?.telefone?.replace(/\D/g, '') === form.resp1Tel.replace(/\D/g, '');
      return matchNome && matchPhone;
    });

    if (isDuplicate) {
      alert('Aviso: Já existe um aluno cadastrado com este mesmo nome e telefone do responsável.');
      return;
    }

    try {
      const payload = {
        nome: form.nome,
        acompanhamento: form.acompanhamento,
        plano: form.plano,
        turmasIds: form.turmasIds,
        status: form.status,
        senhaInicial: form.senhaInicial,
        responsavel1: { nome: form.resp1Nome, telefone: form.resp1Tel },
        responsavel2: { nome: form.resp2Nome, telefone: form.resp2Tel },
        endereco: { rua: form.rua, bairro: form.bairro, city: form.cidade }, // backend mapping handles street properties
      };

      if (editAlunoId) {
        // Edit existing
        const result = await updateAluno({ ...payload, id: editAlunoId } as any);
        setAlunos(prev => prev.map(a => a.id === editAlunoId ? result : a));
        setToast('Aluno atualizado com sucesso!');
      } else {
        // Create new
        const novoAlunoPayload = {
          ...payload,
          numero: generateNextNumero(alunos),
        };
        const result = await createAluno(novoAlunoPayload as any);
        setAlunos(prev => [...prev, result]);
        setToast('Aluno cadastrado com sucesso!');
      }
      setShowModal(false);
    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar aluno: ' + err.message);
    }
  };

  const filtered = alunos.filter((a) => {
    if (search && !a.nome.toLowerCase().includes(search.toLowerCase()) && !a.numero.includes(search)) return false;
    if (filterTurma) {
      const hasTurma = (a as any).matriculas?.some((m: any) => m.turmaNome === filterTurma);
      if (!hasTurma) return false;
    }
    if (filterStatus && a.status !== filterStatus) return false;
    return true;
  });

  if (loading) return <div className="p-10 text-center text-[var(--color-cinza-texto)]">Carregando alunos...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[60] bg-[var(--color-verde-sucesso)] text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in-up text-sm font-bold">
          <CheckCircle size={18} /> {toast}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-up">
        <p className="text-[var(--color-cinza-texto)]">Gerencie os alunos e suas respectivas turmas vinculadas.</p>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={16} /> Novo Aluno
        </button>
      </div>

      <div className="card animate-fade-in-up delay-1">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-cinza-texto)]" />
            <input type="text" placeholder="Buscar aluno por nome ou número..." className="form-input pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="form-select w-auto" value={filterTurma} onChange={(e) => setFilterTurma(e.target.value)}>
            <option value="">Todas as Turmas</option>
            {turmasList.map(t => (
              <option key={t.id} value={t.nome}>{t.nome}</option>
            ))}
          </select>
          <select className="form-select w-auto" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
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
                <th>Nº</th>
                <th>Nome Completo</th>
                <th>Turmas</th>
                <th>Acompanhamento</th>
                <th>Plano</th>
                <th>Responsável 1</th>
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
                  <td className="text-sm">
                    <div className="flex flex-wrap gap-1">
                      {(aluno as any).matriculas && (aluno as any).matriculas.length > 0 ? (
                        (aluno as any).matriculas.map((m: any) => (
                          <span
                            key={m.id}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                              m.status === 'ativo'
                                ? 'bg-[var(--color-azul-lightest)] text-[var(--color-azul-autoridade)]'
                                : 'bg-gray-150 text-gray-500'
                            }`}
                          >
                            {m.turmaNome}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 italic text-xs">Sem turma</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge text-xs ${
                      aluno.acompanhamento === 'pre_cmt_5' ? 'badge-info' :
                      aluno.acompanhamento === 'projeto_4' ? 'badge-warning' :
                      'badge-success'
                    }`}>
                      {acompanhamentoLabels[aluno.acompanhamento]}
                    </span>
                  </td>
                  <td>
                    <span className={`badge text-xs font-bold ${
                      aluno.plano === 'elite' ? 'badge-warning' :
                      aluno.plano === 'acompanhamento' ? 'badge-info' :
                      'badge-outline'
                    }`}>
                      {planoLabels[aluno.plano || 'padrao']}
                    </span>
                  </td>
                  <td className="text-sm">{aluno.responsavel1.nome}</td>
                  <td>
                    <span className="flex items-center gap-1 text-sm">
                      <Phone size={12} className="text-[var(--color-cinza-texto)]" />
                      {aluno.responsavel1.telefone}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${aluno.status === 'ativo' ? 'badge-success' : 'badge-error'}`}>
                      {aluno.status === 'ativo' ? '🟢 Ativo' : '🔴 Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEditModal(aluno)} className="p-1.5 rounded-lg hover:bg-[var(--color-azul-lightest)] transition-colors" title="Editar">
                        <Edit3 size={15} className="text-[var(--color-azul-autoridade)]" />
                      </button>
                      <Link href={`/cadastros/alunos/${aluno.id}`} className="p-1.5 rounded-lg hover:bg-[var(--color-cinza-fundo)] transition-colors" title="Página do Aluno">
                        <Eye size={15} className="text-[var(--color-cinza-texto)]" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-[var(--color-cinza-borda)]">
          <span className="text-sm text-[var(--color-cinza-texto)]">
            Mostrando {filtered.length} de {alunos.length} alunos
          </span>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-in-up p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[var(--color-azul-autoridade)]">
                {editAlunoId ? 'Editar Aluno' : 'Novo Aluno'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-[var(--color-cinza-fundo)] rounded-lg"><X size={20} /></button>
            </div>
            <div className="space-y-6">
              {/* ── Dados do Aluno ── */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--color-cinza-borda)]">
                  <UserCheck size={14} className="text-[var(--color-azul-autoridade)]" />
                  <p className="text-xs font-bold text-[var(--color-azul-autoridade)] uppercase m-0">Dados do Aluno</p>
                </div>
                <div className="space-y-3">
                  <div className="form-group">
                    <label className="form-label">Nome Completo *</label>
                    <input
                      className="form-input"
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      placeholder="Nome completo do aluno"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="form-group">
                      <label className="form-label">Acompanhamento</label>
                      <select
                        className="form-select"
                        value={form.acompanhamento}
                        onChange={(e) => setForm({ ...form, acompanhamento: e.target.value as Acompanhamento })}
                      >
                        <option value="pre_cmt_5">Pré-CMT 5º Ano</option>
                        <option value="projeto_4">Projeto 4º Ano</option>
                        <option value="reforco">Reforço</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Plano Portal</label>
                      <select
                        className="form-select"
                        value={form.plano}
                        onChange={(e) => setForm({ ...form, plano: e.target.value as PlanoAluno })}
                      >
                        <option value="padrao">Padrão</option>
                        <option value="acompanhamento">Acompanhamento</option>
                        <option value="elite">Elite</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <div className="flex items-center gap-4 h-[42px]">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="status"
                            checked={form.status === 'ativo'}
                            onChange={() => setForm({ ...form, status: 'ativo' })}
                            className="accent-[var(--color-verde-sucesso)]"
                          />
                          <span className="text-sm font-medium">Ativo</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="status"
                            checked={form.status === 'inativo'}
                            onChange={() => setForm({ ...form, status: 'inativo' })}
                            className="accent-[var(--color-vermelho-erro)]"
                          />
                          <span className="text-sm font-medium">Inativo</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label font-bold text-xs">Turmas Vinculadas</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-gray-50 p-4 rounded-2xl border border-[var(--color-cinza-borda)] max-h-48 overflow-y-auto">
                      {turmasList.map((t) => {
                        const isChecked = form.turmasIds.includes(t.id);
                        return (
                          <label
                            key={t.id}
                            className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border transition-all cursor-pointer select-none ${
                              isChecked
                                ? 'bg-[var(--color-azul-lightest)] border-[var(--color-azul-light)] text-[var(--color-azul-autoridade)] shadow-sm'
                                : 'bg-white border-[var(--color-cinza-borda)] text-[var(--color-cinza-texto)] hover:bg-gray-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setForm({
                                    ...form,
                                    turmasIds: form.turmasIds.filter((id) => id !== t.id),
                                  });
                                } else {
                                  setForm({
                                    ...form,
                                    turmasIds: [...form.turmasIds, t.id],
                                  });
                                }
                              }}
                              className="rounded text-[var(--color-azul-autoridade)] focus:ring-[var(--color-azul-autoridade)] w-4 h-4"
                            />
                            <span>{t.nome}</span>
                          </label>
                        );
                      })}
                    </div>
                    <span className="text-[10px] text-[var(--color-cinza-texto)] leading-snug mt-1.5 block italic">
                      💡 Dica: Marque todas as turmas que o aluno frequenta (ex: Reforço + Pré-CMT). O XP acumulado será global.
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Senha Inicial do Portal (Apenas Números)</label>
                    <input
                      className="form-input"
                      value={form.senhaInicial}
                      onChange={(e) => setForm({ ...form, senhaInicial: e.target.value.replace(/\D/g, '') })}
                      placeholder="Ex: últimos 4 dígitos do WhatsApp"
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>

              {/* ── Responsáveis ── */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--color-cinza-borda)]">
                  <Phone size={14} className="text-[var(--color-azul-autoridade)]" />
                  <p className="text-xs font-bold text-[var(--color-azul-autoridade)] uppercase m-0">Responsáveis</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[var(--color-cinza-fundo)] rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-[var(--color-cinza-escuro)]">Responsável 1</p>
                    <div className="form-group">
                      <label className="form-label text-[10px]">Nome</label>
                      <input
                        className="form-input"
                        value={form.resp1Nome}
                        onChange={(e) => setForm({ ...form, resp1Nome: e.target.value })}
                        placeholder="Nome do responsável"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label text-[10px]">Telefone</label>
                      <input
                        className="form-input"
                        value={form.resp1Tel}
                        onChange={(e) => setForm({ ...form, resp1Tel: formatPhone(e.target.value) })}
                        placeholder="(99)9 9999-9999"
                        maxLength={15}
                      />
                    </div>
                  </div>
                  <div className="bg-[var(--color-cinza-fundo)] rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-[var(--color-cinza-escuro)]">Responsável 2</p>
                    <div className="form-group">
                      <label className="form-label text-[10px]">Nome</label>
                      <input
                        className="form-input"
                        value={form.resp2Nome}
                        onChange={(e) => setForm({ ...form, resp2Nome: e.target.value })}
                        placeholder="Nome do responsável"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label text-[10px]">Telefone</label>
                      <input
                        className="form-input"
                        value={form.resp2Tel}
                        onChange={(e) => setForm({ ...form, resp2Tel: formatPhone(e.target.value) })}
                        placeholder="(99)9 9999-9999"
                        maxLength={15}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Endereço ── */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--color-cinza-borda)]">
                  <MapPin size={14} className="text-[var(--color-azul-autoridade)]" />
                  <p className="text-xs font-bold text-[var(--color-azul-autoridade)] uppercase m-0">Endereço</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="form-group">
                    <label className="form-label">Rua</label>
                    <input
                      className="form-input"
                      value={form.rua}
                      onChange={(e) => setForm({ ...form, rua: e.target.value })}
                      placeholder="Rua, número"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bairro</label>
                    <input
                      className="form-input"
                      value={form.bairro}
                      onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                      placeholder="Bairro"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cidade</label>
                    <input
                      className="form-input"
                      value={form.cidade}
                      onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                      placeholder="Cidade"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-cinza-borda)]">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={!form.nome.trim()}
              >
                <Save size={16} /> {editAlunoId ? 'Salvar alterações' : 'Cadastrar Aluno'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
