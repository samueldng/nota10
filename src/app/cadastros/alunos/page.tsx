'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Edit3, Eye, X, Save, UserCheck, Phone, MapPin,
} from 'lucide-react';
import { acompanhamentoLabels, planoLabels, type Acompanhamento, type Aluno, type PlanoAluno } from '@/lib/mockData';
import { getAlunos } from '@/lib/api';

export default function CadastroAlunosPage() {
  const [search, setSearch] = useState('');
  const [filterTurma, setFilterTurma] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editAlunoId, setEditAlunoId] = useState<string | null>(null);

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);

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

  const editAluno = editAlunoId ? alunos.find(a => a.id === editAlunoId) : null;

  const filtered = alunos.filter((a) => {
    if (search && !a.nome.toLowerCase().includes(search.toLowerCase()) && !a.numero.includes(search)) return false;
    if (filterTurma && a.turma !== filterTurma) return false;
    if (filterStatus && a.status !== filterStatus) return false;
    return true;
  });

  if (loading) return <div className="p-10 text-center text-[var(--color-cinza-texto)]">Carregando alunos do Supabase...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-up">
        <p className="text-[var(--color-cinza-texto)]">Gerencie os alunos de cada turma.</p>
        <button className="btn btn-primary" onClick={() => { setEditAlunoId(null); setShowModal(true); }}>
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
                      <button onClick={() => { setEditAlunoId(aluno.id); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-[var(--color-azul-lightest)] transition-colors" title="Editar">
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
                {editAluno ? 'Editar Aluno' : 'Novo Aluno'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-[var(--color-cinza-fundo)] rounded-lg"><X size={20} /></button>
            </div>
            <div className="space-y-5">
              {/* Dados do Aluno */}
              <div>
                <p className="text-xs font-bold text-[var(--color-azul-autoridade)] uppercase mb-3">Dados do Aluno</p>
                <div className="space-y-3">
                  <div className="form-group">
                    <label className="form-label">Nome Completo</label>
                    <input className="form-input" defaultValue={editAluno?.nome || ''} placeholder="Nome completo do aluno" />
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="form-group">
                      <label className="form-label">Acompanhamento</label>
                      <select className="form-select" defaultValue={editAluno?.acompanhamento || ''}>
                        <option value="pre_cmt_5">Pré-CMT 5º Ano</option>
                        <option value="projeto_4">Projeto 4º Ano</option>
                        <option value="reforco">Reforço</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Plano Portal</label>
                      <select className="form-select" defaultValue={editAluno?.plano || 'padrao'}>
                        <option value="padrao">Padrão</option>
                        <option value="acompanhamento">Acompanhamento</option>
                        <option value="elite">Elite</option>
                      </select>
                    </div>
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
                  <div className="form-group">
                    <label className="form-label">Senha Inicial do Portal (Apenas Números)</label>
                    <input className="form-input" defaultValue={editAluno?.senhaInicial || ''} placeholder="Ex: últimos 4 dígitos do WhatsApp" />
                  </div>
                </div>
              </div>

              {/* Responsáveis */}
              <div>
                <p className="text-xs font-bold text-[var(--color-azul-autoridade)] uppercase mb-3">Responsáveis</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[var(--color-cinza-fundo)] rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-[var(--color-cinza-escuro)]">Responsável 1</p>
                    <div className="form-group">
                      <label className="form-label text-[10px]">Nome</label>
                      <input className="form-input" defaultValue={editAluno?.responsavel1.nome || ''} placeholder="Nome do responsável" />
                    </div>
                    <div className="form-group">
                      <label className="form-label text-[10px]">Telefone</label>
                      <input className="form-input" defaultValue={editAluno?.responsavel1.telefone || ''} placeholder="(11) 99999-9999" />
                    </div>
                  </div>
                  <div className="bg-[var(--color-cinza-fundo)] rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-[var(--color-cinza-escuro)]">Responsável 2</p>
                    <div className="form-group">
                      <label className="form-label text-[10px]">Nome</label>
                      <input className="form-input" defaultValue={editAluno?.responsavel2.nome || ''} placeholder="Nome do responsável" />
                    </div>
                    <div className="form-group">
                      <label className="form-label text-[10px]">Telefone</label>
                      <input className="form-input" defaultValue={editAluno?.responsavel2.telefone || ''} placeholder="(11) 99999-9999" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div>
                <p className="text-xs font-bold text-[var(--color-azul-autoridade)] uppercase mb-3 flex items-center gap-1">
                  <MapPin size={12} /> Endereço
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="form-group">
                    <label className="form-label">Rua</label>
                    <input className="form-input" defaultValue={editAluno?.endereco.rua || ''} placeholder="Rua, número" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bairro</label>
                    <input className="form-input" defaultValue={editAluno?.endereco.bairro || ''} placeholder="Bairro" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cidade</label>
                    <input className="form-input" defaultValue={editAluno?.endereco.cidade || ''} placeholder="Cidade" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-cinza-borda)]">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={() => setShowModal(false)}>
                <Save size={16} /> Salvar alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
