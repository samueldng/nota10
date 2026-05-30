'use client';

import { useState } from 'react';
import {
  Camera,
  FileEdit,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Upload,
  RefreshCw,
  X,
  Settings,
  Save,
  ChevronDown,
  Trash2,
  ImageIcon,
} from 'lucide-react';

type Produto = 'pre_cmt' | 'projeto_4' | 'reforco' | null;
type ModoLancamento = 'foto' | 'formulario' | null;

interface RecordRow {
  id: number;
  numAluno: string;
  nome: string;
  acertos: number;
  erros: number;
  aproveitamento: number;
  status: 'reconhecido' | 'revisar' | 'nao_reconhecido';
}

const mockRecords: RecordRow[] = [
  { id: 1, numAluno: '0123', nome: 'Ana Clara Silva', acertos: 28, erros: 2, aproveitamento: 93, status: 'reconhecido' },
  { id: 2, numAluno: '0124', nome: 'Bruno Santos Lima', acertos: 24, erros: 6, aproveitamento: 80, status: 'reconhecido' },
  { id: 3, numAluno: '0125', nome: 'Carla Beatriz Rocha', acertos: 18, erros: 12, aproveitamento: 60, status: 'revisar' },
  { id: 4, numAluno: '0126', nome: 'Davi Fernandes Costa', acertos: 26, erros: 4, aproveitamento: 87, status: 'reconhecido' },
  { id: 5, numAluno: '0127', nome: 'Eduarda Martins Souza', acertos: 22, erros: 8, aproveitamento: 73, status: 'reconhecido' },
  { id: 6, numAluno: '0128', nome: 'Felipe Almeida Oliveira', acertos: 15, erros: 15, aproveitamento: 50, status: 'revisar' },
  { id: 7, numAluno: '0129', nome: 'Gabriela Pereira Santos', acertos: 29, erros: 1, aproveitamento: 97, status: 'reconhecido' },
  { id: 8, numAluno: '0130', nome: 'Henrique Ribeiro Gomes', acertos: 20, erros: 10, aproveitamento: 67, status: 'reconhecido' },
];

const produtos = [
  {
    id: 'pre_cmt' as Produto,
    label: 'Pré-CMT 5°',
    icon: (
      <div className="w-14 h-14 rounded-full bg-[var(--color-azul-lightest)] flex items-center justify-center">
        <span className="text-xl font-extrabold text-[var(--color-azul-autoridade)]">5°</span>
      </div>
    ),
  },
  {
    id: 'projeto_4' as Produto,
    label: 'Projeto 4° Ano',
    icon: (
      <div className="w-14 h-14 rounded-full bg-[var(--color-amarelo-light)] flex items-center justify-center">
        <span className="text-2xl">📖</span>
      </div>
    ),
  },
  {
    id: 'reforco' as Produto,
    label: 'Reforço',
    icon: (
      <div className="w-14 h-14 rounded-full bg-[var(--color-verde-light)] flex items-center justify-center">
        <span className="text-2xl">🔄</span>
      </div>
    ),
  },
];

