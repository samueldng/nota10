'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, User, Phone, MapPin, GraduationCap, BarChart3, Clock,
  CheckCircle2, AlertTriangle, FileText, Database, ShieldAlert, Eye
} from 'lucide-react';
import {
  alunos, turmas, registrosLancados,
  acompanhamentoLabels, getTurmasByAcompanhamento
} from '@/lib/mockData';

export default function PaginaAlunoPage() {
  const params = useParams();
  const id = params?.id as string;
  const aluno = alunos.find(a => a.id === id) || alunos[0]; // fallback if not found

  const alunoTurma = turmas.find(t => t.id === aluno.turmaId);
  const alunoRegistros = registrosLancados.filter(r => r.aluno === aluno.nome || r.aluno === 'Turma inteira');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header with Back button */}
      <div className="flex items-center gap-4 animate-fade-in-up">
        <Link href="/cadastros/alunos" className="btn btn-outline p-2 h-auto rounded-full">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-azul-autoridade)] m-0 flex items-center gap-3">
            {aluno.nome}
            <span className={`badge ${aluno.status === 'ativo' ? 'badge-success' : 'badge-error'} text-sm`}>
              {aluno.status === 'ativo' ? 'Ativo' : 'Inativo'}
            </span>
          </h2>
          <p className="text-[var(--color-cinza-texto)] font-mono mt-1">Nº {aluno.numero}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button className="btn btn-outline"><FileText size={16} /> Emitir Ficha</button>
          <Link href="/relatorios" className="btn btn-primary"><BarChart3 size={16} /> Relatório Completo</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Profile & Contact */}
        <div className="space-y-6 animate-fade-in-up delay-1">
          {/* Main Info */}
          <div className="card">
            <h3 className="text-sm font-bold text-[var(--color-azul-autoridade)] mb-4 flex items-center gap-2 border-b border-[var(--color-cinza-borda)] pb-2">
              <GraduationCap size={16} /> Vínculo Acadêmico
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-[var(--color-cinza-texto)]">Acompanhamento</p>
                <p className="font-semibold text-sm">
                  <span className="badge badge-info">{acompanhamentoLabels[aluno.acompanhamento]}</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-cinza-texto)]">Turma</p>
                <p className="font-semibold text-sm">{aluno.turma} <span className="text-xs font-normal text-[var(--color-cinza-texto)]">({alunoTurma?.turno})</span></p>
              </div>
            </div>
          </div>

          {/* Parents */}
          <div className="card">
            <h3 className="text-sm font-bold text-[var(--color-azul-autoridade)] mb-4 flex items-center gap-2 border-b border-[var(--color-cinza-borda)] pb-2">
              <User size={16} /> Responsáveis
            </h3>
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-sm text-[var(--color-azul-autoridade)]">{aluno.responsavel1.nome}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Phone size={12} className="text-[var(--color-cinza-texto)]" />
                  <a href={`https://wa.me/55${aluno.responsavel1.telefone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--color-azul-info)] hover:underline">
                    {aluno.responsavel1.telefone}
                  </a>
                </div>
              </div>
              {aluno.responsavel2.nome && (
                <div>
                  <p className="font-semibold text-sm text-[var(--color-azul-autoridade)]">{aluno.responsavel2.nome}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone size={12} className="text-[var(--color-cinza-texto)]" />
                    <a href={`https://wa.me/55${aluno.responsavel2.telefone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--color-azul-info)] hover:underline">
                      {aluno.responsavel2.telefone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="card">
            <h3 className="text-sm font-bold text-[var(--color-azul-autoridade)] mb-4 flex items-center gap-2 border-b border-[var(--color-cinza-borda)] pb-2">
              <MapPin size={16} /> Endereço
            </h3>
            <div className="text-sm text-[var(--color-cinza-escuro)] leading-relaxed">
              <p>{aluno.endereco.rua}</p>
              <p>{aluno.endereco.bairro}</p>
              <p>{aluno.endereco.cidade}</p>
            </div>
          </div>
        </div>

        {/* Right column: Academic history & Alerts */}
        <div className="lg:col-span-2 space-y-6 animate-fade-in-up delay-2">
          {/* Mini Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[var(--color-verde-light)] p-4 rounded-2xl border border-[var(--color-verde-sucesso)]/20">
              <p className="text-xs font-bold text-[var(--color-verde-sucesso)] mb-1 uppercase">Presença Média</p>
              <p className="text-2xl font-extrabold text-[var(--color-verde-sucesso)] leading-none">94%</p>
            </div>
            <div className="bg-[var(--color-amarelo-alerta-light)] p-4 rounded-2xl border border-[var(--color-amarelo-alerta)]/20">
              <p className="text-xs font-bold text-[var(--color-amarelo-alerta)] mb-1 uppercase">Faltas no mês</p>
              <p className="text-2xl font-extrabold text-[var(--color-amarelo-alerta)] leading-none">2</p>
            </div>
            <div className="bg-[var(--color-roxo-light)] p-4 rounded-2xl border border-[#8B5CF6]/20">
              <p className="text-xs font-bold text-[#8B5CF6] mb-1 uppercase">Atv. Concluídas</p>
              <p className="text-2xl font-extrabold text-[#8B5CF6] leading-none">88%</p>
            </div>
            <div className="bg-[var(--color-azul-lightest)] p-4 rounded-2xl border border-[var(--color-azul-autoridade)]/20">
              <p className="text-xs font-bold text-[var(--color-azul-autoridade)] mb-1 uppercase">Posição Ranking</p>
              <p className="text-2xl font-extrabold text-[var(--color-azul-autoridade)] leading-none">3º</p>
            </div>
          </div>

          {/* Alertas Pedagógicos (Mocking AI Phase 2 logic) */}
          <div className="card">
            <h3 className="text-sm font-bold text-[var(--color-azul-autoridade)] mb-4 flex items-center gap-2">
              <ShieldAlert size={16} /> Alertas Pedagógicos
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-[var(--color-amarelo-alerta-light)] border border-[var(--color-amarelo-alerta)] rounded-xl">
                <AlertTriangle size={18} className="text-[var(--color-amarelo-alerta)] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-[var(--color-cinza-escuro)] m-0">Queda de fixação em Matemática</p>
                  <p className="text-xs text-[var(--color-cinza-texto)] mt-1">Nos últimos 3 encontros, o aluno passou de "Fez" para "Metade" na avaliação de Fixação no Bloco 2.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[var(--color-verde-light)] border border-[var(--color-verde-sucesso)] rounded-xl">
                <CheckCircle2 size={18} className="text-[var(--color-verde-sucesso)] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-[var(--color-cinza-escuro)] m-0">Evolução em Comportamento</p>
                  <p className="text-xs text-[var(--color-cinza-texto)] mt-1">Aluno manteve nota máxima (3) em comportamento nas últimas duas semanas.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline de Registros */}
          <div className="card p-0">
            <div className="p-4 border-b border-[var(--color-cinza-borda)] flex justify-between items-center">
              <h3 className="text-sm font-bold text-[var(--color-azul-autoridade)] flex items-center gap-2 m-0">
                <Database size={16} /> Últimos Lançamentos
              </h3>
              <Link href="/historico" className="text-xs text-[var(--color-azul-info)] font-medium hover:underline">Ver Histórico Completo →</Link>
            </div>
            <div className="p-4">
              <div className="relative border-l-2 border-[var(--color-cinza-borda)] ml-3 space-y-6">
                {alunoRegistros.slice(0, 5).map((r, i) => (
                  <div key={r.id} className="relative pl-6">
                    <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[var(--color-azul-autoridade)] border-[3px] border-white" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-[var(--color-azul-autoridade)]">{r.data}</span>
                        <span className="badge badge-info text-[10px]">{r.disciplina}</span>
                        <span className="text-[10px] text-[var(--color-cinza-texto)] ml-auto flex items-center gap-1"><Clock size={10} /> Por {r.professor}</span>
                      </div>
                      <div className="bg-[var(--color-cinza-fundo)] p-3 rounded-xl border border-[var(--color-cinza-borda)]">
                        <p className="text-xs text-[var(--color-cinza-escuro)] leading-relaxed m-0">
                          <strong>{r.bloco || 'Aula'}</strong> — Aluno presente e atento. Fez metade da videoaula e fixação completa. Participação e comportamento regulares (nível 2).
                        </p>
                        {r.origem === 'foto' && (
                          <div className="mt-2 pt-2 border-t border-[var(--color-cinza-borda)] flex justify-end">
                            <button className="text-[10px] text-[var(--color-azul-info)] flex items-center gap-1 hover:underline">
                              <Eye size={10} /> Ver foto original
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
