'use client';

import { useState } from 'react';
import { getCronogramaSemana } from '@/lib/portalData';
import {
  Save, Plus, Trash2, CalendarDays, BookOpen, Map,
  PlayCircle, FileText, ChevronRight, Edit3, X, Check,
} from 'lucide-react';

const tipoLabels: Record<string, string> = {
  revisao: 'Revisão',
  pre_aula: 'Pré-aula',
  aula_presencial: 'Aula Presencial',
  simulado: 'Simulado',
  atividade: 'Atividade',
};

export default function GestaoCronogramaPage() {
  const [selectedTurma, setSelectedTurma] = useState('T001');
  const [selectedSemana, setSelectedSemana] = useState('Semana 12');
  const [showModal, setShowModal] = useState(false);
  const [cronograma, setCronograma] = useState(getCronogramaSemana('T001'));
  const [editTarefa, setEditTarefa] = useState<any>(null);

  const handleAddActivity = () => {
    setEditTarefa({
      id: Math.random().toString(),
      ordem: cronograma.tarefas.length + 1,
      titulo: '',
      tipo: 'pre_aula',
      disciplina: 'Português',
      bloco: 'Bloco 2',
      xp: 15,
      status: 'pendente',
      subTarefas: [],
    });
    setShowModal(true);
  };

  const handleEditActivity = (tarefa: any) => {
    setEditTarefa({ ...tarefa });
    setShowModal(true);
  };

  const handleSaveTarefa = () => {
    if (!editTarefa) return;
    const exists = cronograma.tarefas.some(t => t.id === editTarefa.id);
    let newTarefas = [...cronograma.tarefas];

    if (exists) {
      newTarefas = newTarefas.map(t => t.id === editTarefa.id ? editTarefa : t);
    } else {
      newTarefas.push(editTarefa);
    }

    setCronograma({ ...cronograma, tarefas: newTarefas });
    setShowModal(false);
  };

  const handleDeleteTarefa = (id: string) => {
    const newTarefas = cronograma.tarefas.filter(t => t.id !== id).map((t, idx) => ({ ...t, ordem: idx + 1 }));
    setCronograma({ ...cronograma, tarefas: newTarefas });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Selection controls */}
      <div className="card animate-fade-in-up flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto">
          <div className="form-group w-auto">
            <label className="form-label text-[10px]">Turma</label>
            <select
              className="form-select"
              value={selectedTurma}
              onChange={(e) => {
                setSelectedTurma(e.target.value);
                setCronograma(getCronogramaSemana(e.target.value));
              }}
            >
              <option value="T001">5A Manhã</option>
              <option value="T002">5B Tarde</option>
              <option value="T004">4A Manhã</option>
              <option value="T005">4B Tarde</option>
              <option value="T006">Reforço Geral</option>
            </select>
          </div>
          <div className="form-group w-auto">
            <label className="form-label text-[10px]">Semana</label>
            <select
              className="form-select"
              value={selectedSemana}
              onChange={(e) => setSelectedSemana(e.target.value)}
            >
              <option>Semana 11</option>
              <option>Semana 12</option>
              <option>Semana 13</option>
              <option>Semana 14</option>
            </select>
          </div>
        </div>

        <button className="btn btn-primary w-full sm:w-auto flex items-center justify-center gap-2" onClick={handleAddActivity}>
          <Plus size={16} /> Nova Atividade
        </button>
      </div>

      {/* Week Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main List */}
        <div className="lg:col-span-2 space-y-4 animate-fade-in-up delay-1">
          <div className="card p-0">
            <div className="p-4 border-b border-[var(--color-cinza-borda)] flex items-center justify-between bg-gray-50/50">
              <h3 className="text-sm font-bold text-[var(--color-azul-autoridade)] flex items-center gap-2 m-0">
                <CalendarDays size={18} /> Cronograma da {selectedSemana}
              </h3>
              <span className="badge badge-info text-xs">{cronograma.periodo}</span>
            </div>

            <div className="p-4 space-y-3">
              {cronograma.tarefas.map((tarefa, idx) => (
                <div key={tarefa.id} className="p-4 rounded-xl border border-[var(--color-cinza-borda)] flex items-start justify-between gap-4 bg-white hover:border-[var(--color-azul-autoridade)]/30 transition-all">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-6 h-6 rounded-full bg-[var(--color-azul-lightest)] text-[var(--color-azul-autoridade)] flex items-center justify-center text-xs font-black">
                        {tarefa.ordem}
                      </span>
                      <span className="badge text-[10px] font-bold py-0.5">{tipoLabels[tarefa.tipo]}</span>
                      {tarefa.disciplina && (
                        <span className="text-[10px] text-[var(--color-cinza-texto)] font-bold">{tarefa.disciplina} • {tarefa.bloco}</span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-[var(--color-azul-autoridade)]">{tarefa.titulo}</p>
                    <p className="text-[10px] text-[var(--color-amarelo-conquista)] font-bold mt-1">+{tarefa.xp} XP no Portal</p>

                    {/* Subtasks summary */}
                    {tarefa.subTarefas && tarefa.subTarefas.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {tarefa.subTarefas.map((s: any) => (
                          <span key={s.id} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[var(--color-cinza-fundo)] text-[9px] font-semibold text-[var(--color-cinza-escuro)]">
                            <Check size={10} className="text-[var(--color-verde-sucesso)]" />
                            {s.titulo} (+{s.xp} XP)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button className="p-2 hover:bg-[var(--color-azul-lightest)] rounded-lg transition-colors text-[var(--color-azul-autoridade)]" onClick={() => handleEditActivity(tarefa)}>
                      <Edit3 size={15} />
                    </button>
                    <button className="p-2 hover:bg-[var(--color-vermelho-light)] rounded-lg transition-colors text-[var(--color-vermelho-erro)]" onClick={() => handleDeleteTarefa(tarefa.id)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info panel */}
        <div className="space-y-6 animate-fade-in-up delay-2">
          <div className="card">
            <h3 className="text-sm font-bold text-[var(--color-azul-autoridade)] mb-3">Modelagem Técnica</h3>
            <p className="text-xs text-[var(--color-cinza-escuro)] leading-relaxed">
              O cronograma semanal é composto de tarefas de trilha (Vídeos, Atividades, Aulas Presenciais, Simulados) associadas a uma Turma. No portal, o aluno visualiza e acumula XP ao completá-los.
            </p>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && editTarefa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-[var(--color-azul-autoridade)]">
                {editTarefa.id.includes('.') ? 'Editar Atividade' : 'Nova Atividade'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-[var(--color-cinza-fundo)] rounded-lg"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Título da Atividade</label>
                <input
                  type="text"
                  className="form-input"
                  value={editTarefa.titulo}
                  onChange={(e) => setEditTarefa({ ...editTarefa, titulo: e.target.value })}
                  placeholder="Ex: Videoaula: Geometria Básica"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select
                    className="form-select"
                    value={editTarefa.tipo}
                    onChange={(e) => setEditTarefa({ ...editTarefa, tipo: e.target.value })}
                  >
                    <option value="revisao">Revisão</option>
                    <option value="pre_aula">Pré-aula (Vídeo)</option>
                    <option value="aula_presencial">Aula Presencial</option>
                    <option value="simulado">Simulado</option>
                    <option value="atividade">Atividade</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Pontuação (XP)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editTarefa.xp}
                    onChange={(e) => setEditTarefa({ ...editTarefa, xp: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label">Disciplina (Opcional)</label>
                  <select
                    className="form-select"
                    value={editTarefa.disciplina || ''}
                    onChange={(e) => setEditTarefa({ ...editTarefa, disciplina: e.target.value || undefined })}
                  >
                    <option value="">Nenhuma</option>
                    <option value="Português">Português</option>
                    <option value="Matemática">Matemática</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Bloco (Opcional)</label>
                  <select
                    className="form-select"
                    value={editTarefa.bloco || ''}
                    onChange={(e) => setEditTarefa({ ...editTarefa, bloco: e.target.value || undefined })}
                  >
                    <option value="">Nenhum</option>
                    <option value="Bloco 1">Bloco 1</option>
                    <option value="Bloco 2">Bloco 2</option>
                    <option value="Bloco 3">Bloco 3</option>
                    <option value="Bloco 4">Bloco 4</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-cinza-borda)]">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveTarefa}>
                <Save size={16} /> Salvar Atividade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
