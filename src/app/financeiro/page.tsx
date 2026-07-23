'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, Upload, Link2, Send, Search, Filter, Loader2,
  CheckCircle2, AlertCircle, X, Eye, Trash2, ExternalLink,
  Users, FileText, Clock, Zap, MessageCircle,
} from 'lucide-react';

interface Turma {
  id: string;
  nome: string;
}

interface Aluno {
  id: string;
  nome: string;
  numero: string;
  turma: string;
  turmaId: string;
  responsavel1: { nome: string; telefone: string };
}

interface Boleto {
  id: string;
  alunoId: string;
  nomeArquivo: string;
  linkExterno: string | null;
  mesReferencia: string;
  createdAt: string;
}

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: string; type: ToastType; message: string; }

function uid() { return Math.random().toString(36).slice(2, 10); }

function ToastList({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border animate-fade-in-up max-w-sm ${
            t.type === 'success'
              ? 'bg-white border-[var(--color-verde-sucesso)]/30'
              : t.type === 'info'
              ? 'bg-white border-[var(--color-azul-info)]/30'
              : 'bg-white border-[var(--color-vermelho-erro)]/30'
          }`}
        >
          {t.type === 'success' && <CheckCircle2 size={18} className="text-[var(--color-verde-sucesso)] shrink-0 mt-0.5" />}
          {t.type === 'error' && <AlertCircle size={18} className="text-[var(--color-vermelho-erro)] shrink-0 mt-0.5" />}
          {t.type === 'info' && <MessageCircle size={18} className="text-[var(--color-azul-info)] shrink-0 mt-0.5" />}
          <p className="text-sm leading-snug flex-1 text-[var(--color-cinza-escuro)]">{t.message}</p>
          <button onClick={() => onDismiss(t.id)} className="p-0.5 hover:bg-[var(--color-cinza-fundo)] rounded transition-colors shrink-0">
            <X size={14} className="text-[var(--color-cinza-texto)]" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function FinanceiroPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [boletos, setBoletos] = useState<Record<string, Boleto[]>>({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterTurma, setFilterTurma] = useState('');
  const [filterBusca, setFilterBusca] = useState('');
  const [filterMes, setFilterMes] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Modal
  const [modalAluno, setModalAluno] = useState<Aluno | null>(null);
  const [modalLink, setModalLink] = useState('');
  const [modalFile, setModalFile] = useState<File | null>(null);
  const [modalSaving, setModalSaving] = useState(false);

  // Dispatch
  const [dispatching, setDispatching] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<any>(null);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = uid();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  // Load turmas and alunos
  useEffect(() => {
    async function load() {
      try {
        const [turmasRes, alunosRes] = await Promise.all([
          fetch('/api/turmas').then(r => r.json()),
          fetch('/api/alunos').then(r => r.json()),
        ]);
        if (Array.isArray(turmasRes)) setTurmas(turmasRes);
        if (Array.isArray(alunosRes)) setAlunos(alunosRes);
      } catch (err) {
        addToast('error', 'Falha ao carregar dados.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [addToast]);

  // Load boletos for the selected month
  useEffect(() => {
    async function loadBoletos() {
      try {
        const res = await fetch(`/api/anexos?tipo=boleto`);
        const data = await res.json();
        if (Array.isArray(data)) {
          const grouped: Record<string, Boleto[]> = {};
          for (const b of data) {
            if (!grouped[b.alunoId]) grouped[b.alunoId] = [];
            grouped[b.alunoId].push(b);
          }
          setBoletos(grouped);
        }
      } catch {
        // silent
      }
    }
    loadBoletos();
  }, [filterMes]);

  // Filtered alunos
  const filteredAlunos = alunos.filter(a => {
    if (filterTurma && a.turmaId !== filterTurma) return false;
    if (filterBusca) {
      const q = filterBusca.toLowerCase();
      if (!a.nome.toLowerCase().includes(q) && !a.numero?.includes(q)) return false;
    }
    return true;
  });

  // Check if aluno has boleto for current month
  const getBoletosAluno = (alunoId: string) => {
    return (boletos[alunoId] || []).filter(b => !filterMes || b.mesReferencia === filterMes);
  };

  // Handle upload/link save
  const handleSaveBoleto = async () => {
    if (!modalAluno) return;
    setModalSaving(true);

    try {
      if (modalFile) {
        // Upload file
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); // Remove data:... prefix
          };
        });
        reader.readAsDataURL(modalFile);
        const conteudoBase64 = await base64Promise;

        const res = await fetch('/api/anexos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: 'boleto',
            nomeArquivo: modalFile.name,
            mimeType: modalFile.type,
            tamanhoBytes: modalFile.size,
            conteudoBase64,
            alunoId: modalAluno.id,
            mesReferencia: filterMes,
            linkExterno: modalLink || null,
            createdBy: 'coordenador',
          }),
        });

        if (!res.ok) throw new Error('Falha ao enviar arquivo.');
      } else if (modalLink) {
        // Link only
        const res = await fetch('/api/anexos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: 'boleto',
            nomeArquivo: `boleto-${modalAluno.nome.replace(/\s/g, '_')}-${filterMes}.link`,
            mimeType: 'text/uri-list',
            tamanhoBytes: 0,
            conteudoBase64: btoa(modalLink),
            alunoId: modalAluno.id,
            mesReferencia: filterMes,
            linkExterno: modalLink,
            createdBy: 'coordenador',
          }),
        });

        if (!res.ok) throw new Error('Falha ao salvar link.');
      } else {
        addToast('error', 'Anexe um arquivo ou cole um link de cobrança.');
        setModalSaving(false);
        return;
      }

      addToast('success', `Boleto de ${modalAluno.nome} salvo com sucesso!`);
      setModalAluno(null);
      setModalLink('');
      setModalFile(null);

      // Refresh boletos
      const res = await fetch(`/api/anexos?tipo=boleto`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const grouped: Record<string, Boleto[]> = {};
        for (const b of data) {
          if (!grouped[b.alunoId]) grouped[b.alunoId] = [];
          grouped[b.alunoId].push(b);
        }
        setBoletos(grouped);
      }
    } catch (err: any) {
      addToast('error', err.message || 'Erro ao salvar boleto.');
    } finally {
      setModalSaving(false);
    }
  };

  // Dispatch all boletos via WhatsApp
  const handleDispatchAll = async () => {
    const alunosComBoleto = filteredAlunos.filter(a => {
      const bols = getBoletosAluno(a.id);
      return bols.length > 0;
    });

    if (alunosComBoleto.length === 0) {
      addToast('error', 'Nenhum aluno com boleto para disparar.');
      return;
    }

    setDispatching(true);

    try {
      const items = alunosComBoleto.map(a => {
        const bol = getBoletosAluno(a.id)[0];
        return {
          alunoId: a.id,
          linkBoleto: bol.linkExterno || `${window.location.origin}/api/anexos?id=${bol.id}&download=true`,
        };
      });

      const res = await fetch('/api/whatsapp/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'boleto', items }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Falha ao enfileirar.');

      addToast('success', `${data.enfileirados} mensagens enfileiradas! Processando em background...`);

      // Trigger processing
      fetch('/api/whatsapp/process', { method: 'POST' })
        .then(r => r.json())
        .then(result => {
          addToast('info', `Processamento concluído: ${result.sucesso} enviados, ${result.erro} erros. Modo: ${result.modoDemo ? 'Demo (wa.me/)' : 'Produção'}`);
        })
        .catch(() => {});

    } catch (err: any) {
      addToast('error', err.message || 'Erro ao disparar.');
    } finally {
      setDispatching(false);
    }
  };

  const mesesOptions = (() => {
    const opts = [];
    const now = new Date();
    for (let i = -2; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      opts.push({ value: val, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return opts;
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-[var(--color-azul-autoridade)]" />
      </div>
    );
  }

  return (
    <>
      <ToastList toasts={toasts} onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />

      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="card animate-fade-in-up">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-base font-black text-[var(--color-azul-autoridade)] flex items-center gap-2 m-0">
                <DollarSign size={20} />
                Gestão Financeira — Boletos
              </h2>
              <p className="text-xs text-[var(--color-cinza-texto)] mt-1">
                Anexe boletos por aluno e envie notificações via WhatsApp.
              </p>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleDispatchAll}
              disabled={dispatching}
            >
              {dispatching ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {dispatching ? 'Disparando...' : 'Notificar Todos via WhatsApp'}
            </button>
          </div>

          {/* Filters */}
          <div className="mt-5 flex flex-wrap gap-4 items-end">
            <div className="form-group min-w-[200px] flex-1">
              <label className="form-label">Turma</label>
              <select
                className="form-select"
                value={filterTurma}
                onChange={(e) => setFilterTurma(e.target.value)}
              >
                <option value="">Todas as Turmas</option>
                {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>

            <div className="form-group min-w-[180px]">
              <label className="form-label">Mês Referência</label>
              <select
                className="form-select"
                value={filterMes}
                onChange={(e) => setFilterMes(e.target.value)}
              >
                {mesesOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="form-group flex-1 min-w-[200px]">
              <label className="form-label">Buscar Aluno</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-cinza-texto)]" />
                <input
                  type="text"
                  className="form-input pl-9"
                  placeholder="Nome ou matrícula..."
                  value={filterBusca}
                  onChange={(e) => setFilterBusca(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up delay-1">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--color-azul-lightest)', color: 'var(--color-azul-autoridade)' }}>
              <Users size={20} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[var(--color-azul-autoridade)] leading-none">{filteredAlunos.length}</p>
              <p className="text-xs text-[var(--color-cinza-texto)] mt-1">Alunos</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--color-verde-light)', color: 'var(--color-verde-sucesso)' }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[var(--color-verde-sucesso)] leading-none">
                {filteredAlunos.filter(a => getBoletosAluno(a.id).length > 0).length}
              </p>
              <p className="text-xs text-[var(--color-cinza-texto)] mt-1">Com Boleto</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--color-amarelo-alerta-light)', color: 'var(--color-amarelo-alerta)' }}>
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[var(--color-amarelo-alerta)] leading-none">
                {filteredAlunos.filter(a => getBoletosAluno(a.id).length === 0).length}
              </p>
              <p className="text-xs text-[var(--color-cinza-texto)] mt-1">Sem Boleto</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--color-roxo-light)', color: '#8B5CF6' }}>
              <MessageCircle size={20} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#8B5CF6] leading-none">
                {filteredAlunos.filter(a => getBoletosAluno(a.id).length > 0 && a.responsavel1?.telefone).length}
              </p>
              <p className="text-xs text-[var(--color-cinza-texto)] mt-1">Prontos p/ Envio</p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card animate-fade-in-up delay-2">
          <div className="overflow-x-auto">
            {filteredAlunos.length === 0 ? (
              <div className="text-center py-10 text-[var(--color-cinza-texto)] text-sm">
                Nenhum aluno encontrado com os filtros selecionados.
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th>Turma</th>
                    <th>Responsável</th>
                    <th>Telefone</th>
                    <th>Boleto</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlunos.map(aluno => {
                    const aluBoletos = getBoletosAluno(aluno.id);
                    const hasBoleto = aluBoletos.length > 0;
                    const hasPhone = !!aluno.responsavel1?.telefone;

                    return (
                      <tr key={aluno.id} className={!hasBoleto ? 'row-warning' : ''}>
                        <td>
                          <div>
                            <p className="font-semibold text-sm text-[var(--color-azul-autoridade)]">{aluno.nome}</p>
                            <p className="text-[10px] text-[var(--color-cinza-texto)]">Nº {aluno.numero}</p>
                          </div>
                        </td>
                        <td className="text-sm">{aluno.turma}</td>
                        <td className="text-sm">{aluno.responsavel1?.nome || '—'}</td>
                        <td>
                          {hasPhone ? (
                            <span className="text-sm font-mono">{aluno.responsavel1.telefone}</span>
                          ) : (
                            <span className="badge badge-error text-[10px]">Sem telefone</span>
                          )}
                        </td>
                        <td>
                          {hasBoleto ? (
                            <div className="flex items-center gap-2">
                              <span className="badge badge-success text-[10px]">
                                <CheckCircle2 size={10} />
                                Anexado
                              </span>
                              {aluBoletos[0].linkExterno && (
                                <a
                                  href={aluBoletos[0].linkExterno}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[var(--color-azul-info)] hover:underline"
                                  title="Abrir link"
                                >
                                  <ExternalLink size={13} />
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="badge badge-warning text-[10px]">
                              <Clock size={10} />
                              Pendente
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setModalAluno(aluno);
                                setModalLink('');
                                setModalFile(null);
                              }}
                              className="btn btn-outline text-xs py-1.5 px-3"
                              title={hasBoleto ? 'Substituir boleto' : 'Anexar boleto'}
                            >
                              {hasBoleto ? <Eye size={13} /> : <Upload size={13} />}
                              {hasBoleto ? 'Ver/Editar' : 'Anexar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Attach Boleto */}
      {modalAluno && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !modalSaving && setModalAluno(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--color-cinza-borda)]">
              <div>
                <h3 className="text-base font-black text-[var(--color-azul-autoridade)] m-0">
                  Boleto — {modalAluno.nome}
                </h3>
                <p className="text-xs text-[var(--color-cinza-texto)] mt-0.5">
                  Turma: {modalAluno.turma} • Ref: {mesesOptions.find(o => o.value === filterMes)?.label}
                </p>
              </div>
              <button
                onClick={() => !modalSaving && setModalAluno(null)}
                className="p-2 hover:bg-[var(--color-cinza-fundo)] rounded-xl transition-colors"
              >
                <X size={18} className="text-[var(--color-cinza-texto)]" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5">
              {/* Link do boleto */}
              <div className="form-group">
                <label className="form-label flex items-center gap-1.5">
                  <Link2 size={12} />
                  Link de Cobrança (Asaas, Mercado Pago, etc.)
                </label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://www.asaas.com/c/..."
                  value={modalLink}
                  onChange={(e) => setModalLink(e.target.value)}
                />
                <p className="text-[10px] text-[var(--color-cinza-texto)]">
                  Cole o link gerado pelo gateway de pagamento. Este link será enviado ao responsável.
                </p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[var(--color-cinza-borda)]" />
                <span className="text-[10px] font-bold text-[var(--color-cinza-texto)] uppercase">ou</span>
                <div className="flex-1 h-px bg-[var(--color-cinza-borda)]" />
              </div>

              {/* File upload */}
              <div className="form-group">
                <label className="form-label flex items-center gap-1.5">
                  <Upload size={12} />
                  Upload de Boleto (PDF / Imagem)
                </label>
                <div
                  className={`upload-zone ${modalFile ? 'active' : ''}`}
                  onClick={() => document.getElementById('boleto-file-input')?.click()}
                >
                  <input
                    id="boleto-file-input"
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
                        setModalFile(file);
                      }
                    }}
                  />
                  {modalFile ? (
                    <div className="flex items-center gap-3 justify-center">
                      <FileText size={20} className="text-[var(--color-verde-sucesso)]" />
                      <div className="text-left">
                        <p className="text-sm font-bold text-[var(--color-azul-autoridade)]">{modalFile.name}</p>
                        <p className="text-[10px] text-[var(--color-cinza-texto)]">
                          {(modalFile.size / 1024).toFixed(0)} KB • Clique para trocar
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload size={24} className="mx-auto text-[var(--color-cinza-texto)] mb-2" />
                      <p className="text-sm font-bold text-[var(--color-cinza-texto)]">
                        Clique ou arraste o arquivo aqui
                      </p>
                      <p className="text-[10px] text-[var(--color-cinza-texto)] mt-1">
                        PDF ou imagem • Máximo 5MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-5 border-t border-[var(--color-cinza-borda)]">
              <button
                className="btn btn-outline"
                onClick={() => !modalSaving && setModalAluno(null)}
                disabled={modalSaving}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveBoleto}
                disabled={modalSaving || (!modalLink && !modalFile)}
              >
                {modalSaving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                {modalSaving ? 'Salvando...' : 'Salvar Boleto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
