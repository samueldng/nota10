'use client';

import { useAuth } from '@/context/AuthContext';
import { getMateriais } from '@/lib/portalData';
import type { MaterialDownload } from '@/lib/mockData';
import { Download, FileText, Calendar, Search } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function MateriaisPage() {
  const { user } = useAuth();
  const turmaId = user?.turmaId;
  const [materiais, setMateriais] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('todos');

  useEffect(() => {
    if (!turmaId) return;

    fetch(`/api/conteudos?turmaId=${turmaId}&tipoConteudo=pdf`)
      .then((res) => res.json())
      .then((data) => {
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
              dataUpload: item.dataDisponibilizacao ? new Date(item.dataDisponibilizacao).toLocaleDateString('pt-BR') : '',
            };
          });
          setMateriais(formatted);
        }
      })
      .catch((err) => console.error('Erro ao carregar materiais:', err));
  }, [turmaId]);

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
          filtered.map((mat, index) => (
            <div
              key={mat.id}
              className="card animate-fade-in-up flex items-center justify-between gap-4 p-4 hover:shadow-md transition-shadow"
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
                  <p className="text-[10px] text-[var(--color-cinza-texto)] flex items-center gap-2 mt-1">
                    <span>Tamanho: <strong className="text-[var(--color-cinza-escuro)]">{mat.tamanho}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5"><Calendar size={10} /> {mat.dataUpload}</span>
                  </p>
                </div>
              </div>

              <button className="btn btn-secondary flex items-center gap-2 text-xs py-2 px-3 flex-shrink-0">
                <Download size={14} />
                <span>Baixar</span>
              </button>
            </div>
          ))
        ) : (
          <div className="card text-center py-12 animate-fade-in-up">
            <FileText size={28} className="text-[var(--color-cinza-texto)] mx-auto mb-3" />
            <p className="text-sm text-[var(--color-cinza-texto)]">Nenhum material encontrado com os filtros selecionados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
