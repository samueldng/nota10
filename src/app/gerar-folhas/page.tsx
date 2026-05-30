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
} from 'lucide-react';

type Produto = 'pre_cmt' | 'projeto_4' | 'reforco';

const turmas = [
  { id: '1', nome: '5A Manhã', produto: 'pre_cmt' },
  { id: '2', nome: '5B Tarde', produto: 'pre_cmt' },
  { id: '3', nome: '4A Manhã', produto: 'projeto_4' },
  { id: '4', nome: '4B Tarde', produto: 'projeto_4' },
];

const alunos = [
  { id: '1', nome: 'Ana Clara Silva' },
  { id: '2', nome: 'Bruno Santos Lima' },
  { id: '3', nome: 'Carla Beatriz Rocha' },
  { id: '4', nome: 'Davi Fernandes Costa' },
];

const disciplinas = ['Português', 'Matemática'];
const blocos = ['Bloco 1', 'Bloco 2', 'Bloco 3', 'Bloco 4'];
const professores = ['João Silva', 'Maria Lucia', 'Ana Paula', 'Carlos Roberto'];

const colunas = ['Nº', 'Aluno', 'P/A/F', 'Vídeo', 'P. Chave', 'Fixação', 'Atenção', 'Partic.', 'Comport.', 'Busca Resp.', 'Obs.'];

