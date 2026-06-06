'use client';

import { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  QrCode,
  Star,
  Calendar,
  BookOpen,
  Users,
  User,
  Eye,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  turmas,
  alunos,
  professores,
  disciplinas,
  blocos,
  folhasGeradas,
  acompanhamentoLabels,
  getTurmasByAcompanhamento,
  type Acompanhamento,
} from '@/lib/mockData';

export default function FolhasAcompanhamentoPage() {
  const [acomp, setAcomp] = useState<Acompanhamento>('pre_cmt_5');
  const [turma, setTurma] = useState('T001');
  const [alunoId, setAlunoId] = useState('');
  const [data, setData] = useState('2026-06-06');
  const [disciplina, setDisciplina] = useState('Português');
  const [bloco, setBloco] = useState('');
  const [professor, setProfessor] = useState('p1');
  const [showPreview, setShowPreview] = useState(true);
  const [showHistorico, setShowHistorico] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  const isReforco = acomp === 'reforco';
  const turmasFiltradas = getTurmasByAcompanhamento(acomp);
  const alunosReforco = alunos.filter(a => a.acompanhamento === 'reforco');
  const profName = professores.find(p => p.id === professor)?.nome || '';

  const handleGerar = () => {
    // Simulate duplicate check
    const exists = folhasGeradas.some(f =>
      f.acompanhamento === acomp &&
      f.turma === turmasFiltradas.find(t => t.id === turma)?.nome &&
      f.data === data.split('-').reverse().join('/')
    );
    setDuplicateWarning(exists);
    setShowPreview(true);
  };

  // Columns for Pré-CMT 5º (more fields than Projeto 4º)
  const colunasPreCMT5 = ['Nº', 'Aluno', 'Presença', 'Vídeo', 'P.Chave', 'Fixação', 'Praticar', 'Nota', 'Atenção', 'Partic.', 'Comport.', 'Conteúdo/Obs.', 'Pontualid.'];
  const colunasProjeto4 = ['Nº', 'Aluno', 'Presença', 'Fixação', 'Praticar', 'Atenção', 'Partic.', 'Comport.', 'Nota', 'Conteúdo/Obs.', 'Pontualid.'];

  const colunas = acomp === 'pre_cmt_5' ? colunasPreCMT5 : colunasProjeto4;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-up">
        <p className="text-[var(--color-cinza-texto)]">
          Gere folhas padronizadas para impressão com QR Code e marcas de alinhamento automático.
        </p>
        <button className="btn btn-secondary" onClick={handleGerar}>
          <Calendar size={16} /> Gerar folha de hoje
        </button>
      </div>

      {/* Filter Card */}
      <div className="card animate-fade-in-up delay-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="form-group">
            <label className="form-label">Acompanhamento</label>
            <select className="form-select" value={acomp} onChange={(e) => setAcomp(e.target.value as Acompanhamento)}>
              <option value="pre_cmt_5">Pré-CMT 5º Ano</option>
              <option value="projeto_4">Projeto 4º Ano</option>
              <option value="reforco">Reforço</option>
            </select>
          </div>

          {!isReforco ? (
            <div className="form-group">
              <label className="form-label">Turma</label>
              <select className="form-select" value={turma} onChange={(e) => setTurma(e.target.value)}>
                {turmasFiltradas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Aluno</label>
              <select className="form-select" value={alunoId} onChange={(e) => setAlunoId(e.target.value)}>
                <option value="">Selecione...</option>
                {alunosReforco.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Data</label>
            <input type="date" className="form-input" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Disciplina</label>
            <select className="form-select" value={disciplina} onChange={(e) => setDisciplina(e.target.value)}>
              {(isReforco ? ['Multidisciplinar'] : disciplinas).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {!isReforco && (
            <div className="form-group">
              <label className="form-label">Bloco (opcional)</label>
              <select className="form-select" value={bloco} onChange={(e) => setBloco(e.target.value)}>
                <option value="">— Selecionar —</option>
                {blocos.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Professor</label>
            <select className="form-select" value={professor} onChange={(e) => setProfessor(e.target.value)}>
              {professores.filter(p => p.status === 'ativo').map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3">
          <button className="btn btn-outline text-sm" onClick={() => setShowHistorico(!showHistorico)}>
            <Clock size={14} /> {showHistorico ? 'Ocultar' : 'Ver'} histórico de folhas
          </button>
          <button className="btn btn-primary" onClick={handleGerar}>
            <FileText size={16} /> Gerar Folha
          </button>
        </div>
      </div>

      {/* Duplicate warning */}
      {duplicateWarning && (
        <div className="bg-[var(--color-amarelo-alerta-light)] border border-[var(--color-amarelo-alerta)] rounded-xl p-4 flex items-center gap-3 animate-fade-in-up">
          <AlertTriangle size={20} className="text-[var(--color-amarelo-alerta)] flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-[var(--color-cinza-escuro)]">Atenção: Folha duplicada</p>
            <p className="text-xs text-[var(--color-cinza-texto)]">Já existe uma folha gerada para esta turma, disciplina e data. Deseja gerar mesmo assim?</p>
          </div>
        </div>
      )}

      {/* Histórico de folhas */}
      {showHistorico && (
        <div className="card animate-fade-in-up">
          <h3 className="text-base font-bold text-[var(--color-azul-autoridade)] mb-4 flex items-center gap-2">
            <Clock size={18} /> Histórico de folhas geradas
          </h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Acompanhamento</th>
                  <th>Turma/Aluno</th>
                  <th>Data</th>
                  <th>Disciplina</th>
                  <th>Gerada em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {folhasGeradas.map((f) => (
                  <tr key={f.id}>
                    <td className="font-mono text-sm font-bold text-[var(--color-azul-autoridade)]">{f.id}</td>
                    <td><span className="badge badge-info text-xs">{acompanhamentoLabels[f.acompanhamento]}</span></td>
                    <td className="font-medium text-sm">{f.aluno || f.turma}</td>
                    <td className="text-sm">{f.data}</td>
                    <td className="text-sm">{f.disciplina}</td>
                    <td className="text-xs text-[var(--color-cinza-texto)]">{f.dataGeracao}</td>
                    <td>
                      <div className="flex gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-[var(--color-azul-lightest)]" title="Visualizar"><Eye size={14} className="text-[var(--color-azul-autoridade)]" /></button>
                        <button className="p-1.5 rounded-lg hover:bg-[var(--color-cinza-fundo)]" title="Baixar"><Download size={14} className="text-[var(--color-cinza-texto)]" /></button>
                        <button className="p-1.5 rounded-lg hover:bg-[var(--color-cinza-fundo)]" title="Imprimir"><Printer size={14} className="text-[var(--color-cinza-texto)]" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview — Collective Sheet (Pré-CMT / Projeto) */}
      {showPreview && !isReforco && (
        <div className="card animate-fade-in-up delay-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[var(--color-azul-autoridade)]">Prévia da Folha</h3>
            <div className="flex gap-2">
              <button className="btn btn-outline"><Eye size={16} /> Visualizar</button>
              <button className="btn btn-outline"><Download size={16} /> Baixar PDF</button>
              <button className="btn btn-primary"><Printer size={16} /> Imprimir</button>
            </div>
          </div>

          <div className="border-2 border-[var(--color-azul-autoridade)] rounded-lg overflow-hidden bg-white">
            {/* Header */}
            <div className="bg-[var(--color-azul-autoridade)] text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-white flex-shrink-0" />
                  <div className="flex items-center gap-2">
                    <Star size={20} className="text-[var(--color-amarelo-conquista)]" fill="currentColor" />
                    <div>
                      <span className="font-extrabold text-lg">NOTA 10</span>
                      <span className="text-xs block text-white/80">EDUCACIONAL</span>
                    </div>
                  </div>
                </div>
                <div className="text-center flex-1">
                  <h2 className="text-lg font-extrabold tracking-wide m-0">
                    {acomp === 'pre_cmt_5' ? 'PRÉ-CMT 5º ANO' : 'PROJETO 4º ANO'}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-white rounded-lg flex flex-col items-center justify-center p-1">
                    <QrCode size={32} className="text-[var(--color-azul-autoridade)]" />
                    <span className="text-[6px] text-[var(--color-azul-autoridade)] font-bold mt-0.5">QR Code</span>
                  </div>
                  <div className="w-4 h-4 border-2 border-white flex-shrink-0" />
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="p-4 border-b border-[var(--color-cinza-borda)]">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-[var(--color-azul-autoridade)]" />
                  <span className="font-semibold text-[var(--color-azul-autoridade)]">DATA:</span>
                  <span>{data.split('-').reverse().join('/')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-[var(--color-azul-autoridade)]" />
                  <span className="font-semibold text-[var(--color-azul-autoridade)]">TURMA:</span>
                  <span>{turmasFiltradas.find(t => t.id === turma)?.nome}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen size={14} className="text-[var(--color-azul-autoridade)]" />
                  <span className="font-semibold text-[var(--color-azul-autoridade)]">DISCIPLINA:</span>
                  <span className="flex items-center gap-2">
                    <span className="flex items-center gap-1"><span className={`w-3 h-3 border rounded-sm ${disciplina === 'Português' ? 'bg-[var(--color-azul-autoridade)]' : 'border-gray-400'}`} /> Português</span>
                    <span className="flex items-center gap-1"><span className={`w-3 h-3 border rounded-sm ${disciplina === 'Matemática' ? 'bg-[var(--color-azul-autoridade)]' : 'border-gray-400'}`} /> Matemática</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-[var(--color-azul-autoridade)]" />
                  <span className="font-semibold text-[var(--color-azul-autoridade)]">BLOCO:</span>
                  <span>{bloco || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User size={14} className="text-[var(--color-azul-autoridade)]" />
                  <span className="font-semibold text-[var(--color-azul-autoridade)]">PROFESSOR:</span>
                  <span>{profName}</span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--color-azul-lightest)]">
                    {colunas.map(col => (
                      <th key={col} className="px-2 py-2 font-bold text-center border border-[var(--color-cinza-borda)] text-[var(--color-azul-autoridade)] text-[10px]">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 16 }).map((_, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[var(--color-cinza-fundo)]'}>
                      <td className="px-2 py-2 text-center border border-[var(--color-cinza-borda)] font-bold">{i + 1}</td>
                      <td className="px-2 py-2 border border-[var(--color-cinza-borda)] w-28">
                        <div className="h-4 border-b border-dotted border-gray-300" />
                      </td>
                      {/* Presença: Faltou/Atrasado/Presente */}
                      <td className="px-1 py-1 text-center border border-[var(--color-cinza-borda)]">
                        <div className="flex flex-col gap-0.5 text-[7px] text-gray-500">
                          {['Faltou', 'Atrasado', 'Presente'].map(p => (
                            <span key={p} className="flex items-center gap-0.5">
                              <span className="w-2.5 h-2.5 border border-gray-400 rounded-sm inline-block" />{p}
                            </span>
                          ))}
                        </div>
                      </td>
                      {/* Remaining columns as checkboxes */}
                      {colunas.slice(3, -2).map((col, j) => (
                        <td key={j} className="px-1 py-1 text-center border border-[var(--color-cinza-borda)]">
                          {col === 'Atenção' ? (
                            <div className="flex flex-col gap-0.5 text-[6px] text-gray-500">
                              {['Desinteressado', 'Distraído', 'Atento'].map(a => (
                                <span key={a} className="flex items-center gap-0.5">
                                  <span className="w-2 h-2 border border-gray-400 rounded-sm inline-block" />{a}
                                </span>
                              ))}
                            </div>
                          ) : col === 'Partic.' || col === 'Comport.' ? (
                            <div className="flex justify-center gap-1">
                              {[1, 2, 3].map(n => (
                                <div key={n} className="flex flex-col items-center">
                                  <span className="w-2.5 h-2.5 border border-gray-400 rounded-sm" />
                                  <span className="text-[6px] text-gray-400">{n}</span>
                                </div>
                              ))}
                            </div>
                          ) : col === 'Nota' ? (
                            <div className="h-4 border-b border-dotted border-gray-300 w-8 mx-auto" />
                          ) : (
                            <div className="flex flex-col gap-0.5 text-[6px] text-gray-500">
                              {['Não Fez', 'Metade', 'Fez'].map(v => (
                                <span key={v} className="flex items-center gap-0.5">
                                  <span className="w-2 h-2 border border-gray-400 rounded-sm inline-block" />{v}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      ))}
                      {/* Observação */}
                      <td className="px-2 py-2 border border-[var(--color-cinza-borda)] w-20">
                        <div className="h-4 border-b border-dotted border-gray-300" />
                      </td>
                      {/* Pontualidade */}
                      <td className="px-1 py-1 text-center border border-[var(--color-cinza-borda)]">
                        <div className="flex flex-col gap-0.5 text-[7px] text-gray-500">
                          {['Atrasado', 'Pontual'].map(p => (
                            <span key={p} className="flex items-center gap-0.5">
                              <span className="w-2.5 h-2.5 border border-gray-400 rounded-sm inline-block" />{p}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-3 border-t-2 border-[var(--color-azul-autoridade)]">
              <div className="text-center">
                <p className="text-xs text-[var(--color-amarelo-conquista)] font-bold flex items-center justify-center gap-1">
                  <Star size={10} fill="currentColor" />
                  ENSINAR É TRANSFORMAR. ACOMPANHAR É FAZER ACONTECER.
                  <Star size={10} fill="currentColor" />
                </p>
              </div>
              <div className="flex justify-between mt-2">
                <div className="w-4 h-4 border-2 border-[var(--color-azul-autoridade)]" />
                <div className="w-4 h-4 border-2 border-[var(--color-azul-autoridade)]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview — Reforço (Individual weekly) */}
      {showPreview && isReforco && (
        <div className="card animate-fade-in-up delay-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[var(--color-azul-autoridade)]">Prévia — Folha Semanal de Reforço</h3>
            <div className="flex gap-2">
              <button className="btn btn-outline"><Download size={16} /> Baixar PDF</button>
              <button className="btn btn-primary"><Printer size={16} /> Imprimir</button>
            </div>
          </div>
          <div className="border-2 border-gray-800 rounded-lg overflow-hidden bg-white">
            {/* Header */}
            <div className="bg-gray-800 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-white flex-shrink-0" />
                  <div>
                    <h2 className="text-lg font-extrabold m-0">REFORÇO ESCOLAR — FOLHA SEMANAL</h2>
                    <p className="text-xs text-white/70 m-0">Segunda a Quinta — 14h às 17h</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right text-xs">
                    <p className="m-0"><strong>SEMANA:</strong> __/__ a __/__</p>
                    <p className="m-0"><strong>PERÍODO:</strong> __/__</p>
                  </div>
                  <div className="w-4 h-4 border-2 border-white flex-shrink-0" />
                </div>
              </div>
            </div>

            {/* Aluno/Professor */}
            <div className="p-4 border-b border-gray-300 grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User size={14} /> <strong>ALUNO:</strong> <span className="border-b border-dotted border-gray-400 flex-1" />
              </div>
              <div className="flex items-center gap-2">
                <User size={14} /> <strong>PROFESSOR:</strong> <span className="border-b border-dotted border-gray-400 flex-1" />
              </div>
            </div>

            {/* Dados do Dia */}
            <div className="p-4">
              <h4 className="text-xs font-bold text-gray-700 bg-gray-200 px-2 py-1 rounded mb-2 flex items-center gap-1">
                <span className="bg-gray-800 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">1</span>
                DADOS DO DIA
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 py-1 w-32" />
                      <th className="border border-gray-300 px-2 py-1 font-bold">SEGUNDA</th>
                      <th className="border border-gray-300 px-2 py-1 font-bold">TERÇA</th>
                      <th className="border border-gray-300 px-2 py-1 font-bold">QUARTA</th>
                      <th className="border border-gray-300 px-2 py-1 font-bold">QUINTA</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-bold text-gray-700">FREQUÊNCIA</td>
                      {[1, 2, 3, 4].map(d => (
                        <td key={d} className="border border-gray-300 px-2 py-1">
                          <div className="flex gap-2 text-[7px] text-gray-500">
                            {['Faltou', 'Atrasado', 'Presente'].map(f => (
                              <span key={f} className="flex items-center gap-0.5"><span className="w-2 h-2 border border-gray-400 rounded-sm" />{f}</span>
                            ))}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-bold text-gray-700">COMPORTAMENTO</td>
                      {[1, 2, 3, 4].map(d => (
                        <td key={d} className="border border-gray-300 px-2 py-1">
                          <div className="flex gap-1 text-[6px] text-gray-500 flex-wrap">
                            {['Excelente', 'Bom', 'Agitado', 'Desatento'].map(c => (
                              <span key={c} className="flex items-center gap-0.5"><span className="w-2 h-2 border border-gray-400 rounded-sm" />{c}</span>
                            ))}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-bold text-gray-700">PONTUALIDADE PAIS</td>
                      {[1, 2, 3, 4].map(d => (
                        <td key={d} className="border border-gray-300 px-2 py-1">
                          <div className="flex gap-2 text-[7px] text-gray-500">
                            {['Atrasado', 'Pontual'].map(p => (
                              <span key={p} className="flex items-center gap-0.5"><span className="w-2 h-2 border border-gray-400 rounded-sm" />{p}</span>
                            ))}
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Atividades */}
            <div className="px-4 pb-4">
              <h4 className="text-xs font-bold text-center text-gray-700 bg-gray-200 px-2 py-1 rounded mb-2">
                ATIVIDADES DO ALUNO
              </h4>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-1 py-1 w-6">Nº</th>
                    <th className="border border-gray-300 px-1 py-1">Origem</th>
                    <th className="border border-gray-300 px-1 py-1">Disciplina</th>
                    <th className="border border-gray-300 px-1 py-1">Conteúdo/Assunto</th>
                    <th className="border border-gray-300 px-1 py-1">Páginas</th>
                    <th className="border border-gray-300 px-1 py-1">Compreensão</th>
                    <th className="border border-gray-300 px-1 py-1">Autonomia</th>
                    <th className="border border-gray-300 px-1 py-1">Obs.</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td className="border border-gray-300 px-1 py-2 text-center font-bold">{i + 1}</td>
                      <td className="border border-gray-300 px-1 py-1">
                        <div className="flex flex-col gap-0 text-[6px] text-gray-500">
                          {['Caderno', 'Livro escola', 'Paradidático', 'Atv. Reforço'].map(o => (
                            <span key={o} className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 border border-gray-400 rounded-sm" />{o}</span>
                          ))}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-1 py-2"><div className="h-3 border-b border-dotted border-gray-300" /></td>
                      <td className="border border-gray-300 px-1 py-2"><div className="h-3 border-b border-dotted border-gray-300" /></td>
                      <td className="border border-gray-300 px-1 py-2"><div className="h-3 border-b border-dotted border-gray-300 w-8" /></td>
                      <td className="border border-gray-300 px-1 py-1">
                        <div className="flex flex-col gap-0 text-[6px] text-gray-500">
                          {['Dominou', 'Revisão Básica', 'Reforço Profundo'].map(c => (
                            <span key={c} className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 border border-gray-400 rounded-sm" />{c}</span>
                          ))}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-1 py-1">
                        <div className="flex flex-col gap-0 text-[6px] text-gray-500">
                          {['Sozinho', 'Ajuda', 'Dependente'].map(a => (
                            <span key={a} className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 border border-gray-400 rounded-sm" />{a}</span>
                          ))}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-1 py-2"><div className="h-3 border-b border-dotted border-gray-300" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Leitura */}
            <div className="px-4 pb-4">
              <h4 className="text-xs font-bold text-center text-gray-700 bg-gray-200 px-2 py-1 rounded mb-2">
                LEITURA | Livros Lidos e Em Leitura
              </h4>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-1 py-1 w-6">Nº</th>
                    <th className="border border-gray-300 px-1 py-1">Título do Livro</th>
                    <th className="border border-gray-300 px-1 py-1">Data Início</th>
                    <th className="border border-gray-300 px-1 py-1">Data Fim</th>
                    <th className="border border-gray-300 px-1 py-1">Status</th>
                    <th className="border border-gray-300 px-1 py-1">Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2].map(n => (
                    <tr key={n}>
                      <td className="border border-gray-300 px-1 py-2 text-center font-bold">{n}</td>
                      <td className="border border-gray-300 px-1 py-2"><div className="h-3 border-b border-dotted border-gray-300" /></td>
                      <td className="border border-gray-300 px-1 py-2 text-center text-[8px] text-gray-400">__/__/2026</td>
                      <td className="border border-gray-300 px-1 py-2 text-center text-[8px] text-gray-400">__/__/2026</td>
                      <td className="border border-gray-300 px-1 py-1">
                        <div className="flex gap-1 text-[7px] text-gray-500">
                          {['Lendo', 'Concluído', 'Abandonou'].map(s => (
                            <span key={s} className="flex items-center gap-0.5"><span className="w-2 h-2 border border-gray-400 rounded-sm" />{s}</span>
                          ))}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-1 py-2"><div className="h-3 border-b border-dotted border-gray-300" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-3 border-t-2 border-gray-800">
              <div className="flex justify-between">
                <div className="w-4 h-4 border-2 border-gray-800" />
                <div className="w-16 h-16 border border-gray-300 rounded flex items-center justify-center">
                  <QrCode size={28} className="text-gray-500" />
                </div>
                <div className="w-4 h-4 border-2 border-gray-800" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
