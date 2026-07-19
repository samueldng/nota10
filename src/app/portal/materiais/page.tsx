'use client';

import { useAuth } from '@/context/AuthContext';
import { Download, FileText, Calendar, Search, CheckCircle, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function MateriaisPage() {
  const { user } = useAuth();
  const alunoId = user?.alunoId || 'a1';
  const turmaId = user?.turmaId;
  const turmaNome = user?.turma || '';
  const [materiais, setMateriais] = useState<any[]>([]);
  const [atividadesConcluidas, setAtividadesConcluidas] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('todos');
  const [toast, setToast] = useState<string | null>(null);

  const loadProgresso = async () => {
    try {
      const res = await fetch(`/api/progresso?alunoId=${alunoId}`);
      if (res.ok) {
        const data = await res.json();
        setAtividadesConcluidas(data.atividadesConcluidas || []);
      }
    } catch (e) {
      console.error('Erro ao carregar progresso:', e);
    }
  };

  const loadMateriais = async () => {
    try {
      const res = await fetch(`/api/conteudos?alunoId=${alunoId}&tipoConteudo=pdf`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const formatted = data.map((item: any) => {
            let extra = { tipo: 'apostila', tamanho: '5.2 MB' };
            if (item.descricao) {
              try {
                extra = { ...extra, ...JSON.parse(item.descricao) };
              } catch (e) {}
            }
            return {
              id: item.id,
              titulo: item.titulo,
              tipo: extra.tipo,
              tamanho: extra.tamanho,
              turmaId: item.turmaId,
              turmaNome: item.turmaNome || '',
              urlAcesso: item.urlAcesso,
              dataUpload: item.dataDisponibilizacao ? new Date(item.dataDisponibilizacao).toLocaleDateString('pt-BR') : '',
            };
          });
          setMateriais(formatted);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar materiais:', err);
    }
  };

  useEffect(() => {
    loadProgresso();
    loadMateriais();
  }, [alunoId]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleDownload = async (matId: string, urlAccess: string) => {
    // Abrir a URL imediatamente para evitar bloqueio do navegador
    if (urlAccess) {
      window.open(formatExternalUrl(urlAccess), '_blank');
    }

    if (atividadesConcluidas.includes(matId)) return;

    try {
      const res = await fetch('/api/progresso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alunoId,
          tipoAcao: 'material',
          xpGanho: 5,
          atividadeId: matId,
        }),
      });
      if (res.ok) {
        setToast('+5 XP!');
        loadProgresso();
        window.dispatchEvent(new Event('nota10_progress_updated'));
      }
    } catch (err) {
      console.error('Erro ao registrar XP de material:', err);
    }
  };

  const formatExternalUrl = (url: string) => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  const filtered = materiais.filter((m) => {
    if (search && !m.titulo.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedFilter !== 'todos' && m.tipo !== selectedFilter) return false;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search & Filter Header */}
      <div className="card animate-fade-in-up">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-cinza-texto)]" />
            <input
              type="text"
              placeholder="Buscar materiais por título..."
              className="form-input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select w-full sm:w-auto"
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
          >
            <option value="todos">Todos Tipos</option>
            <option value="apostila">Apostilas</option>
            <option value="cronograma">Cronogramas</option>
            <option value="revisao">Revisão</option>
            <option value="combinados">Regras e Combinados</option>
          </select>
        </div>
      </div>

      {/* Materials List */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((mat, index) => {
            const isCompleted = atividadesConcluidas.includes(mat.id);
            return (
              <div
                key={mat.id}
                className="card animate-fade-in-up flex items-center justify-between gap-4 p-4 hover:shadow-md transition-shadow relative"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-azul-lightest)] flex items-center justify-center flex-shrink-0 text-[var(--color-azul-autoridade)]">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-[var(--color-azul-autoridade)] truncate leading-snug">
                      {mat.titulo}
                    </h4>
                    <p className="text-[10px] text-[var(--color-cinza-texto)] flex items-center gap-2 mt-1 flex-wrap">
                      <span>Tamanho: <strong className="text-[var(--color-cinza-escuro)]">{mat.tamanho}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5"><Calendar size={10} /> {mat.dataUpload}</span>
                      {mat.turmaNome && (
                        <>
                          <span>•</span>
                          <span className="px-1.5 py-0.5 rounded bg-[var(--color-azul-lightest)] text-[var(--color-azul-autoridade)] text-[8px] font-black uppercase tracking-wider">
                            {(() => {
                              const turmas = mat.turmaNome.includes(',') ? mat.turmaNome.split(',').map((t: string) => t.trim()) : [mat.turmaNome];
                              return turmas.find((t: string) => t === turmaNome) || turmas[0];
                            })()}
                          </span>
                        </>
                      )}
                      {isCompleted && (
                        <>
                          <span>•</span>
                          <span className="text-[9px] text-[var(--color-verde-sucesso)] font-extrabold flex items-center gap-0.5">
                            <CheckCircle size={10} /> Baixado
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(mat.id, mat.urlAcesso)}
                    className={`btn flex items-center gap-2 text-xs py-2 px-3 flex-shrink-0 cursor-pointer ${
                      isCompleted ? 'btn-outline border-[var(--color-verde-sucesso)]/30 text-[var(--color-verde-sucesso)]' : 'btn-secondary'
                    }`}
                  >
                    <Download size={14} />
                    <span>{isCompleted ? 'Rebaixar' : 'Baixar'}</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="card text-center py-12 animate-fade-in-up">
            <FileText size={28} className="text-[var(--color-cinza-texto)] mx-auto mb-3" />
            <p className="text-sm text-[var(--color-cinza-texto)]">Nenhum material encontrado com os filtros selecionados.</p>
          </div>
        )}
      </div>

      {/* Toast de XP */}
      {toast && (
        <div 
          className="fixed top-6 right-6 z-[60] text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in-up text-sm font-black border border-[var(--color-amarelo-conquista)]/30"
          style={{ background: 'linear-gradient(135deg, var(--color-amarelo-conquista) 0%, #F59E0B 100%)', color: 'var(--color-azul-autoridade)' }}
        >
          <Zap size={18} fill="currentColor" /> {toast}
        </div>
      )}
    </div>
  );
}
