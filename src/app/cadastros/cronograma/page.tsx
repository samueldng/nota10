'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays, Plus, Trash2, Save, X, ChevronDown, ChevronUp,
  Zap, BookOpen, GripVertical, AlertCircle, CheckCircle2, Loader2,
  ListChecks, Sparkles, Upload, Send, MessageCircle, FileText,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Subtarefa {
  id: string;          // client-only uuid for React keys
  titulo: string;
  xp: number;
}

interface Tarefa {
  id: string;          // client-only uuid for React keys
  titulo: string;
  tipo: string;
  disciplina: string;
  bloco: string;
  xpTotal: number;
  subtarefas: Subtarefa[];
  collapsed: boolean;
}

interface Turma {
  id: string;
  nome: string;
  acompanhamento: string;
}

type ToastType = 'success' | 'error';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SEMANAS = Array.from({ length: 20 }, (_, i) => ({
  numero: i + 1,
  label: `Semana ${i + 1}`,
}));

const TIPOS_TAREFA = [
  { value: 'pre_aula',          label: 'Pré-aula (Vídeo)' },
  { value: 'aula_presencial',   label: 'Aula Presencial' },
  { value: 'revisao',           label: 'Revisão' },
  { value: 'simulado',          label: 'Simulado' },
  { value: 'atividade',         label: 'Atividade Complementar' },
];

const DISCIPLINAS = ['', 'Português', 'Matemática', 'Multidisciplinar'];
const BLOCOS      = ['', 'Bloco I', 'Bloco II', 'Bloco III', 'Bloco IV'];

