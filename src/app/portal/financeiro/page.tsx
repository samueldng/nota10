'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  DollarSign, Download, ExternalLink, FileText, Clock,
  CheckCircle2, AlertCircle, Loader2, Receipt, Eye,
} from 'lucide-react';

interface Boleto {
  id: string;
  nomeArquivo: string;
  mimeType: string;
  tamanhoBytes: number;
  mesReferencia: string;
  linkExterno: string | null;
  createdAt: string;
}

function formatMes(mesRef: string): string {
  if (!mesRef) return '—';
  const [year, month] = mesRef.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PortalFinanceiroPage() {
  const { user } = useAuth();
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewBoleto, setPreviewBoleto] = useState<Boleto | null>(null);
  const [previewData, setPreviewData] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    async function loadBoletos() {
      if (!user?.alunoId) return;
      try {
        const res = await fetch(`/api/anexos?tipo=boleto&alunoId=${user.alunoId}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setBoletos(data);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar boletos:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBoletos();
  }, [user]);

  const handlePreview = async (boleto: Boleto) => {
    setPreviewBoleto(boleto);
    setPreviewLoading(true);
    setPreviewData(null);

    try {
      const res = await fetch(`/api/anexos?id=${boleto.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.conteudoBase64 && data.mimeType) {
          setPreviewData(`data:${data.mimeType};base64,${data.conteudoBase64}`);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar preview:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = (boleto: Boleto) => {
    const link = document.createElement('a');
    link.href = `/api/anexos?id=${boleto.id}&download=true`;
    link.download = boleto.nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-[var(--color-azul-autoridade)]" />
      </div>
    );
  }

  const studentName = user?.alunoNome || 'Aluno';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-[var(--color-cinza-borda)] shadow-sm animate-fade-in-up">
        <div>
          <span className="text-xs font-bold text-[var(--color-amarelo-conquista)] uppercase tracking-wider block mb-1">
            Área Financeira
          </span>
          <h2 className="text-2xl font-bold text-[var(--color-azul-autoridade)] m-0">
            Boletos de {studentName}
          </h2>
          <p className="text-[var(--color-cinza-texto)] text-sm mt-1">
            Visualize e baixe os boletos de pagamento do seu filho(a).
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-azul-lightest)] border border-[var(--color-azul-autoridade)]/10">
          <Receipt size={16} className="text-[var(--color-azul-autoridade)]" />
          <span className="text-sm font-bold text-[var(--color-azul-autoridade)]">
            {boletos.length} boleto{boletos.length !== 1 ? 's' : ''} disponível{boletos.length !== 1 ? 'is' : ''}
          </span>
        </div>
      </div>

      {/* Boletos List */}
      {boletos.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-14 gap-4 animate-fade-in-up text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-cinza-fundo)] flex items-center justify-center">
            <DollarSign size={32} className="text-[var(--color-cinza-texto)]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--color-azul-autoridade)]">
              Nenhum boleto disponível
            </p>
            <p className="text-xs text-[var(--color-cinza-texto)] mt-1">
              Quando a coordenação publicar um novo boleto, ele aparecerá aqui.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up delay-1">
          {boletos.map((boleto) => (
            <div
              key={boleto.id}
              className="card card-selectable flex flex-col gap-4"
            >
              {/* Boleto Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-azul-lightest)] flex items-center justify-center">
                    <FileText size={22} className="text-[var(--color-azul-autoridade)]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--color-azul-autoridade)]">
                      {formatMes(boleto.mesReferencia)}
                    </p>
                    <p className="text-[10px] text-[var(--color-cinza-texto)] mt-0.5">
                      Publicado em {formatDate(boleto.createdAt)}
                    </p>
                  </div>
                </div>
                <span className="badge badge-success text-[10px]">
                  <CheckCircle2 size={10} />
                  Disponível
                </span>
              </div>

              {/* Boleto Details */}
              <div className="bg-[var(--color-cinza-fundo)] rounded-xl p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--color-cinza-texto)]">Arquivo:</span>
                  <span className="font-semibold text-[var(--color-cinza-escuro)]">{boleto.nomeArquivo}</span>
                </div>
                {boleto.tamanhoBytes > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-cinza-texto)]">Tamanho:</span>
                    <span className="font-semibold text-[var(--color-cinza-escuro)]">{formatSize(boleto.tamanhoBytes)}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {boleto.linkExterno && (
                  <a
                    href={boleto.linkExterno}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary flex-1 text-xs no-underline"
                  >
                    <ExternalLink size={14} />
                    Pagar Online
                  </a>
                )}
                <button
                  onClick={() => handlePreview(boleto)}
                  className="btn btn-outline flex-1 text-xs"
                >
                  <Eye size={14} />
                  Visualizar
                </button>
                <button
                  onClick={() => handleDownload(boleto)}
                  className="btn btn-outline text-xs"
                >
                  <Download size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewBoleto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setPreviewBoleto(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-fade-in-up">
            <div className="flex items-center justify-between p-5 border-b border-[var(--color-cinza-borda)]">
              <div>
                <h3 className="text-base font-black text-[var(--color-azul-autoridade)] m-0">
                  {formatMes(previewBoleto.mesReferencia)}
                </h3>
                <p className="text-xs text-[var(--color-cinza-texto)]">{previewBoleto.nomeArquivo}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(previewBoleto)}
                  className="btn btn-primary text-xs py-1.5"
                >
                  <Download size={13} /> Baixar
                </button>
                <button
                  onClick={() => setPreviewBoleto(null)}
                  className="p-2 hover:bg-[var(--color-cinza-fundo)] rounded-xl transition-colors"
                >
                  <span className="text-[var(--color-cinza-texto)] text-lg font-bold">✕</span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-5">
              {previewLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 size={32} className="animate-spin text-[var(--color-azul-autoridade)]" />
                </div>
              ) : previewData ? (
                previewBoleto.mimeType?.startsWith('image/') ? (
                  <img src={previewData} alt={previewBoleto.nomeArquivo} className="max-w-full rounded-xl mx-auto" />
                ) : previewBoleto.mimeType === 'application/pdf' ? (
                  <iframe
                    src={previewData}
                    className="w-full h-[60vh] rounded-xl border border-[var(--color-cinza-borda)]"
                    title="Preview do Boleto"
                  />
                ) : (
                  <div className="text-center py-10 text-[var(--color-cinza-texto)]">
                    <FileText size={40} className="mx-auto mb-3 text-[var(--color-cinza-texto)]" />
                    <p className="text-sm">Prévia não disponível para este formato.</p>
                    <p className="text-xs mt-1">Use o botão "Baixar" para abrir o arquivo.</p>
                  </div>
                )
              ) : (
                <div className="text-center py-10 text-[var(--color-cinza-texto)]">
                  <AlertCircle size={40} className="mx-auto mb-3" />
                  <p className="text-sm">Não foi possível carregar a prévia.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
