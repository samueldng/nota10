'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Loader2, Send, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Comment {
  id: string;
  texto: string;
  created_at: string;
  aluno_nome: string;
  isOptimistic?: boolean;
}

interface VideoCommentsProps {
  conteudoId: string;
}

export default function VideoComments({ conteudoId }: VideoCommentsProps) {
  const { user } = useAuth();
  const alunoId = user?.alunoId || 'a1';

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchComments() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/player/comentarios?conteudoId=${conteudoId}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setComments(Array.isArray(data) ? data : []);
        } else if (isMounted) {
          setError('Não foi possível carregar os comentários.');
        }
      } catch (err) {
        console.error('Erro ao buscar comentários:', err);
        if (isMounted) setError('Erro ao conectar com o servidor.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (conteudoId) {
      fetchComments();
    }

    return () => {
      isMounted = false;
    };
  }, [conteudoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const textoTrimmed = newComment.trim();
    if (!textoTrimmed || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    // Optimistic UI update
    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      texto: textoTrimmed,
      created_at: new Date().toISOString(),
      aluno_nome: user?.alunoNome || 'Você',
      isOptimistic: true,
    };

    setComments((prev) => [optimisticComment, ...prev]);
    setNewComment('');

    try {
      const res = await fetch('/api/player/comentarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alunoId, conteudoId, texto: textoTrimmed }),
      });

      if (res.ok) {
        const savedComment = await res.json();
        setComments((prev) =>
          prev.map((item) => (item.id === optimisticComment.id ? savedComment : item))
        );
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Falha ao salvar comentário');
      }
    } catch (err: any) {
      console.error('Erro ao enviar comentário:', err);
      setError(err.message || 'Erro ao enviar comentário. Tente novamente.');
      // Rollback optimistic comment
      setComments((prev) => prev.filter((item) => item.id !== optimisticComment.id));
      setNewComment(textoTrimmed);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-[var(--color-cinza-borda)] mt-4">
      <h4 className="text-lg font-bold text-[var(--color-azul-autoridade)] flex items-center gap-2 mb-4">
        <MessageSquare size={20} className="text-[var(--color-amarelo-conquista)]" />
        Dúvidas e Comentários
      </h4>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-center gap-2 text-xs font-bold animate-fade-in-up">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Deixe seu comentário ou dúvida sobre esta aula..."
          className="flex-1 input bg-[var(--color-cinza-fundo)] border-[var(--color-cinza-borda)] focus:bg-white focus:border-[var(--color-azul-autoridade)] transition-all text-sm px-4 py-2.5 rounded-xl"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={isSubmitting}
        />
        <button
          type="submit"
          className="btn btn-primary px-5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold shrink-0"
          disabled={!newComment.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <Send size={16} />
              <span>Enviar</span>
            </>
          )}
        </button>
      </form>

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-[var(--color-cinza-texto)]">
          <Loader2 size={24} className="animate-spin mr-2" />
          <span className="text-xs font-bold">Carregando comentários...</span>
        </div>
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {comments.map((c) => (
            <div
              key={c.id}
              className={`p-3.5 rounded-xl border transition-all ${
                c.isOptimistic
                  ? 'bg-amber-50/50 border-amber-200 opacity-70 animate-pulse'
                  : 'bg-[var(--color-cinza-fundo)] border-[var(--color-cinza-borda)]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black text-[var(--color-azul-autoridade)]">
                  {c.aluno_nome}
                </span>
                <span className="text-[10px] text-[var(--color-cinza-texto)] font-medium">
                  {c.isOptimistic
                    ? 'Enviando...'
                    : new Date(c.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                </span>
              </div>
              <p className="text-sm text-[var(--color-cinza-escuro)] leading-relaxed break-words">
                {c.texto}
              </p>
            </div>
          ))}
          {comments.length === 0 && !isLoading && (
            <div className="text-center py-8 border border-dashed border-[var(--color-cinza-borda)] rounded-xl bg-[var(--color-cinza-fundo)]/50">
              <MessageSquare size={28} className="mx-auto text-[var(--color-cinza-texto)] mb-2 opacity-50" />
              <p className="text-xs font-bold text-[var(--color-cinza-texto)]">
                Nenhum comentário ainda. Seja o primeiro a participar!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
