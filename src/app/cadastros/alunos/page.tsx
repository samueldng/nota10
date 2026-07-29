'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Edit3, Eye, X, Save, UserCheck, Phone, MapPin, CheckCircle,
} from 'lucide-react';
import { acompanhamentoLabels, planoLabels, type Acompanhamento, type Aluno, type PlanoAluno } from '@/lib/mockData';
import { getAlunos, createAluno, updateAluno } from '@/lib/api';
import { AlunoForm, type AlunoFormData } from '@/components/AlunoForm';

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

const PRODUTOS_ATIVOS = [
  { id: 'pre_cmt_5', nome: 'Pré-CMT 5º Ano' },
  { id: 'projeto_4', nome: 'Projeto 4º Ano' },
  { id: 'reforco', nome: 'Reforço' }
];

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
  
  // Data for the modal
  const [alunoInicial, setAlunoInicial] = useState<Partial<AlunoFormData> | null>(null);

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
    setAlunoInicial(null);
    setShowModal(true);
  };

  const openEditModal = (aluno: Aluno & { matriculas?: any[] }) => {
    setEditAlunoId(aluno.id);
    const resolvedIds = aluno.matriculas?.map((m: any) => m.turmaId) || (aluno.turmaId ? [aluno.turmaId] : []);
    const resolvedAcomp = Array.isArray(aluno.acompanhamento)
      ? (aluno.acompanhamento as string[])
      : (aluno.acompanhamento ? [aluno.acompanhamento as string] : []);
    setAlunoInicial({
      nome: aluno.nome,
      produtosIds: resolvedAcomp,
      planoPortal: aluno.plano || 'padrao',
      turmasIds: resolvedIds,
      status: aluno.status as 'ativo' | 'inativo',
      senhaInicial: aluno.senhaInicial || '',
      resp1Nome: aluno.responsavel1?.nome || '',
      resp1Tel: aluno.responsavel1?.telefone || '',
      resp2Nome: aluno.responsavel2?.nome || '',
      resp2Tel: aluno.responsavel2?.telefone || '',
      rua: aluno.endereco?.rua || '',
      bairro: aluno.endereco?.bairro || '',
      cidade: aluno.endereco?.cidade || '',
    });
    setShowModal(true);
  };

  const handleSave = async (data: AlunoFormData) => {
    const isDuplicate = alunos.some(a => {
      if (editAlunoId && a.id === editAlunoId) return false;
      const matchNome = a.nome.trim().toLowerCase() === data.nome.trim().toLowerCase();
      const matchPhone = a.responsavel1?.telefone?.replace(/\D/g, '') === data.resp1Tel.replace(/\D/g, '');
      return matchNome && matchPhone;
    });

    if (isDuplicate) {
      throw new Error('Já existe um aluno cadastrado com este mesmo nome e telefone do responsável.');
    }

    const payload = {
      nome: data.nome,
      acompanhamento: data.produtosIds,
      plano: data.planoPortal as PlanoAluno,
      turmasIds: data.turmasIds,
      status: data.status,
      senhaInicial: data.senhaInicial,
      responsavel1: { nome: data.resp1Nome, telefone: data.resp1Tel },
      responsavel2: { nome: data.resp2Nome || '', telefone: data.resp2Tel || '' },
      endereco: { rua: data.rua || '', bairro: data.bairro || '', city: data.cidade || '', cidade: data.cidade || '' },
    };

    if (editAlunoId) {
      const result = await updateAluno({ ...payload, id: editAlunoId } as any);
      setAlunos(prev => prev.map(a => a.id === editAlunoId ? result : a));
      setToast('Aluno atualizado com sucesso!');
    } else {
      const novoAlunoPayload = {
        ...payload,
        numero: generateNextNumero(alunos),
      };
      const result = await createAluno(novoAlunoPayload as any);
      setAlunos(prev => [...prev, result]);
      setToast('Aluno cadastrado com sucesso!');
    }
    setShowModal(false);
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
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(aluno.acompanhamento) ? (
                        aluno.acompanhamento.map((ac) => (
                          <span
                            key={ac}
                            className={`badge text-[10px] py-0.5 px-2 font-black uppercase ${
                              ac === 'pre_cmt_5' ? 'badge-info' :
                              ac === 'projeto_4' ? 'badge-warning' :
                              'badge-success'
                            }`}
                          >
                            {acompanhamentoLabels[ac as Acompanhamento] || ac}
                          </span>
                        ))
                      ) : (
                        <span
                          className={`badge text-[10px] py-0.5 px-2 font-black uppercase ${
                            aluno.acompanhamento === 'pre_cmt_5' ? 'badge-info' :
                            aluno.acompanhamento === 'projeto_4' ? 'badge-warning' :
                            'badge-success'
                          }`}
                        >
                          {acompanhamentoLabels[aluno.acompanhamento as Acompanhamento] || aluno.acompanhamento}
                        </span>
                      )}
                    </div>
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
        <AlunoForm
          alunoInicial={alunoInicial}
          turmasAtivas={turmasList.filter(t => t.status === 'ativa')}
          produtosAtivos={PRODUTOS_ATIVOS}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
