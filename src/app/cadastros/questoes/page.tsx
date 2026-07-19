'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Save, X, HelpCircle, CheckCircle, AlertCircle, BookOpen, Layers, Award } from 'lucide-react';

export default function CadastrosQuestoesPage() {
  const [questoes, setQuestoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroDisciplina, setFiltroDisciplina] = useState('todas');
  const [filtroBloco, setFiltroBloco] = useState('todos');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    disciplina: 'Português',
    bloco: 'Bloco 1',
    enunciado: '',
    tipo: 'multipla_escolha' as 'multipla_escolha' | 'verdadeiro_falso',
    alternativas: [
      { id: 'A', texto: '' },
      { id: 'B', texto: '' },
      { id: 'C', texto: '' },
      { id: 'D', texto: '' }
    ],
    resposta_correta: 'A',
    explicacao: '',
    xp_valor: 10,
    ordem: 1
  });

  const loadQuestoes = async () => {
    setLoading(true);
    try {
      let url = '/api/questoes?';
      if (filtroDisciplina !== 'todas') url += `disciplina=${encodeURIComponent(filtroDisciplina)}&`;
      if (filtroBloco !== 'todos') url += `bloco=${encodeURIComponent(filtroBloco)}&`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setQuestoes(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro ao buscar questões:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestoes();
  }, [filtroDisciplina, filtroBloco]);

  const handleTipoChange = (newTipo: 'multipla_escolha' | 'verdadeiro_falso') => {
    if (newTipo === 'verdadeiro_falso') {
      setForm(prev => ({
        ...prev,
        tipo: newTipo,
        alternativas: [
          { id: 'V', texto: 'Verdadeiro' },
          { id: 'F', texto: 'Falso' }
        ],
        resposta_correta: 'V'
      }));
    } else {
      setForm(prev => ({
        ...prev,
        tipo: newTipo,
        alternativas: [
          { id: 'A', texto: '' },
          { id: 'B', texto: '' },
          { id: 'C', texto: '' },
          { id: 'D', texto: '' }
        ],
        resposta_correta: 'A'
      }));
    }
  };

  const handleAlternativaChange = (idx: number, texto: string) => {
    setForm(prev => {
      const novas = [...prev.alternativas];
      novas[idx].texto = texto;
      return { ...prev, alternativas: novas };
    });
  };

  const openNewModal = () => {
    setEditingId(null);
    setForm({
      disciplina: 'Português',
      bloco: 'Bloco 1',
      enunciado: '',
      tipo: 'multipla_escolha',
      alternativas: [
        { id: 'A', texto: '' },
        { id: 'B', texto: '' },
        { id: 'C', texto: '' },
        { id: 'D', texto: '' }
      ],
      resposta_correta: 'A',
      explicacao: '',
      xp_valor: 10,
      ordem: questoes.length + 1
    });
    setShowModal(true);
  };

  const openEditModal = (item: any) => {
    setEditingId(item.id);
    let alts = item.alternativas;
    if (typeof alts === 'string') {
      try { alts = JSON.parse(alts); } catch (e) { alts = []; }
    }
    setForm({
      disciplina: item.disciplina || 'Português',
      bloco: item.bloco || 'Bloco 1',
      enunciado: item.enunciado || '',
      tipo: item.tipo || 'multipla_escolha',
      alternativas: Array.isArray(alts) && alts.length > 0 ? alts : [
        { id: 'A', texto: '' },
        { id: 'B', texto: '' },
        { id: 'C', texto: '' },
        { id: 'D', texto: '' }
      ],
      resposta_correta: item.resposta_correta || 'A',
      explicacao: item.explicacao || '',
      xp_valor: item.xp_valor || 10,
      ordem: item.ordem || 1
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.enunciado.trim()) {
      alert('O enunciado da questão é obrigatório.');
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const bodyPayload: any = { ...form };
      if (editingId) bodyPayload.id = editingId;

      const res = await fetch('/api/questoes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Falha ao salvar questão');
      }

      setShowModal(false);
      await loadQuestoes();
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta questão?')) return;

    try {
      const res = await fetch(`/api/questoes?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadQuestoes();
      } else {
        const data = await res.json();
        alert('Erro ao excluir: ' + (data.error || 'Erro interno'));
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir questão.');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--color-azul-marinho)] text-white p-6 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HelpCircle className="text-[var(--color-amarelo-conquista)]" size={28} />
            Cofre das Questões (Banco de Fixação e Revisão)
          </h1>
          <p className="text-sm text-white/80 mt-1">
            Gerencie as questões para a Apostila (Fixação) e o Quiz gamificado da Corujinha (Revisão).
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-[var(--color-amarelo-conquista)] text-[var(--color-azul-marinho)] font-bold px-5 py-2.5 rounded-xl hover:bg-yellow-400 transition-colors flex items-center gap-2 shadow-lg w-fit"
        >
          <Plus size={20} /> Nova Questão
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-[var(--color-cinza-borda)] flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-[var(--color-azul-autoridade)]" />
          <span className="text-sm font-semibold text-[var(--color-cinza-escuro)]">Disciplina:</span>
          <select
            value={filtroDisciplina}
            onChange={(e) => setFiltroDisciplina(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm bg-gray-50 focus:ring-2 focus:ring-[var(--color-azul-autoridade)]"
          >
            <option value="todas">Todas as Disciplinas</option>
            <option value="Português">Português</option>
            <option value="Matemática">Matemática</option>
            <option value="Redação">Redação</option>
            <option value="Geral">Geral / Simulado</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Layers size={18} className="text-[var(--color-azul-autoridade)]" />
          <span className="text-sm font-semibold text-[var(--color-cinza-escuro)]">Bloco:</span>
          <select
            value={filtroBloco}
            onChange={(e) => setFiltroBloco(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm bg-gray-50 focus:ring-2 focus:ring-[var(--color-azul-autoridade)]"
          >
            <option value="todos">Todos os Blocos</option>
            <option value="Bloco 1">Bloco 1</option>
            <option value="Bloco 2">Bloco 2</option>
            <option value="Bloco 3">Bloco 3</option>
            <option value="Bloco 4">Bloco 4</option>
          </select>
        </div>
      </div>

      {/* Lista de Questões */}
      {loading ? (
        <div className="text-center py-12 text-[var(--color-cinza-texto)]">
          Carregando questões do banco de dados...
        </div>
      ) : questoes.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-dashed border-[var(--color-cinza-borda)] space-y-3">
          <HelpCircle size={48} className="mx-auto text-[var(--color-cinza-texto)]/40" />
          <h3 className="text-lg font-bold text-[var(--color-cinza-escuro)]">Nenhuma questão encontrada</h3>
          <p className="text-sm text-[var(--color-cinza-texto)] max-w-md mx-auto">
            Cadastre questões de múltipla escolha ou Verdadeiro/Falso para nutrir as revisões da Corujinha e os exercícios da Apostila.
          </p>
          <button
            onClick={openNewModal}
            className="mt-2 bg-[var(--color-azul-autoridade)] text-white font-bold px-4 py-2 rounded-lg text-sm hover:bg-blue-900 transition-colors inline-flex items-center gap-2"
          >
            <Plus size={16} /> Cadastrar Primeira Questão
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {questoes.map((item, index) => {
            let alts = item.alternativas;
            if (typeof alts === 'string') {
              try { alts = JSON.parse(alts); } catch (e) { alts = []; }
            }
            return (
              <div key={item.id} className="bg-white rounded-xl p-5 border border-[var(--color-cinza-borda)] shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--color-azul-lightest)] text-[var(--color-azul-autoridade)] border border-blue-200">
                      {item.disciplina}
                    </span>
                    {item.bloco && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                        {item.bloco}
                      </span>
                    )}
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      item.tipo === 'verdadeiro_falso' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {item.tipo === 'verdadeiro_falso' ? 'Verdadeiro ou Falso' : 'Múltipla Escolha'}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <Award size={13} /> {item.xp_valor || 10} XP
                    </span>
                  </div>

                  <p className="font-semibold text-gray-900 text-base leading-snug">
                    {item.enunciado}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {Array.isArray(alts) && alts.map((alt: any) => (
                      <div
                        key={alt.id}
                        className={`text-xs p-2 rounded-lg border flex items-center gap-2 ${
                          alt.id === item.resposta_correta
                            ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900'
                            : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                          alt.id === item.resposta_correta ? 'bg-emerald-600 text-white' : 'bg-gray-300 text-gray-700'
                        }`}>
                          {alt.id}
                        </span>
                        <span className="truncate">{alt.texto || `(Alternativa ${alt.id})`}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nova / Editar Questão */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-xl font-bold text-[var(--color-azul-autoridade)] flex items-center gap-2">
                <HelpCircle size={22} className="text-[var(--color-amarelo-conquista)]" />
                {editingId ? 'Editar Questão' : 'Cadastrar Nova Questão'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Disciplina</label>
                  <select
                    value={form.disciplina}
                    onChange={e => setForm(prev => ({ ...prev, disciplina: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-[var(--color-azul-autoridade)]"
                  >
                    <option value="Português">Português</option>
                    <option value="Matemática">Matemática</option>
                    <option value="Redação">Redação</option>
                    <option value="Geral">Geral / Simulado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Bloco / Módulo</label>
                  <select
                    value={form.bloco}
                    onChange={e => setForm(prev => ({ ...prev, bloco: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-[var(--color-azul-autoridade)]"
                  >
                    <option value="Bloco 1">Bloco 1</option>
                    <option value="Bloco 2">Bloco 2</option>
                    <option value="Bloco 3">Bloco 3</option>
                    <option value="Bloco 4">Bloco 4</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Tipo de Questão</label>
                  <select
                    value={form.tipo}
                    onChange={e => handleTipoChange(e.target.value as any)}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-[var(--color-azul-autoridade)]"
                  >
                    <option value="multipla_escolha">Múltipla Escolha</option>
                    <option value="verdadeiro_falso">Verdadeiro ou Falso</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Enunciado da Questão</label>
                <textarea
                  rows={3}
                  value={form.enunciado}
                  onChange={e => setForm(prev => ({ ...prev, enunciado: e.target.value }))}
                  placeholder="Digite a pergunta ou problema aqui..."
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-[var(--color-azul-autoridade)]"
                />
              </div>

              {/* Alternativas */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase text-gray-600">Alternativas & Resposta Correta</label>
                {form.alternativas.map((alt, idx) => (
                  <div key={alt.id} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, resposta_correta: alt.id }))}
                      className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs shrink-0 transition-all ${
                        form.resposta_correta === alt.id
                          ? 'bg-emerald-600 text-white shadow-md scale-105'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                      title={form.resposta_correta === alt.id ? 'Resposta Correta' : 'Marcar como correta'}
                    >
                      {alt.id}
                    </button>
                    <input
                      type="text"
                      disabled={form.tipo === 'verdadeiro_falso'}
                      value={alt.texto}
                      onChange={e => handleAlternativaChange(idx, e.target.value)}
                      placeholder={`Texto da alternativa ${alt.id}...`}
                      className={`flex-1 border rounded-lg px-3 py-2 text-sm ${
                        form.resposta_correta === alt.id
                          ? 'border-emerald-500 bg-emerald-50/30 font-medium'
                          : 'bg-gray-50'
                      }`}
                    />
                  </div>
                ))}
                <p className="text-[11px] text-gray-500 italic">
                  * Clique na letra circular para definir qual alternativa é a resposta correta.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Explicação (Feedback Pedagógico)</label>
                  <input
                    type="text"
                    value={form.explicacao}
                    onChange={e => setForm(prev => ({ ...prev, explicacao: e.target.value }))}
                    placeholder="Ex: A alternativa A está certa porque..."
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Valor em XP</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={form.xp_valor}
                    onChange={e => setForm(prev => ({ ...prev, xp_valor: Number(e.target.value) || 10 }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-6 py-2 bg-[var(--color-azul-autoridade)] text-white font-bold rounded-xl hover:bg-blue-900 transition-colors flex items-center gap-2 shadow-md"
              >
                <Save size={18} /> Salvar Questão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