export default function LancarRegistroPage() {
  const [selectedProduto, setSelectedProduto] = useState<Produto>('pre_cmt');
  const [selectedModo, setSelectedModo] = useState<ModoLancamento>('foto');
  const [fotoUploaded, setFotoUploaded] = useState(true);
  const [showConferencia, setShowConferencia] = useState(true);

  const statusIcon = (status: RecordRow['status']) => {
    switch (status) {
      case 'reconhecido':
        return <span className="badge badge-success"><CheckCircle2 size={12} /> Reconhecido</span>;
      case 'revisar':
        return <span className="badge badge-warning"><AlertTriangle size={12} /> Revisar</span>;
      case 'nao_reconhecido':
        return <span className="badge badge-error"><XCircle size={12} /> Não reconhecido</span>;
    }
  };

  const reconhecidos = mockRecords.filter((r) => r.status === 'reconhecido').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Step 1: Escolher Produto */}
      <div className="card animate-fade-in-up">
        <div className="flex items-center gap-3 mb-4">
          <div className="step-number">1</div>
          <div>
            <h2 className="text-lg font-bold text-[var(--color-azul-autoridade)] m-0">
              Escolher Produto
            </h2>
            <p className="text-sm text-[var(--color-cinza-texto)] m-0">
              Selecione o produto referente ao registro que será lançado.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {produtos.map((produto) => (
            <button
              key={produto.id}
              onClick={() => setSelectedProduto(produto.id)}
              className={`card-selectable relative flex flex-col items-center py-6 gap-3 rounded-xl border-2 transition-all ${
                selectedProduto === produto.id
                  ? 'border-[var(--color-azul-autoridade)] bg-[var(--color-azul-lightest)]'
                  : 'border-[var(--color-cinza-borda)] bg-white hover:border-[var(--color-azul-light)]'
              }`}
            >
              {selectedProduto === produto.id && (
                <div className="check-overlay">
                  <CheckCircle2 size={14} />
                </div>
              )}
              {produto.icon}
              <span className="font-bold text-sm text-[var(--color-azul-autoridade)]">
                {produto.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Modo de Lançamento + Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Modo selection */}
        <div className="lg:col-span-3 card animate-fade-in-up delay-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="step-number">2</div>
            <div>
              <h2 className="text-lg font-bold text-[var(--color-azul-autoridade)] m-0">
                Modo de lançamento
              </h2>
              <p className="text-sm text-[var(--color-cinza-texto)] m-0">
                Escolha como deseja enviar ou preencher os registros.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedModo('foto')}
              className={`relative flex flex-col items-center py-8 gap-3 rounded-xl border-2 transition-all ${
                selectedModo === 'foto'
                  ? 'border-[var(--color-azul-autoridade)] bg-[var(--color-azul-lightest)]'
                  : 'border-[var(--color-cinza-borda)] bg-white hover:border-[var(--color-azul-light)]'
              }`}
            >
              {selectedModo === 'foto' && (
                <div className="check-overlay">
                  <CheckCircle2 size={14} />
                </div>
              )}
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-cinza-fundo)] flex items-center justify-center">
                <Camera size={28} className="text-[var(--color-azul-autoridade)]" />
              </div>
              <div className="text-center">
                <span className="font-bold text-sm text-[var(--color-azul-autoridade)] block">
                  Enviar foto da folha
                </span>
                <span className="text-xs text-[var(--color-cinza-texto)] mt-1 block">
                  Envie uma foto ou PDF da folha preenchida para reconhecimento automático.
                </span>
              </div>
            </button>

            <button
              onClick={() => setSelectedModo('formulario')}
              className={`relative flex flex-col items-center py-8 gap-3 rounded-xl border-2 transition-all ${
                selectedModo === 'formulario'
                  ? 'border-[var(--color-azul-autoridade)] bg-[var(--color-azul-lightest)]'
                  : 'border-[var(--color-cinza-borda)] bg-white hover:border-[var(--color-azul-light)]'
              }`}
            >
              {selectedModo === 'formulario' && (
                <div className="check-overlay">
                  <CheckCircle2 size={14} />
                </div>
              )}
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-cinza-fundo)] flex items-center justify-center">
                <FileEdit size={28} className="text-[var(--color-cinza-texto)]" />
              </div>
              <div className="text-center">
                <span className="font-bold text-sm text-[var(--color-azul-autoridade)] block">
                  Preencher formulário manual
                </span>
                <span className="text-xs text-[var(--color-cinza-texto)] mt-1 block">
                  Preencha os registros diretamente no sistema, campo a campo.
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Right: Upload area */}
        <div className="lg:col-span-2 card animate-fade-in-up delay-2">
          <h3 className="text-base font-bold text-[var(--color-azul-autoridade)] mb-1">
            Foto da folha
          </h3>
          <p className="text-xs text-[var(--color-cinza-texto)] mb-4">
            Envie a imagem da folha preenchida.
          </p>

          {!fotoUploaded ? (
            <div className="upload-zone" onClick={() => setFotoUploaded(true)}>
              <Upload size={32} className="text-[var(--color-cinza-texto)] mx-auto mb-2" />
              <p className="text-sm text-[var(--color-cinza-texto)] font-medium">
                Clique para selecionar ou arraste a imagem aqui
              </p>
              <p className="text-xs text-[var(--color-cinza-texto)] mt-1">
                Formatos aceitos: JPG, PNG, PDF (máx. 10MB)
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="upload-zone active p-4">
                <Upload size={24} className="text-[var(--color-verde-sucesso)] mx-auto mb-1" />
                <p className="text-xs text-[var(--color-verde-sucesso)] font-medium">
                  Imagem carregada
                </p>
              </div>

              <div className="border border-[var(--color-cinza-borda)] rounded-lg p-3">
                <p className="text-sm font-medium text-[var(--color-cinza-escuro)] mb-0.5">
                  Arquivo enviado
                </p>
                <div className="flex items-start gap-3 mt-2">
                  <div className="w-16 h-20 bg-[var(--color-cinza-fundo)] rounded-lg flex items-center justify-center flex-shrink-0">
                    <ImageIcon size={24} className="text-[var(--color-cinza-texto)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-azul-autoridade)] truncate">
                      Folha_PreCMT5_TurmaA_10mai.jpg
                    </p>
                    <p className="text-xs text-[var(--color-cinza-texto)]">
                      Enviado em: 10/05/2025 14:32
                    </p>
                    <p className="text-xs text-[var(--color-cinza-texto)]">
                      Tamanho: 1.2 MB
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircle2 size={14} className="text-[var(--color-verde-sucesso)]" />
                      <span className="text-xs font-medium text-[var(--color-verde-sucesso)]">
                        Imagem capturada com sucesso
                      </span>
                    </div>
                  </div>
                  <button className="p-1 hover:bg-[var(--color-vermelho-light)] rounded transition-colors">
                    <Trash2 size={16} className="text-[var(--color-vermelho-erro)]" />
                  </button>
                </div>

                <button
                  className="btn btn-outline w-full mt-3 text-xs"
                  onClick={() => setFotoUploaded(false)}
                >
                  <RefreshCw size={14} />
                  Trocar imagem
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tela de Conferência */}
      {showConferencia && (
        <div className="card animate-fade-in-up delay-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-[var(--color-azul-autoridade)] m-0">
                Tela de conferência
              </h3>
              <p className="text-sm text-[var(--color-cinza-texto)] m-0">
                Confira os dados reconhecidos. Edite se necessário antes de processar.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="badge badge-success text-sm">
                <CheckCircle2 size={14} />
                {reconhecidos} registros reconhecidos
              </span>
              <button className="btn btn-outline text-xs">
                <RefreshCw size={14} />
                Reprocessar imagem
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-12">#</th>
                  <th>Nº Aluno</th>
                  <th>Nome do Aluno</th>
                  <th className="text-center">Acertos</th>
                  <th className="text-center">Erros</th>
                  <th className="text-center">% Aproveitamento</th>
                  <th className="text-center">Situação</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {mockRecords.map((record) => (
                  <tr
                    key={record.id}
                    className={record.status === 'revisar' ? 'row-warning' : ''}
                  >
                    <td className="font-bold text-[var(--color-azul-autoridade)]">{record.id}</td>
                    <td className="font-mono text-sm">{record.numAluno}</td>
                    <td className="font-medium">{record.nome}</td>
                    <td className="text-center font-semibold">{record.acertos}</td>
                    <td className="text-center font-semibold">{record.erros}</td>
                    <td className="text-center">
                      <span
                        className={`font-bold ${
                          record.aproveitamento >= 80
                            ? 'text-[var(--color-verde-sucesso)]'
                            : record.aproveitamento >= 60
                            ? 'text-[var(--color-amarelo-alerta)]'
                            : 'text-[var(--color-vermelho-erro)]'
                        }`}
                      >
                        {record.aproveitamento}%
                      </span>
                    </td>
                    <td className="text-center">{statusIcon(record.status)}</td>
                    <td>
                      <button className="p-1 hover:bg-[var(--color-cinza-fundo)] rounded">
                        <ChevronDown size={16} className="text-[var(--color-cinza-texto)]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-[var(--color-cinza-borda)]">
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-cinza-texto)]">
              <CheckCircle2 size={14} className="text-[var(--color-verde-sucesso)]" />
              Reconhecido com confiança
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-cinza-texto)]">
              <AlertTriangle size={14} className="text-[var(--color-amarelo-alerta)]" />
              Revisar dado
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-cinza-texto)]">
              <XCircle size={14} className="text-[var(--color-vermelho-erro)]" />
              Não reconhecido
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-cinza-borda)]">
            <button className="btn btn-outline w-full sm:w-auto">
              <X size={16} />
              Cancelar
            </button>
            <button className="btn btn-secondary w-full sm:w-auto">
              <Settings size={16} />
              Processar
            </button>
            <button className="btn btn-primary w-full sm:w-auto">
              <Save size={16} />
              Salvar registro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