const TIPO_COLORS: Record<string, string> = {
  pre_aula:        'bg-purple-100 text-purple-700 border-purple-200',
  aula_presencial: 'bg-blue-100 text-blue-700 border-blue-200',
  revisao:         'bg-amber-100 text-amber-700 border-amber-200',
  simulado:        'bg-rose-100 text-rose-700 border-rose-200',
  atividade:       'bg-emerald-100 text-emerald-700 border-emerald-200',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function emptyTarefa(): Tarefa {
  return {
    id: uid(),
    titulo: '',
    tipo: 'pre_aula',
    disciplina: '',
    bloco: '',
    xpTotal: 0,
    subtarefas: [],
    collapsed: false,
  };
}

function emptySubtarefa(): Subtarefa {
  return { id: uid(), titulo: '', xp: 0 };
}

// ─── Toast Component ──────────────────────────────────────────────────────────

function ToastList({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border animate-fade-in-up max-w-sm ${
            t.type === 'success'
              ? 'bg-white border-[var(--color-verde-sucesso)]/30 text-[var(--color-cinza-escuro)]'
              : 'bg-white border-[var(--color-vermelho-erro)]/30 text-[var(--color-cinza-escuro)]'
          }`}
        >
          {t.type === 'success'
            ? <CheckCircle2 size={18} className="text-[var(--color-verde-sucesso)] shrink-0 mt-0.5" />
            : <AlertCircle   size={18} className="text-[var(--color-vermelho-erro)]   shrink-0 mt-0.5" />}
          <p className="text-sm leading-snug flex-1">{t.message}</p>
          <button
            onClick={() => onDismiss(t.id)}
            className="p-0.5 hover:bg-[var(--color-cinza-fundo)] rounded transition-colors shrink-0"
          >
            <X size={14} className="text-[var(--color-cinza-texto)]" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── XP Badge ─────────────────────────────────────────────────────────────────

function XpBadge({ xp }: { xp: number }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-amarelo-light)] text-[var(--color-azul-autoridade)] text-[10px] font-black border border-[var(--color-amarelo-conquista)]/30">
      <Zap size={10} className="text-[var(--color-amarelo-conquista)]" />
      {xp} XP
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GestaoCronogramaPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [turmas, setTurmas]             = useState<Turma[]>([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>('');
  const [selectedSemana, setSelectedSemana]   = useState<number>(1);
  const [datasSemana, setDatasSemana]   = useState<string>('');

  const [tarefas, setTarefas]           = useState<Tarefa[]>([]);
  const [loadingData, setLoadingData]   = useState(false);
  const [saving, setSaving]             = useState(false);
  const [deleting, setDeleting]         = useState(false);

  const [toasts, setToasts]             = useState<Toast[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Upload & Dispatch
  const [uploadFile, setUploadFile]     = useState<File | null>(null);
  const [notifyMsg, setNotifyMsg]       = useState('Olá, {nomeResponsavel}! Segue o cronograma semanal do(a) {nomeAluno}. Acesse o Portal Nota 10 para mais detalhes.');
  const [publishing, setPublishing]     = useState(false);

  // ── Toast helpers ──────────────────────────────────────────────────────────
  const addToast = useCallback((type: ToastType, message: string) => {
    const id = uid();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Load turmas on mount ───────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/turmas')
      .then((r) => r.json())
      .then((data: Turma[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setTurmas(data);
          setSelectedTurmaId(data[0].id);
        }
      })
      .catch(() => addToast('error', 'Falha ao carregar as turmas. Recarregue a página.'));
  }, [addToast]);

  // ── Load existing schedule when turma or semana changes ───────────────────
  useEffect(() => {
    if (!selectedTurmaId) return;

    setLoadingData(true);
    setTarefas([]);

    fetch(`/api/cronograma?turmaId=${selectedTurmaId}&semana=${selectedSemana}`)
      .then((r) => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          // Hydrate DB rows into local Tarefa shape
          const hydrated: Tarefa[] = data.map((row) => ({
            id:         uid(),
            titulo:     row.titulo,
            tipo:       row.tipo,
            disciplina: row.disciplina ?? '',
            bloco:      row.bloco ?? '',
            xpTotal:    row.xpTotal ?? 0,
            collapsed:  false,
            subtarefas: (row.subtarefas ?? []).map((s: any) => ({
              id:     uid(),
              titulo: s.titulo ?? '',
              xp:     s.xp    ?? 0,
            })),
          }));
          setTarefas(hydrated);
          // Restore datasSemana from DB if available
          setDatasSemana(data[0].datasSemana ?? '');
        } else {
          setTarefas([]);
          setDatasSemana('');
        }
      })
      .catch(() => addToast('error', 'Falha ao carregar o cronograma da semana.'))
      .finally(() => setLoadingData(false));
  }, [selectedTurmaId, selectedSemana, addToast]);

  // ── Computed totals ────────────────────────────────────────────────────────
  const totalXp = tarefas.reduce((acc, t) => {
    const subtXp = t.subtarefas.reduce((s, st) => s + (st.xp || 0), 0);
    return acc + (t.xpTotal || 0) + subtXp;
  }, 0);

  // ── Tarefa CRUD ────────────────────────────────────────────────────────────
  const addTarefa = () => {
    setTarefas((prev) => [...prev, emptyTarefa()]);
  };

  const removeTarefa = (id: string) => {
    setTarefas((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTarefa = (id: string, patch: Partial<Omit<Tarefa, 'id' | 'subtarefas'>>) => {
    setTarefas((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
    );
  };

  const toggleCollapse = (id: string) => {
    setTarefas((prev) =>
      prev.map((t) => (t.id === id ? { ...t, collapsed: !t.collapsed } : t))
    );
  };

  // ── Subtarefa CRUD ─────────────────────────────────────────────────────────
  const addSubtarefa = (tarefaId: string) => {
    setTarefas((prev) =>
      prev.map((t) =>
        t.id === tarefaId
          ? { ...t, subtarefas: [...t.subtarefas, emptySubtarefa()] }
          : t
      )
    );
  };

  const removeSubtarefa = (tarefaId: string, subtId: string) => {
    setTarefas((prev) =>
      prev.map((t) =>
        t.id === tarefaId
          ? { ...t, subtarefas: t.subtarefas.filter((s) => s.id !== subtId) }
          : t
      )
    );
  };

  const updateSubtarefa = (tarefaId: string, subtId: string, patch: Partial<Subtarefa>) => {
    setTarefas((prev) =>
      prev.map((t) =>
        t.id === tarefaId
          ? {
              ...t,
              subtarefas: t.subtarefas.map((s) =>
                s.id === subtId ? { ...s, ...patch } : s
              ),
            }
          : t
      )
    );
  };

  // ── Validate before save ───────────────────────────────────────────────────
  const validate = (): string | null => {
    if (!selectedTurmaId) return 'Selecione uma turma.';
    if (!datasSemana.trim()) return 'Informe o período da semana (ex: 14 a 18 Jul).';
    if (tarefas.length === 0) return 'Adicione ao menos uma tarefa ao cronograma.';
    for (let i = 0; i < tarefas.length; i++) {
      if (!tarefas[i].titulo.trim()) return `A Tarefa ${i + 1} está sem título.`;
    }
    return null;
  };

  // ── Save semana ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const err = validate();
    if (err) { addToast('error', err); return; }

    setSaving(true);
    try {
      const payload = {
        turmaId:      selectedTurmaId,
        semanaNumero: selectedSemana,
        datasSemana:  datasSemana.trim(),
        tarefas: tarefas.map((t) => ({
          titulo:      t.titulo.trim(),
          tipo:        t.tipo,
          disciplina:  t.disciplina || null,
          bloco:       t.bloco      || null,
          xpTotal:     t.xpTotal    || 0,
          subtarefas:  t.subtarefas
            .filter((s) => s.titulo.trim())
            .map((s)  => ({ titulo: s.titulo.trim(), xp: s.xp || 0 })),
        })),
      };

      const res = await fetch('/api/cronograma/semana', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? 'Falha ao salvar.');

      addToast('success', `Cronograma da Semana ${selectedSemana} salvo com sucesso! 🎯`);
    } catch (e: any) {
      addToast('error', e.message ?? 'Erro inesperado ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete semana ──────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setConfirmDelete(false);
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/cronograma/semana?turmaId=${selectedTurmaId}&semana=${selectedSemana}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Falha ao excluir.');
      setTarefas([]);
      setDatasSemana('');
      addToast('success', `Cronograma da Semana ${selectedSemana} excluído.`);
    } catch (e: any) {
      addToast('error', e.message ?? 'Erro inesperado ao excluir.');
    } finally {
      setDeleting(false);
    }
  };

  // ── Publish + Notify via WhatsApp ──────────────────────────────────────────
  const handlePublishAndNotify = async () => {
    const err = validate();
    if (err) { addToast('error', err); return; }

    setPublishing(true);
    try {
      // 1. Save the schedule first
      await handleSave();

      // 2. Upload file attachment if present
      let anexoId: string | null = null;
      if (uploadFile) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
        });
        reader.readAsDataURL(uploadFile);
        const conteudoBase64 = await base64Promise;

        const uploadRes = await fetch('/api/anexos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: 'cronograma',
            nomeArquivo: uploadFile.name,
            mimeType: uploadFile.type,
            tamanhoBytes: uploadFile.size,
            conteudoBase64,
            turmaId: selectedTurmaId,
            semanaReferencia: `S${selectedSemana}`,
            createdBy: 'coordenador',
          }),
        });

        if (!uploadRes.ok) throw new Error('Falha ao fazer upload do arquivo.');
        const uploadData = await uploadRes.json();
        anexoId = uploadData.id;
      }

      // 3. Enqueue WhatsApp messages
      const queueRes = await fetch('/api/whatsapp/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'cronograma',
          turmaIds: [selectedTurmaId],
          mensagem: notifyMsg,
          anexoId,
        }),
      });

      const queueData = await queueRes.json();
      if (!queueRes.ok) throw new Error(queueData.error || 'Falha ao enfileirar.');

      addToast('success', `Cronograma publicado! ${queueData.enfileirados} mensagens enfileiradas. 📨`);

      // 4. Trigger async processing
      fetch('/api/whatsapp/process', { method: 'POST' })
        .then(r => r.json())
        .then(result => {
          addToast('success', `Disparo concluído: ${result.sucesso} enviados. Modo: ${result.modoDemo ? 'Demo (wa.me/)' : 'Produção'} ✅`);
        })
        .catch(() => {});

    } catch (e: any) {
      addToast('error', e.message || 'Erro ao publicar e notificar.');
    } finally {
      setPublishing(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const turmaAtual = turmas.find((t) => t.id === selectedTurmaId);

  return (
    <>
      <ToastList toasts={toasts} onDismiss={dismissToast} />

      <div className="max-w-5xl mx-auto space-y-6 pb-12">

        {/* ── Header Card — Filtros ── */}
        <div className="card animate-fade-in-up">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
            <div>
              <h2 className="text-base font-black text-[var(--color-azul-autoridade)] flex items-center gap-2 m-0">
                <CalendarDays size={20} />
                Gestão de Cronograma — Trilha de Estudos
              </h2>
              <p className="text-xs text-[var(--color-cinza-texto)] mt-1">
                Monte o cronograma semanal com tarefas e subtarefas gamificadas com XP.
              </p>
            </div>

            {/* XP Total Badge */}
            {tarefas.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-amarelo-light)] border border-[var(--color-amarelo-conquista)]/30">
                <Sparkles size={16} className="text-[var(--color-amarelo-conquista)]" />
                <span className="text-sm font-black text-[var(--color-azul-autoridade)]">
                  {totalXp} XP total na semana
                </span>
              </div>
            )}
          </div>

          {/* Filtros */}
          <div className="mt-5 flex flex-wrap gap-4 items-end">
            {/* Turma */}
            <div className="form-group min-w-[200px] flex-1">
              <label htmlFor="select-turma" className="form-label">Turma</label>
              <select
                id="select-turma"
                className="form-select"
                value={selectedTurmaId}
                onChange={(e) => setSelectedTurmaId(e.target.value)}
              >
                {turmas.length === 0 && (
                  <option value="">Carregando turmas...</option>
                )}
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            </div>

            {/* Semana */}
            <div className="form-group min-w-[180px]">
              <label htmlFor="select-semana" className="form-label">Semana</label>
              <select
                id="select-semana"
                className="form-select"
                value={selectedSemana}
                onChange={(e) => setSelectedSemana(Number(e.target.value))}
              >
                {SEMANAS.map((s) => (
                  <option key={s.numero} value={s.numero}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Período da Semana */}
            <div className="form-group flex-1 min-w-[200px]">
              <label htmlFor="input-periodo" className="form-label">Período da Semana</label>
              <input
                id="input-periodo"
                type="text"
                className="form-input"
                value={datasSemana}
                onChange={(e) => setDatasSemana(e.target.value)}
                placeholder="Ex: 14 a 18 de Julho de 2026"
              />
            </div>
          </div>

          {/* Upload de Cronograma + Mensagem WhatsApp */}
          <div className="mt-5 border-t border-[var(--color-cinza-borda)] pt-5">
            <p className="text-xs font-black text-[var(--color-azul-autoridade)] uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Send size={12} />
              Publicação e Notificação WhatsApp
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* File Upload */}
              <div className="form-group">
                <label className="form-label flex items-center gap-1.5">
                  <Upload size={12} />
                  Anexo do Cronograma (PDF / Imagem)
                </label>
                <div
                  className={`upload-zone !p-5 ${uploadFile ? 'active' : ''}`}
                  onClick={() => document.getElementById('cronograma-file-input')?.click()}
                >
                  <input
                    id="cronograma-file-input"
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          addToast('error', 'Arquivo excede 5MB.');
                          return;
                        }
                        setUploadFile(file);
                      }
                    }}
                  />
                  {uploadFile ? (
                    <div className="flex items-center gap-3 justify-center">
                      <FileText size={18} className="text-[var(--color-verde-sucesso)]" />
                      <div className="text-left">
                        <p className="text-sm font-bold text-[var(--color-azul-autoridade)]">{uploadFile.name}</p>
                        <p className="text-[10px] text-[var(--color-cinza-texto)]">
                          {(uploadFile.size / 1024).toFixed(0)} KB • Clique para trocar
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setUploadFile(null); }}
                        className="p-1 hover:bg-[var(--color-vermelho-light)] rounded transition-colors"
                      >
                        <X size={14} className="text-[var(--color-vermelho-erro)]" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload size={20} className="mx-auto text-[var(--color-cinza-texto)] mb-1" />
                      <p className="text-xs font-bold text-[var(--color-cinza-texto)]">
                        Clique para anexar PDF ou imagem
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Template */}
              <div className="form-group">
                <label className="form-label flex items-center gap-1.5">
                  <MessageCircle size={12} />
                  Texto da Mensagem WhatsApp
                </label>
                <textarea
                  className="form-input min-h-[120px] resize-y text-xs"
                  value={notifyMsg}
                  onChange={(e) => setNotifyMsg(e.target.value)}
                  placeholder="Use {nomeResponsavel} e {nomeAluno} como variáveis..."
                />
                <p className="text-[10px] text-[var(--color-cinza-texto)]">
                  Variáveis: <code className="bg-[var(--color-cinza-fundo)] px-1 rounded">{'{nomeResponsavel}'}</code> e <code className="bg-[var(--color-cinza-fundo)] px-1 rounded">{'{nomeAluno}'}</code>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Loading State ── */}
        {loadingData && (
          <div className="flex items-center justify-center py-16 gap-3 text-[var(--color-cinza-texto)]">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm font-semibold">Carregando cronograma...</span>
          </div>
        )}

        {/* ── Empty State ── */}
        {!loadingData && tarefas.length === 0 && (
          <div className="card flex flex-col items-center justify-center py-14 gap-4 animate-fade-in-up text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-azul-lightest)] flex items-center justify-center">
              <ListChecks size={32} className="text-[var(--color-azul-autoridade)]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--color-azul-autoridade)]">
                Nenhuma tarefa cadastrada para esta semana.
              </p>
              <p className="text-xs text-[var(--color-cinza-texto)] mt-1">
                Clique em "+ Nova Tarefa" para começar a montar o cronograma.
              </p>
            </div>
            <button
              id="btn-add-first-tarefa"
              className="btn btn-primary"
              onClick={addTarefa}
            >
              <Plus size={16} /> Nova Tarefa
            </button>
          </div>
        )}

        {/* ── Tarefas List ── */}
        {!loadingData && tarefas.length > 0 && (
          <div className="space-y-4 animate-fade-in-up">
            {tarefas.map((tarefa, idx) => (
              <TarefaCard
                key={tarefa.id}
                tarefa={tarefa}
                index={idx}
                onUpdate={(patch) => updateTarefa(tarefa.id, patch)}
                onRemove={() => removeTarefa(tarefa.id)}
                onToggleCollapse={() => toggleCollapse(tarefa.id)}
                onAddSubtarefa={() => addSubtarefa(tarefa.id)}
                onRemoveSubtarefa={(subtId) => removeSubtarefa(tarefa.id, subtId)}
                onUpdateSubtarefa={(subtId, patch) => updateSubtarefa(tarefa.id, subtId, patch)}
              />
            ))}

            {/* Add Tarefa Button */}
            <button
              id="btn-add-tarefa"
              className="w-full py-3 rounded-2xl border-2 border-dashed border-[var(--color-cinza-borda)] text-sm font-bold text-[var(--color-cinza-texto)] hover:border-[var(--color-azul-autoridade)] hover:text-[var(--color-azul-autoridade)] hover:bg-[var(--color-azul-lightest)] transition-all flex items-center justify-center gap-2"
              onClick={addTarefa}
            >
              <Plus size={16} /> Adicionar Nova Tarefa
            </button>
          </div>
        )}

        {/* ── Actions Bar ── */}
        {!loadingData && (
          <div className="sticky bottom-4 z-10">
            <div className="card flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/95 backdrop-blur-md shadow-lg border-[var(--color-azul-autoridade)]/10">
              <p className="text-xs text-[var(--color-cinza-texto)]">
                {tarefas.length > 0
                  ? `${tarefas.length} tarefa${tarefas.length > 1 ? 's' : ''} • ${totalXp} XP total`
                  : 'Nenhuma tarefa no cronograma.'}
              </p>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {tarefas.length > 0 && (
                  <button
                    id="btn-excluir-semana"
                    className="btn btn-outline text-[var(--color-vermelho-erro)] border-[var(--color-vermelho-erro)]/30 hover:border-[var(--color-vermelho-erro)] hover:bg-[var(--color-vermelho-light)] w-full sm:w-auto"
                    onClick={() => setConfirmDelete(true)}
                    disabled={deleting || saving}
                  >
                    {deleting
                      ? <Loader2 size={15} className="animate-spin" />
                      : <Trash2 size={15} />}
                    Excluir Semana
                  </button>
                )}
                <button
                  id="btn-salvar-cronograma"
                  className="btn btn-primary w-full sm:w-auto"
                  onClick={handleSave}
                  disabled={saving || deleting || publishing}
                >
                  {saving
                    ? <Loader2 size={15} className="animate-spin" />
                    : <Save size={15} />}
                  {saving ? 'Salvando...' : 'Salvar Cronograma'}
                </button>
                <button
                  id="btn-publicar-notificar"
                  className="btn bg-[#22C55E] text-white hover:bg-green-600 active:scale-95 w-full sm:w-auto"
                  onClick={handlePublishAndNotify}
                  disabled={saving || deleting || publishing || tarefas.length === 0}
                >
                  {publishing
                    ? <Loader2 size={15} className="animate-spin" />
                    : <Send size={15} />}
                  {publishing ? 'Publicando...' : 'Publicar e Notificar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Confirm Delete Modal ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDelete(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-vermelho-light)] flex items-center justify-center shrink-0">
                <AlertCircle size={24} className="text-[var(--color-vermelho-erro)]" />
              </div>
              <div>
                <h3 className="text-base font-black text-[var(--color-azul-autoridade)] m-0 mb-2">
                  Excluir cronograma da Semana {selectedSemana}?
                </h3>
                <p className="text-sm text-[var(--color-cinza-texto)]">
                  Todas as <strong>{tarefas.length} tarefa{tarefas.length > 1 ? 's' : ''}</strong> desta semana
                  para a turma <strong>{turmaAtual?.nome}</strong> serão removidas permanentemente.
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn btn-outline" onClick={() => setConfirmDelete(false)}>
                Cancelar
              </button>
              <button
                id="btn-confirmar-exclusao"
                className="btn bg-[var(--color-vermelho-erro)] text-white hover:bg-red-700 active:scale-95"
                onClick={handleDelete}
              >
                <Trash2 size={15} /> Sim, excluir tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── TarefaCard Component ─────────────────────────────────────────────────────

interface TarefaCardProps {
  tarefa: Tarefa;
  index: number;
  onUpdate: (patch: Partial<Omit<Tarefa, 'id' | 'subtarefas'>>) => void;
  onRemove: () => void;
  onToggleCollapse: () => void;
  onAddSubtarefa: () => void;
  onRemoveSubtarefa: (subtId: string) => void;
  onUpdateSubtarefa: (subtId: string, patch: Partial<Subtarefa>) => void;
}

function TarefaCard({
  tarefa, index,
  onUpdate, onRemove, onToggleCollapse,
  onAddSubtarefa, onRemoveSubtarefa, onUpdateSubtarefa,
}: TarefaCardProps) {
  const subtXp  = tarefa.subtarefas.reduce((s, st) => s + (st.xp || 0), 0);
  const totalXp = (tarefa.xpTotal || 0) + subtXp;

  const tipoBadge = TIPO_COLORS[tarefa.tipo] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  const tipoLabel = TIPOS_TAREFA.find((t) => t.value === tarefa.tipo)?.label ?? tarefa.tipo;

  return (
    <div
      className="bg-white rounded-2xl border-2 border-[var(--color-cinza-borda)] hover:border-[var(--color-azul-autoridade)]/30 transition-all shadow-sm overflow-hidden"
    >
      {/* Card Header */}
      <div className="flex items-center gap-3 p-4 bg-[var(--color-cinza-fundo)]/50">
        {/* Order Number */}
        <div className="w-7 h-7 rounded-full bg-[var(--color-azul-autoridade)] text-white flex items-center justify-center text-xs font-black shrink-0">
          {index + 1}
        </div>

        {/* Title Input */}
        <input
          id={`tarefa-titulo-${index}`}
          type="text"
          className="form-input flex-1 text-sm font-bold py-1.5"
          placeholder={`Título da Tarefa ${index + 1} — Ex: Preparação — Português, Bloco I`}
          value={tarefa.titulo}
          onChange={(e) => onUpdate({ titulo: e.target.value })}
        />

        {/* XP Summary */}
        <XpBadge xp={totalXp} />

        {/* Collapse / Expand */}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg hover:bg-[var(--color-azul-lightest)] transition-colors text-[var(--color-azul-autoridade)] shrink-0"
          title={tarefa.collapsed ? 'Expandir' : 'Recolher'}
        >
          {tarefa.collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>

        {/* Delete Tarefa */}
        <button
          onClick={onRemove}
          className="p-1.5 rounded-lg hover:bg-[var(--color-vermelho-light)] transition-colors text-[var(--color-vermelho-erro)] shrink-0"
          title="Remover tarefa"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Card Body */}
      {!tarefa.collapsed && (
        <div className="p-4 space-y-4">
          {/* Row 1: Tipo, Disciplina, Bloco, XP da Tarefa */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Tipo */}
            <div className="form-group">
              <label className="form-label">Tipo</label>
              <select
                id={`tarefa-tipo-${index}`}
                className="form-select"
                value={tarefa.tipo}
                onChange={(e) => onUpdate({ tipo: e.target.value })}
              >
                {TIPOS_TAREFA.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Disciplina */}
            <div className="form-group">
              <label className="form-label">Disciplina</label>
              <select
                id={`tarefa-disciplina-${index}`}
                className="form-select"
                value={tarefa.disciplina}
                onChange={(e) => onUpdate({ disciplina: e.target.value })}
              >
                {DISCIPLINAS.map((d) => (
                  <option key={d} value={d}>{d || '— Nenhuma —'}</option>
                ))}
              </select>
            </div>

            {/* Bloco */}
            <div className="form-group">
              <label className="form-label">Bloco</label>
              <select
                id={`tarefa-bloco-${index}`}
                className="form-select"
                value={tarefa.bloco}
                onChange={(e) => onUpdate({ bloco: e.target.value })}
              >
                {BLOCOS.map((b) => (
                  <option key={b} value={b}>{b || '— Nenhum —'}</option>
                ))}
              </select>
            </div>

            {/* XP da Tarefa */}
            <div className="form-group">
              <label className="form-label flex items-center gap-1">
                <Zap size={11} className="text-[var(--color-amarelo-conquista)]" />
                XP da Tarefa
              </label>
              <input
                id={`tarefa-xp-${index}`}
                type="number"
                min={0}
                className="form-input"
                value={tarefa.xpTotal}
                onChange={(e) => onUpdate({ xpTotal: Math.max(0, parseInt(e.target.value) || 0) })}
                placeholder="0"
              />
            </div>
          </div>

          {/* Tipo badge preview */}
          <div className="flex items-center gap-2">
            <span className={`badge ${tipoBadge} text-[10px]`}>{tipoLabel}</span>
            {tarefa.disciplina && (
              <span className="badge badge-info text-[10px]">{tarefa.disciplina}</span>
            )}
            {tarefa.bloco && (
              <span className="badge text-[10px] bg-[var(--color-cinza-fundo)] text-[var(--color-cinza-texto)] border-[var(--color-cinza-borda)]">
                {tarefa.bloco}
              </span>
            )}
          </div>

          {/* Subtarefas Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-[var(--color-azul-autoridade)] uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen size={12} />
                Subtarefas ({tarefa.subtarefas.length})
              </p>
              <button
                id={`btn-add-subtarefa-${index}`}
                onClick={onAddSubtarefa}
                className="text-xs font-bold text-[var(--color-azul-autoridade)] flex items-center gap-1 hover:bg-[var(--color-azul-lightest)] px-2 py-1 rounded-lg transition-colors"
              >
                <Plus size={13} /> Adicionar Subtarefa
              </button>
            </div>

            {tarefa.subtarefas.length === 0 && (
              <p className="text-xs text-[var(--color-cinza-texto)] italic px-1">
                Nenhuma subtarefa ainda. As subtarefas permitem XP granular para cada etapa concluída.
              </p>
            )}

            <div className="space-y-2">
              {tarefa.subtarefas.map((sub, sIdx) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-cinza-fundo)] border border-[var(--color-cinza-borda)]"
                >
                  {/* Sub-index indicator */}
                  <span className="w-5 h-5 rounded-full bg-[var(--color-azul-lightest)] text-[var(--color-azul-autoridade)] flex items-center justify-center text-[10px] font-black shrink-0">
                    {sIdx + 1}
                  </span>

                  {/* Subtarefa Título */}
                  <input
                    id={`sub-titulo-${index}-${sIdx}`}
                    type="text"
                    className="form-input flex-1 py-1.5 text-xs"
                    placeholder='Ex: Assistir à videoaula, Fazer os registros, Estudar a apostila…'
                    value={sub.titulo}
                    onChange={(e) => onUpdateSubtarefa(sub.id, { titulo: e.target.value })}
                  />

                  {/* XP Input */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Zap size={12} className="text-[var(--color-amarelo-conquista)]" />
                    <input
                      id={`sub-xp-${index}-${sIdx}`}
                      type="number"
                      min={0}
                      className="form-input w-16 py-1.5 text-xs text-center"
                      placeholder="XP"
                      value={sub.xp}
                      onChange={(e) =>
                        onUpdateSubtarefa(sub.id, {
                          xp: Math.max(0, parseInt(e.target.value) || 0),
                        })
                      }
                    />
                  </div>

                  {/* Remove subtarefa */}
                  <button
                    onClick={() => onRemoveSubtarefa(sub.id)}
                    className="p-1 rounded-lg hover:bg-[var(--color-vermelho-light)] transition-colors text-[var(--color-vermelho-erro)] shrink-0"
                    title="Remover subtarefa"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
