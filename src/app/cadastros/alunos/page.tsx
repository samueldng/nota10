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
  turma: string;
  turmaId: string;
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
  turma: '5A Manhã',
  turmaId: 'T001',
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

const TURMA_MAP: Record<string, string> = {
  '5A Manhã': 'T001',
  '5B Tarde': 'T002',
  '4A Manhã': 'T004',
  '4B Tarde': 'T005',
  'Reforço Geral': 'T006',
};

export default function CadastroAlunosPage() {
  const [search, setSearch] = useState('');
  const [filterTurma, setFilterTurma] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editAlunoId, setEditAlunoId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<AlunoForm>(EMPTY_FORM);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAlunos();
        setAlunos(data);
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

  const openEditModal = (aluno: Aluno) => {
    setEditAlunoId(aluno.id);
    setForm({
      nome: aluno.nome,
      acompanhamento: aluno.acompanhamento,
      plano: aluno.plano || 'padrao',
      turma: aluno.turma,
      turmaId: aluno.turmaId,
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

    // Obter o ID da turma destino
    const targetTurmaId = TURMA_MAP[form.turma] || 'T001';

    // Validar duplicidade no mesmo curso/turma
    const isDuplicate = alunos.some(a => {
      if (editAlunoId && a.id === editAlunoId) return false;
      const matchNome = a.nome.trim().toLowerCase() === form.nome.trim().toLowerCase();
      const matchPhone = a.responsavel1?.telefone?.replace(/\D/g, '') === form.resp1Tel.replace(/\D/g, '');
      const matchTurma = a.turmaId === targetTurmaId;
      return matchNome && matchPhone && matchTurma;
    });

    if (isDuplicate) {
      alert('Aviso: Já existe um aluno com este mesmo nome e telefone do responsável cadastrado nesta turma.');
      return;
    }

    try {
      if (editAlunoId) {
        // Edit existing
        const original = alunos.find(a => a.id === editAlunoId);
        if (!original) return;
        const updatedData: Aluno = {
          ...original,
          nome: form.nome,
          acompanhamento: form.acompanhamento,
          plano: form.plano,
          turma: form.turma,
          turmaId: targetTurmaId,
          status: form.status,
          senhaInicial: form.senhaInicial,
          responsavel1: { nome: form.resp1Nome, telefone: form.resp1Tel },
          responsavel2: { nome: form.resp2Nome, telefone: form.resp2Tel },
          endereco: { rua: form.rua, bairro: form.bairro, cidade: form.cidade },
        };
        const result = await updateAluno(updatedData);
        setAlunos(prev => prev.map(a => a.id === editAlunoId ? result : a));
        setToast('Aluno atualizado com sucesso!');
      } else {
        // Create new
        const novoAlunoPayload = {
          numero: generateNextNumero(alunos),
          nome: form.nome,
          turmaId: targetTurmaId,
          turma: form.turma,
          acompanhamento: form.acompanhamento,
          plano: form.plano,
          status: form.status,
          senhaInicial: form.senhaInicial,
          responsavel1: { nome: form.resp1Nome, telefone: form.resp1Tel },
          responsavel2: { nome: form.resp2Nome, telefone: form.resp2Tel },
          endereco: { rua: form.rua, bairro: form.bairro, cidade: form.cidade },
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
    if (filterTurma && a.turma !== filterTurma) return false;
    if (filterStatus && a.status !== filterStatus) return false;
    return true;
  });

  if (loading) return <div className="p-10 text-center text-[var(--color-cinza-texto)]">Carregando alunos do Supabase...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[60] bg-[var(--color-verde-sucesso)] text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in-up text-sm font-bold">
          <CheckCircle size={18} /> {toast}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-up">
        <p className="text-[var(--color-cinza-texto)]">Gerencie os alunos de cada turma.</p>
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
            <option value="5A Manhã">5A Manhã</option>
            <option value="5B Tarde">5B Tarde</option>
            <option value="4A Manhã">4A Manhã</option>
            <option value="4B Tarde">4B Tarde</option>
            <option value="Reforço Geral">Reforço Geral</option>
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
                <th>Turma</th>
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
                  <td className="text-sm">{aluno.turma}</td>
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                      <label className="form-label">Turma</label>
                      <select
                        className="form-select"
                        value={form.turma}
                        onChange={(e) => setForm({ ...form, turma: e.target.value, turmaId: TURMA_MAP[e.target.value] || 'T001' })}
                      >
                        <option>5A Manhã</option>
                        <option>5B Tarde</option>
                        <option>4A Manhã</option>
                        <option>4B Tarde</option>
                        <option>Reforço Geral</option>
                      </select>
                      <span className="text-[10px] text-[var(--color-cinza-texto)] leading-snug mt-1 block italic">
                        💡 Dica: Se o aluno faz dois cursos (ex: Reforço e Pré-CMT), faça um cadastro para cada curso. Eles terão matrículas separadas.
                      </span>
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
