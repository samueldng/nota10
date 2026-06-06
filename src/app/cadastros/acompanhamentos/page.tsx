'use client';

import { useState } from 'react';
import { Settings, Eye, Edit3, BookOpen, Clock, AlertTriangle } from 'lucide-react';
import { acompanhamentoLabels, type Acompanhamento } from '@/lib/mockData';

export default function AcompanhamentosPage() {
  const [selectedAcomp, setSelectedAcomp] = useState<Acompanhamento | null>(null);

  const acompanhamentosList: { id: Acompanhamento; nome: string; icon: string; bg: string; color: string; desc: string; freq: string }[] = [
    { id: 'pre_cmt_5', nome: 'Pré-CMT 5º Ano', icon: '5º', bg: 'var(--color-azul-lightest)', color: 'var(--color-azul-autoridade)', desc: 'Preparatório para Colégios Militares e Técnicos. Foco em provas de alto nível.', freq: 'Até 3x por semana' },
    { id: 'projeto_4', nome: 'Projeto 4º Ano', icon: '4º', bg: 'var(--color-amarelo-light)', color: 'var(--color-amarelo-conquista)', desc: 'Fortalecimento da base matemática e linguística visando o preparatório futuro.', freq: 'Até 3x por semana' },
    { id: 'reforco', nome: 'Reforço', icon: '🔄', bg: 'var(--color-verde-light)', color: 'var(--color-verde-sucesso)', desc: 'Acompanhamento individualizado semanal (seg a qui) para dificuldades específicas.', freq: 'Seg a Qui' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="animate-fade-in-up">
        <p className="text-[var(--color-cinza-texto)]">
          Visualize e configure os parâmetros de cada modelo de acompanhamento pedagógico.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: List */}
        <div className="space-y-4 animate-fade-in-up delay-1">
          {acompanhamentosList.map(a => (
            <button
              key={a.id}
              onClick={() => setSelectedAcomp(a.id)}
              className={`w-full text-left card transition-all ${selectedAcomp === a.id ? 'border-2' : 'border-2 border-transparent hover:border-[var(--color-cinza-borda)]'}`}
              style={{ borderColor: selectedAcomp === a.id ? a.color : '' }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-xl flex-shrink-0" style={{ background: a.bg, color: a.color }}>
                  {a.icon}
                </div>
                <div>
                  <h3 className="font-bold text-[var(--color-azul-autoridade)] m-0">{a.nome}</h3>
                  <p className="text-[10px] text-[var(--color-cinza-texto)] mt-1 flex items-center gap-1"><Clock size={10} /> {a.freq}</p>
                </div>
              </div>
            </button>
          ))}

          <div className="bg-[var(--color-amarelo-alerta-light)] border border-[var(--color-amarelo-alerta)] rounded-xl p-4 flex items-start gap-3 mt-6">
            <AlertTriangle size={16} className="text-[var(--color-amarelo-alerta)] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-[var(--color-cinza-escuro)] m-0">Atenção (MVP)</p>
              <p className="text-[10px] text-[var(--color-cinza-texto)] mt-1">A criação de novos acompanhamentos dinâmicos não está disponível no MVP. Os 3 modelos atuais foram construídos sob medida.</p>
            </div>
          </div>
        </div>

        {/* Right column: Config Details */}
        <div className="lg:col-span-2 animate-fade-in-up delay-2">
          {selectedAcomp ? (
            <div className="card">
              <div className="flex items-center justify-between border-b border-[var(--color-cinza-borda)] pb-4 mb-4">
                <h2 className="text-lg font-bold text-[var(--color-azul-autoridade)] flex items-center gap-2">
                  <Settings size={20} />
                  Configurações: {acompanhamentoLabels[selectedAcomp]}
                </h2>
                <div className="flex gap-2">
                  <button className="btn btn-outline text-xs"><Eye size={14} /> Ver folha padrão</button>
                  <button className="btn btn-outline text-xs" disabled><Edit3 size={14} /> Editar campos</button>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold text-[var(--color-cinza-escuro)] uppercase mb-2">Descrição</p>
                  <p className="text-sm text-[var(--color-cinza-texto)]">{acompanhamentosList.find(x => x.id === selectedAcomp)?.desc}</p>
                </div>

                <div>
                  <p className="text-xs font-bold text-[var(--color-cinza-escuro)] uppercase mb-3 flex items-center gap-2">
                    <BookOpen size={14} /> Campos coletados na folha
                  </p>
                  <div className="bg-[var(--color-cinza-fundo)] rounded-xl border border-[var(--color-cinza-borda)] p-1">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-[var(--color-cinza-borda)]">
                          <th className="p-2 font-bold text-[var(--color-azul-autoridade)]">Campo</th>
                          <th className="p-2 font-bold text-[var(--color-azul-autoridade)]">Tipo de dado</th>
                          <th className="p-2 font-bold text-[var(--color-azul-autoridade)]">Opções</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAcomp !== 'reforco' ? (
                          <>
                            <tr className="border-b border-[var(--color-cinza-borda)]">
                              <td className="p-2 font-medium">Presença</td><td className="p-2">Múltipla escolha</td><td className="p-2 text-[var(--color-cinza-texto)]">Faltou, Atrasado, Presente</td>
                            </tr>
                            {selectedAcomp === 'pre_cmt_5' && (
                              <>
                                <tr className="border-b border-[var(--color-cinza-borda)]">
                                  <td className="p-2 font-medium">Videoaula</td><td className="p-2">Qualitativo</td><td className="p-2 text-[var(--color-cinza-texto)]">Não Fez, Metade, Fez</td>
                                </tr>
                                <tr className="border-b border-[var(--color-cinza-borda)]">
                                  <td className="p-2 font-medium">Palavra-chave</td><td className="p-2">Qualitativo</td><td className="p-2 text-[var(--color-cinza-texto)]">Não Fez, Metade, Fez</td>
                                </tr>
                              </>
                            )}
                            <tr className="border-b border-[var(--color-cinza-borda)]">
                              <td className="p-2 font-medium">Fixação</td><td className="p-2">Qualitativo</td><td className="p-2 text-[var(--color-cinza-texto)]">Não Fez, Metade, Fez</td>
                            </tr>
                            <tr className="border-b border-[var(--color-cinza-borda)]">
                              <td className="p-2 font-medium">Praticar</td><td className="p-2">Qualitativo</td><td className="p-2 text-[var(--color-cinza-texto)]">Não Fez, Metade, Fez</td>
                            </tr>
                            <tr className="border-b border-[var(--color-cinza-borda)]">
                              <td className="p-2 font-medium">Atenção</td><td className="p-2">Qualitativo</td><td className="p-2 text-[var(--color-cinza-texto)]">Desinteressado, Distraído, Atento</td>
                            </tr>
                            <tr className="border-b border-[var(--color-cinza-borda)]">
                              <td className="p-2 font-medium">Participação</td><td className="p-2">Escala 1-3</td><td className="p-2 text-[var(--color-cinza-texto)]">1, 2, 3</td>
                            </tr>
                            <tr className="border-b border-[var(--color-cinza-borda)]">
                              <td className="p-2 font-medium">Comportamento</td><td className="p-2">Escala 1-3</td><td className="p-2 text-[var(--color-cinza-texto)]">1, 2, 3</td>
                            </tr>
                            <tr className="border-b border-[var(--color-cinza-borda)]">
                              <td className="p-2 font-medium">Nota</td><td className="p-2">Texto livre</td><td className="p-2 text-[var(--color-cinza-texto)]">Vazio (Preenchimento manual)</td>
                            </tr>
                            <tr className="border-b border-[var(--color-cinza-borda)]">
                              <td className="p-2 font-medium">Observação</td><td className="p-2">Texto livre</td><td className="p-2 text-[var(--color-cinza-texto)]">Vazio</td>
                            </tr>
                            <tr>
                              <td className="p-2 font-medium">Pontualidade</td><td className="p-2">Booleano</td><td className="p-2 text-[var(--color-cinza-texto)]">Atrasado, Pontual</td>
                            </tr>
                          </>
                        ) : (
                          // Reforço fields
                          <>
                            <tr><td colSpan={3} className="p-2 bg-gray-200 font-bold text-[10px] text-center">DADOS DO DIA</td></tr>
                            <tr className="border-b border-[var(--color-cinza-borda)]">
                              <td className="p-2 font-medium">Frequência</td><td className="p-2">Múltipla escolha</td><td className="p-2 text-[var(--color-cinza-texto)]">Faltou, Atrasado, Presente</td>
                            </tr>
                            <tr className="border-b border-[var(--color-cinza-borda)]">
                              <td className="p-2 font-medium">Comportamento</td><td className="p-2">Qualitativo</td><td className="p-2 text-[var(--color-cinza-texto)]">Excelente, Bom, Agitado, Desatento</td>
                            </tr>
                            <tr><td colSpan={3} className="p-2 bg-gray-200 font-bold text-[10px] text-center">ATIVIDADES DO ALUNO</td></tr>
                            <tr className="border-b border-[var(--color-cinza-borda)]">
                              <td className="p-2 font-medium">Origem</td><td className="p-2">Múltipla escolha</td><td className="p-2 text-[var(--color-cinza-texto)]">Caderno, Livro, Paradidático, Atv. Reforço</td>
                            </tr>
                            <tr className="border-b border-[var(--color-cinza-borda)]">
                              <td className="p-2 font-medium">Compreensão</td><td className="p-2">Qualitativo</td><td className="p-2 text-[var(--color-cinza-texto)]">Dominou, Revisão, Reforço Profundo</td>
                            </tr>
                            <tr className="border-b border-[var(--color-cinza-borda)]">
                              <td className="p-2 font-medium">Autonomia</td><td className="p-2">Qualitativo</td><td className="p-2 text-[var(--color-cinza-texto)]">Sozinho, Ajuda, Dependente</td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[300px] border-2 border-dashed border-[var(--color-cinza-borda)] rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-[var(--color-cinza-fundo)]">
              <Settings size={32} className="text-[var(--color-cinza-texto)] mb-3" />
              <h3 className="font-bold text-[var(--color-azul-autoridade)] mb-1">Selecione um Acompanhamento</h3>
              <p className="text-sm text-[var(--color-cinza-texto)] max-w-sm">
                Clique em um dos itens na lista ao lado para visualizar os campos e configurações do modelo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