export default function GerarFolhasPage() {
  const [produto, setProduto] = useState<Produto>('pre_cmt');
  const [turma, setTurma] = useState('1');
  const [data, setData] = useState('2026-05-30');
  const [disciplina, setDisciplina] = useState('Português');
  const [bloco, setBloco] = useState('');
  const [professor, setProfessor] = useState('João Silva');
  const [showPreview, setShowPreview] = useState(true);

  const isReforco = produto === 'reforco';
  const turmasFiltradas = turmas.filter((t) => t.produto === produto);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <p className="text-[var(--color-cinza-texto)]">
          Gere folhas padronizadas para impressão com QR Code e marcas de alinhamento automático.
        </p>
      </div>

      {/* Filter Card */}
      <div className="card animate-fade-in-up delay-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="form-group">
            <label className="form-label">Produto</label>
            <select
              className="form-select"
              value={produto}
              onChange={(e) => setProduto(e.target.value as Produto)}
            >
              <option value="pre_cmt">Pré-CMT 5°</option>
              <option value="projeto_4">Projeto 4° Ano</option>
              <option value="reforco">Reforço</option>
            </select>
          </div>

          {!isReforco ? (
            <div className="form-group">
              <label className="form-label">Turma</label>
              <select className="form-select" value={turma} onChange={(e) => setTurma(e.target.value)}>
                {turmasFiltradas.map((t) => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Aluno</label>
              <select className="form-select">
                {alunos.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
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
              {disciplinas.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Bloco (opcional)</label>
            <select className="form-select" value={bloco} onChange={(e) => setBloco(e.target.value)}>
              <option value="">— Selecionar —</option>
              {blocos.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Professor</label>
            <select className="form-select" value={professor} onChange={(e) => setProfessor(e.target.value)}>
              {professores.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button className="btn btn-primary" onClick={() => setShowPreview(true)}>
            <FileText size={16} />
            Gerar Folha
          </button>
        </div>
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="card animate-fade-in-up delay-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[var(--color-azul-autoridade)]">
              Prévia da Folha
            </h3>
            <div className="flex gap-2">
              <button className="btn btn-outline">
                <Download size={16} />
                Baixar PDF
              </button>
              <button className="btn btn-primary">
                <Printer size={16} />
                Imprimir
              </button>
            </div>
          </div>

          {/* Sheet Preview */}
          <div className="border-2 border-[var(--color-azul-autoridade)] rounded-lg overflow-hidden bg-white">
            {/* Header */}
            <div className="bg-[var(--color-azul-autoridade)] text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Corner mark */}
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
                  <h2 className="text-xl font-extrabold tracking-wide m-0">
                    FICHA DE ACOMPANHAMENTO
                  </h2>
                  <p className="text-sm font-semibold text-[var(--color-amarelo-conquista)] m-0">
                    PRÉ-CMT 5° ANO / PROJETO 4° ANO
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* QR Code placeholder */}
                  <div className="w-16 h-16 bg-white rounded-lg flex flex-col items-center justify-center p-1">
                    <QrCode size={32} className="text-[var(--color-azul-autoridade)]" />
                    <span className="text-[6px] text-[var(--color-azul-autoridade)] font-bold mt-0.5">QR da folha</span>
                  </div>
                  {/* Corner mark */}
                  <div className="w-4 h-4 border-2 border-white flex-shrink-0" />
                </div>
              </div>
            </div>

            {/* Info fields */}
            <div className="p-4 border-b border-[var(--color-cinza-borda)]">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen size={14} className="text-[var(--color-azul-autoridade)]" />
                  <span className="font-semibold text-[var(--color-azul-autoridade)]">Produto:</span>
                  <span>Pré-CMT 5°</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-[var(--color-azul-autoridade)]" />
                  <span className="font-semibold text-[var(--color-azul-autoridade)]">Turma:</span>
                  <span>5A Manhã</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-[var(--color-azul-autoridade)]" />
                  <span className="font-semibold text-[var(--color-azul-autoridade)]">Data:</span>
                  <span>30/05/2026</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen size={14} className="text-[var(--color-azul-autoridade)]" />
                  <span className="font-semibold text-[var(--color-azul-autoridade)]">Disciplina:</span>
                  <span>{disciplina}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-[var(--color-azul-autoridade)]" />
                  <span className="font-semibold text-[var(--color-azul-autoridade)]">Bloco:</span>
                  <span>{bloco || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User size={14} className="text-[var(--color-azul-autoridade)]" />
                  <span className="font-semibold text-[var(--color-azul-autoridade)]">Professor:</span>
                  <span>{professor}</span>
                </div>
              </div>
            </div>

            {/* Table preview */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--color-azul-autoridade)] text-white">
                    {colunas.map((col) => (
                      <th key={col} className="px-2 py-2 font-bold text-center border border-[var(--color-azul-light)]">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[var(--color-cinza-fundo)]'}>
                      <td className="px-2 py-2 text-center border border-[var(--color-cinza-borda)] font-bold">
                        {String(i + 1).padStart(2, '0')}
                      </td>
                      <td className="px-2 py-2 border border-[var(--color-cinza-borda)] w-32">
                        <div className="h-4 border-b border-dotted border-gray-300"></div>
                      </td>
                      <td className="px-2 py-1 text-center border border-[var(--color-cinza-borda)]">
                        <div className="flex justify-center gap-1">
                          {['P', 'A', 'F'].map((l) => (
                            <div key={l} className="flex flex-col items-center">
                              <div className="w-3 h-3 border border-gray-400 rounded-sm" />
                              <span className="text-[7px] text-gray-500 mt-0.5">{l}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-1 py-1 text-center border border-[var(--color-cinza-borda)]">
                          <div className="flex justify-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <div key={n} className="flex flex-col items-center">
                                <div className="w-2.5 h-2.5 border border-gray-400 rounded-sm" />
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-center gap-0.5 mt-0.5">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <span key={n} className="text-[6px] text-gray-400 w-2.5 text-center">{n}</span>
                            ))}
                          </div>
                        </td>
                      ))}
                      <td className="px-2 py-2 border border-[var(--color-cinza-borda)] w-24">
                        <div className="h-4 border-b border-dotted border-gray-300"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-3 border-t-2 border-[var(--color-azul-autoridade)]">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-[var(--color-azul-autoridade)] text-white px-2 py-1 rounded font-bold flex items-center gap-1">
                    📊 ESCALA DE AVALIAÇÃO
                  </span>
                  <span className="text-[var(--color-cinza-texto)]">
                    1 = Muito baixo &nbsp; 2 = Baixo &nbsp; 3 = Regular &nbsp; 4 = Bom &nbsp; 5 = Excelente
                  </span>
                </div>
                <div className="text-xs text-[var(--color-cinza-texto)] border border-[var(--color-cinza-borda)] rounded px-3 py-1">
                  <span className="font-bold">LEGENDA PRESENÇA:</span> P = Presente &nbsp; A = Ausente &nbsp; F = Faltou
                </div>
              </div>
              <div className="text-center mt-2">
                <p className="text-xs text-[var(--color-amarelo-conquista)] font-bold flex items-center justify-center gap-1">
                  <Star size={10} fill="currentColor" />
                  ENSINAR É TRANSFORMAR. ACOMPANHAR É FAZER ACONTECER.
                  <Star size={10} fill="currentColor" />
                </p>
              </div>
              {/* Bottom corner marks */}
              <div className="flex justify-between mt-2">
                <div className="w-4 h-4 border-2 border-[var(--color-azul-autoridade)]" />
                <div className="w-4 h-4 border-2 border-[var(--color-azul-autoridade)]" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
