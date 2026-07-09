'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Camera,
  FileEdit,
  CheckCircle2,
  AlertTriangle,
  Upload,
  RefreshCw,
  X,
  Save,
  Trash2,
  ImageIcon,
  Home,
  BarChart3,
  Database,
  ArrowRight,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import {
  blocos,
  acompanhamentoLabels,
  type Acompanhamento,
  type Presenca,
  type TriState,
  type Atencao,
  type Pontualidade,
} from '@/lib/mockData';

type ModoLancamento = 'foto' | 'formulario' | null;

interface AlunoFormRow {
  alunoId: string;
  nome: string;
  presenca: Presenca;
  video: TriState;
  palavraChave: TriState;
  fixacao: TriState;
  praticar: TriState;
  nota: string;
  atencao: Atencao;
  participacao: 1 | 2 | 3;
  comportamento: 1 | 2 | 3;
  observacao: string;
  pontualidade: Pontualidade;
}

export default function LancarRegistroPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedAcomp, setSelectedAcomp] = useState<Acompanhamento | null>(null);
  const [selectedModo, setSelectedModo] = useState<ModoLancamento>(null);
  const [selectedTurma, setSelectedTurma] = useState('');
  const [selectedAluno, setSelectedAluno] = useState('');
  const [selectedDisciplina, setSelectedDisciplina] = useState('');
  const [selectedBloco, setSelectedBloco] = useState('');
  const [selectedData, setSelectedData] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [fotoUploaded, setFotoUploaded] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [turmasDisponiveis, setTurmasDisponiveis] = useState<any[]>([]);
  const [alunosDisponiveis, setAlunosDisponiveis] = useState<any[]>([]);
  const [professores, setProfessores] = useState<any[]>([]);
  const [disciplinas, setDisciplinas] = useState<string[]>([]);
  
  const [formRows, setFormRows] = useState<AlunoFormRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const isReforco = selectedAcomp === 'reforco';

  // Carregar turmas, disciplinas e professores no mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [turmasRes, discRes, profRes] = await Promise.all([
          fetch('/api/turmas'),
          fetch('/api/disciplinas'),
          fetch('/api/professores')
        ]);
        if (turmasRes.ok) setTurmasDisponiveis(await turmasRes.json());
        if (discRes.ok) setDisciplinas(await discRes.json());
        if (profRes.ok) setProfessores(await profRes.json());
        
        // Se o professor estiver logado, auto-seleciona
        if (user && user.email) {
          const profs = await profRes.json().catch(()=>[]);
          const currentProf = profs.find((p:any) => p.email.toLowerCase() === user.email?.toLowerCase());
          if (currentProf) setSelectedProfessor(currentProf.id);
        }
      } catch (err) {
        console.error('Erro ao carregar dados iniciais:', err);
      }
    }
    loadInitialData();
  }, [user]);

  // Carregar alunos quando turma ou reforço for selecionado
  useEffect(() => {
    async function loadAlunos() {
      if (!selectedTurma && !isReforco) return;
      try {
        const res = await fetch('/api/alunos');
        if (res.ok) {
          const todosAlunos = await res.json();
          let filtrados = todosAlunos;
          
          if (isReforco) {
            filtrados = todosAlunos.filter((a: any) => a.acompanhamento.includes('reforco'));
          } else if (selectedTurma) {
            filtrados = todosAlunos.filter((a: any) => a.turmaId === selectedTurma);
          }
          
          setAlunosDisponiveis(filtrados);
          
          // Inicializa formRows
          setFormRows(filtrados.map((a: any) => ({
            alunoId: a.id,
            nome: a.nome,
            presenca: 'presente',
            video: 'fez',
            palavraChave: 'fez',
            fixacao: 'fez',
            praticar: 'fez',
            nota: '',
            atencao: 'atento',
            participacao: 3,
            comportamento: 3,
            observacao: '',
            pontualidade: 'pontual',
          })));
        }
      } catch (err) {
        console.error('Erro ao carregar alunos:', err);
      }
    }
    loadAlunos();
  }, [selectedTurma, isReforco]);

  const updateRow = (alunoId: string, field: keyof AlunoFormRow, value: any) => {
    setFormRows(prev => prev.map(row => 
      row.alunoId === alunoId ? { ...row, [field]: value } : row
    ));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const payload = {
        data: selectedData,
        acompanhamento: selectedAcomp,
        turma: isReforco ? 'Reforço' : (turmasDisponiveis.find(t => t.id === selectedTurma)?.nome || selectedTurma),
        aluno: isReforco ? (alunosDisponiveis.find(a => a.id === selectedAluno)?.nome || selectedAluno) : 'Turma inteira',
        disciplina: selectedDisciplina,
        bloco: selectedBloco || null,
        professor: professores.find(p => p.id === selectedProfessor)?.nome || selectedProfessor,
        origem: 'manual',
        status: 'salvo',
        lancadoPor: user?.name || 'Sistema',
        alunos: isReforco ? formRows.filter(r => r.alunoId === selectedAluno) : formRows
      };

      const res = await fetch('/api/registros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao salvar registro');
      }

      setSaved(true);
      setStep(5);
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const acompanhamentos: { id: Acompanhamento; label: string; icon: React.ReactNode }[] = [
    {
      id: 'pre_cmt_5',
      label: 'Pré-CMT 5º Ano',
      icon: <div className="w-14 h-14 rounded-full bg-[var(--color-azul-lightest)] flex items-center justify-center"><span className="text-xl font-extrabold text-[var(--color-azul-autoridade)]">5º</span></div>,
    },
    {
      id: 'projeto_4',
      label: 'Projeto 4º Ano',
      icon: <div className="w-14 h-14 rounded-full bg-[var(--color-amarelo-light)] flex items-center justify-center"><span className="text-xl font-extrabold text-[var(--color-amarelo-conquista)]">4º</span></div>,
    },
    {
      id: 'reforco',
      label: 'Reforço',
      icon: <div className="w-14 h-14 rounded-full bg-[var(--color-verde-light)] flex items-center justify-center"><span className="text-2xl">🔄</span></div>,
    },
  ];

  // Step indicator
  const steps = [
    { num: 1, label: 'Acompanhamento' },
    { num: 2, label: 'Modo de lançamento' },
    { num: 3, label: isReforco ? 'Dados do aluno' : 'Dados da turma' },
    { num: 4, label: 'Conferência' },
    { num: 5, label: 'Salvar' },
  ];

  if (saved) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12 animate-fade-in-up">
          <div className="w-20 h-20 rounded-full bg-[var(--color-verde-light)] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={40} className="text-[var(--color-verde-sucesso)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-azul-autoridade)] mb-2">
            Registro salvo com sucesso!
          </h2>
          <p className="text-[var(--color-cinza-texto)] mb-8">
            O registro foi salvo no Histórico e já alimenta os relatórios e o ranking.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => { setSaved(false); setStep(1); setSelectedAcomp(null); setSelectedModo(null); setFormRows([]); setSelectedTurma(''); setSelectedAluno(''); }} className="btn btn-primary">
              <FileEdit size={16} /> Novo lançamento
            </button>
            <Link href="/historico" className="btn btn-secondary no-underline">
              <Database size={16} /> Abrir Histórico
            </Link>
            <Link href="/relatorios" className="btn btn-outline no-underline">
              <BarChart3 size={16} /> Gerar Relatório
            </Link>
            <Link href="/" className="btn btn-outline no-underline">
              <Home size={16} /> Voltar para Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Step Indicator */}
      <div className="card animate-fade-in-up">
        <div className="flex items-center justify-between overflow-x-auto gap-2">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2 flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step === s.num ? 'bg-[var(--color-amarelo-conquista)] text-[var(--color-azul-autoridade)]' :
                step > s.num ? 'bg-[var(--color-verde-sucesso)] text-white' :
                'bg-[var(--color-cinza-fundo)] text-[var(--color-cinza-texto)]'
              }`}>
                {step > s.num ? <CheckCircle2 size={16} /> : s.num}
              </div>
              <span className={`text-xs font-medium hidden sm:inline ${
                step === s.num ? 'text-[var(--color-azul-autoridade)]' : 'text-[var(--color-cinza-texto)]'
              }`}>
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${step > s.num ? 'bg-[var(--color-verde-sucesso)]' : 'bg-[var(--color-cinza-borda)]'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Escolher Acompanhamento */}
      {step === 1 && (
        <div className="card animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="step-number">1</div>
            <div>
              <h2 className="text-lg font-bold text-[var(--color-azul-autoridade)] m-0">Escolher Acompanhamento</h2>
              <p className="text-sm text-[var(--color-cinza-texto)] m-0">Selecione o acompanhamento referente ao registro que será lançado.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {acompanhamentos.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAcomp(a.id)}
                className={`relative flex flex-col items-center py-6 gap-3 rounded-xl border-2 transition-all ${
                  selectedAcomp === a.id
                    ? 'border-[var(--color-azul-autoridade)] bg-[var(--color-azul-lightest)]'
                    : 'border-[var(--color-cinza-borda)] bg-white hover:border-[var(--color-azul-light)]'
                }`}
              >
                {selectedAcomp === a.id && (
                  <div className="check-overlay"><CheckCircle2 size={14} /></div>
                )}
                {a.icon}
                <span className="font-bold text-sm text-[var(--color-azul-autoridade)]">{a.label}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-end mt-6">
            <button
              className="btn btn-primary"
              disabled={!selectedAcomp}
              onClick={() => setStep(2)}
            >
              Próximo <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Modo de Lançamento + Seleção */}
      {step === 2 && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="step-number">2</div>
              <div>
                <h2 className="text-lg font-bold text-[var(--color-azul-autoridade)] m-0">Modo de lançamento</h2>
                <p className="text-sm text-[var(--color-cinza-texto)] m-0">Escolha como deseja enviar ou preencher os registros.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setSelectedModo('foto')}
                className={`relative flex flex-col items-center py-8 gap-3 rounded-xl border-2 transition-all ${
                  selectedModo === 'foto'
                    ? 'border-[var(--color-azul-autoridade)] bg-[var(--color-azul-lightest)]'
                    : 'border-[var(--color-cinza-borda)] bg-white hover:border-[var(--color-azul-light)]'
                }`}
              >
                {selectedModo === 'foto' && <div className="check-overlay"><CheckCircle2 size={14} /></div>}
                <Camera size={28} className="text-[var(--color-azul-autoridade)]" />
                <span className="font-bold text-sm text-[var(--color-azul-autoridade)]">Enviar foto da folha</span>
                <span className="text-xs text-[var(--color-cinza-texto)]">Envie uma foto da folha preenchida</span>
              </button>
              <button
                onClick={() => setSelectedModo('formulario')}
                className={`relative flex flex-col items-center py-8 gap-3 rounded-xl border-2 transition-all ${
                  selectedModo === 'formulario'
                    ? 'border-[var(--color-azul-autoridade)] bg-[var(--color-azul-lightest)]'
                    : 'border-[var(--color-cinza-borda)] bg-white hover:border-[var(--color-azul-light)]'
                }`}
              >
                {selectedModo === 'formulario' && <div className="check-overlay"><CheckCircle2 size={14} /></div>}
                <FileEdit size={28} className="text-[var(--color-cinza-texto)]" />
                <span className="font-bold text-sm text-[var(--color-azul-autoridade)]">Preencher formulário manual</span>
                <span className="text-xs text-[var(--color-cinza-texto)]">Preencha os registros campo a campo</span>
              </button>
            </div>

            {/* Selection fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-[var(--color-cinza-borda)]">
              {!isReforco ? (
                <div className="form-group">
                  <label className="form-label">Turma</label>
                  <select className="form-select" value={selectedTurma} onChange={e => setSelectedTurma(e.target.value)}>
                    <option value="">Selecione...</option>
                    {turmasDisponiveis.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                  </select>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Aluno</label>
                  <select className="form-select" value={selectedAluno} onChange={e => setSelectedAluno(e.target.value)}>
                    <option value="">Selecione...</option>
                    {alunosDisponiveis.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Disciplina</label>
                <select className="form-select" value={selectedDisciplina} onChange={e => setSelectedDisciplina(e.target.value)}>
                  <option value="">Selecione...</option>
                  {(isReforco ? ['Multidisciplinar'] : disciplinas).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Data</label>
                <input type="date" className="form-input" value={selectedData} onChange={e => setSelectedData(e.target.value)} />
              </div>
              {!isReforco && (
                <div className="form-group">
                  <label className="form-label">Bloco (opcional)</label>
                  <select className="form-select" value={selectedBloco} onChange={e => setSelectedBloco(e.target.value)}>
                    <option value="">— Selecionar —</option>
                    {blocos.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Professor</label>
                <select className="form-select" value={selectedProfessor} onChange={e => setSelectedProfessor(e.target.value)}>
                  <option value="">Selecione...</option>
                  {professores.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button className="btn btn-outline" onClick={() => setStep(1)}><ArrowLeft size={16} /> Voltar</button>
            <button 
              className="btn btn-primary" 
              disabled={!selectedModo || (!isReforco && !selectedTurma) || (isReforco && !selectedAluno) || !selectedDisciplina || !selectedProfessor} 
              onClick={() => setStep(3)}
            >
              Próximo <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Data Entry */}
      {step === 3 && (
        <div className="space-y-6 animate-fade-in-up">
          {selectedModo === 'foto' ? (
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="step-number">3</div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-azul-autoridade)] m-0">Enviar foto da folha</h2>
                  <p className="text-sm text-[var(--color-cinza-texto)] m-0">Envie a imagem da folha preenchida para reconhecimento.</p>
                </div>
              </div>
              {!fotoUploaded ? (
                <div className="upload-zone" onClick={() => setFotoUploaded(true)}>
                  <Upload size={40} className="text-[var(--color-cinza-texto)] mx-auto mb-3" />
                  <p className="text-sm text-[var(--color-cinza-texto)] font-medium">Clique para selecionar ou arraste a imagem aqui</p>
                  <p className="text-xs text-[var(--color-cinza-texto)] mt-1">Formatos: JPG, PNG, PDF (máx. 10MB)</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="upload-zone active p-4">
                    <CheckCircle2 size={24} className="text-[var(--color-verde-sucesso)] mx-auto mb-1" />
                    <p className="text-xs text-[var(--color-verde-sucesso)] font-medium">Imagem carregada com sucesso</p>
                  </div>
                  <div className="border border-[var(--color-cinza-borda)] rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-20 bg-[var(--color-cinza-fundo)] rounded-lg flex items-center justify-center flex-shrink-0">
                        <ImageIcon size={24} className="text-[var(--color-cinza-texto)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--color-azul-autoridade)] truncate">Folha_{selectedAcomp}_06jun.jpg</p>
                        <p className="text-xs text-[var(--color-cinza-texto)]">Enviado em: 06/06/2026 14:32</p>
                        <div className="flex items-center gap-1 mt-1">
                          <CheckCircle2 size={14} className="text-[var(--color-verde-sucesso)]" />
                          <span className="text-xs font-medium text-[var(--color-verde-sucesso)]">Imagem capturada</span>
                        </div>
                      </div>
                      <button className="p-1 hover:bg-[var(--color-vermelho-light)] rounded" onClick={() => setFotoUploaded(false)}>
                        <Trash2 size={16} className="text-[var(--color-vermelho-erro)]" />
                      </button>
                    </div>
                    <button className="btn btn-outline w-full mt-3 text-xs" onClick={() => setFotoUploaded(false)}>
                      <RefreshCw size={14} /> Trocar imagem
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="step-number">3</div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-azul-autoridade)] m-0">
                    Preencher registro — {selectedAcomp ? acompanhamentoLabels[selectedAcomp] : ''}
                  </h2>
                  <p className="text-sm text-[var(--color-cinza-texto)] m-0">Preencha os campos conforme a folha física.</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table text-xs">
                  <thead>
                    <tr>
                      <th className="w-8">#</th>
                      <th>Aluno</th>
                      <th>Presença</th>
                      {selectedAcomp === 'pre_cmt_5' && <th>Vídeo</th>}
                      {selectedAcomp === 'pre_cmt_5' && <th>P. Chave</th>}
                      <th>Fixação</th>
                      <th>Praticar</th>
                      <th>Atenção</th>
                      <th>Partic.</th>
                      <th>Comport.</th>
                      <th>Obs.</th>
                      <th>Pontualid.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formRows.filter(r => !isReforco || r.alunoId === selectedAluno).map((row, i) => (
                      <tr key={row.alunoId}>
                        <td className="font-bold text-[var(--color-azul-autoridade)]">{i + 1}</td>
                        <td className="font-medium whitespace-nowrap text-sm">{row.nome}</td>
                        <td>
                          <select className="form-select text-xs py-1 px-1" style={{ height: 30, minWidth: 90 }} value={row.presenca} onChange={e => updateRow(row.alunoId, 'presenca', e.target.value)}>
                            <option value="presente">Presente</option>
                            <option value="atrasado">Atrasado</option>
                            <option value="faltou">Faltou</option>
                          </select>
                        </td>
                        {selectedAcomp === 'pre_cmt_5' && (
                          <td>
                            <select className="form-select text-xs py-1 px-1" style={{ height: 30, minWidth: 80 }} value={row.video} onChange={e => updateRow(row.alunoId, 'video', e.target.value)}>
                              <option value="nao_fez">Não Fez</option>
                              <option value="metade">Metade</option>
                              <option value="fez">Fez</option>
                            </select>
                          </td>
                        )}
                        {selectedAcomp === 'pre_cmt_5' && (
                          <td>
                            <select className="form-select text-xs py-1 px-1" style={{ height: 30, minWidth: 80 }} value={row.palavraChave} onChange={e => updateRow(row.alunoId, 'palavraChave', e.target.value)}>
                              <option value="nao_fez">Não Fez</option>
                              <option value="metade">Metade</option>
                              <option value="fez">Fez</option>
                            </select>
                          </td>
                        )}
                        <td>
                          <select className="form-select text-xs py-1 px-1" style={{ height: 30, minWidth: 80 }} value={row.fixacao} onChange={e => updateRow(row.alunoId, 'fixacao', e.target.value)}>
                            <option value="nao_fez">Não Fez</option>
                            <option value="metade">Metade</option>
                            <option value="fez">Fez</option>
                          </select>
                        </td>
                        <td>
                          <select className="form-select text-xs py-1 px-1" style={{ height: 30, minWidth: 80 }} value={row.praticar} onChange={e => updateRow(row.alunoId, 'praticar', e.target.value)}>
                            <option value="nao_fez">Não Fez</option>
                            <option value="metade">Metade</option>
                            <option value="fez">Fez</option>
                          </select>
                        </td>
                        <td>
                          <select className="form-select text-xs py-1 px-1" style={{ height: 30, minWidth: 100 }} value={row.atencao} onChange={e => updateRow(row.alunoId, 'atencao', e.target.value)}>
                            <option value="desinteressado">Desinteressado</option>
                            <option value="distraido">Distraído</option>
                            <option value="atento">Atento</option>
                          </select>
                        </td>
                        <td>
                          <select className="form-select text-xs py-1 px-1" style={{ height: 30, minWidth: 50 }} value={row.participacao} onChange={e => updateRow(row.alunoId, 'participacao', Number(e.target.value))}>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                          </select>
                        </td>
                        <td>
                          <select className="form-select text-xs py-1 px-1" style={{ height: 30, minWidth: 50 }} value={row.comportamento} onChange={e => updateRow(row.alunoId, 'comportamento', Number(e.target.value))}>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                          </select>
                        </td>
                        <td>
                          <input className="form-input text-xs py-1 px-1" style={{ height: 30, minWidth: 80 }} placeholder="Obs..." value={row.observacao} onChange={e => updateRow(row.alunoId, 'observacao', e.target.value)} />
                        </td>
                        <td>
                          <select className="form-select text-xs py-1 px-1" style={{ height: 30, minWidth: 80 }} value={row.pontualidade} onChange={e => updateRow(row.alunoId, 'pontualidade', e.target.value)}>
                            <option value="pontual">Pontual</option>
                            <option value="atrasado">Atrasado</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button className="btn btn-outline" onClick={() => setStep(2)}><ArrowLeft size={16} /> Voltar</button>
            <button className="btn btn-primary" onClick={() => setStep(4)} disabled={selectedModo === 'foto' && !fotoUploaded}>
              Próximo — Conferir <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Conference */}
      {step === 4 && (
        <div className="space-y-6 animate-fade-in-up">
          {submitError && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2 text-sm font-medium">
              <AlertTriangle size={18} /> {submitError}
            </div>
          )}
          
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="step-number">4</div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-azul-autoridade)] m-0">Conferência</h2>
                  <p className="text-sm text-[var(--color-cinza-texto)] m-0">Confira os dados antes de salvar. Edite se necessário.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="badge badge-success text-sm">
                  <CheckCircle2 size={14} /> {isReforco ? 1 : formRows.length} registros
                </span>
                {selectedModo === 'foto' && (
                  <>
                    <span className="badge badge-warning text-sm">
                      <AlertTriangle size={14} /> 0 marcações duvidosas
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table text-xs">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Aluno</th>
                    <th>Presença</th>
                    {selectedAcomp === 'pre_cmt_5' && <th>Vídeo</th>}
                    {selectedAcomp === 'pre_cmt_5' && <th>P. Chave</th>}
                    <th>Fixação</th>
                    <th>Praticar</th>
                    <th>Atenção</th>
                    <th>Partic.</th>
                    <th>Comport.</th>
                    <th>Pontualid.</th>
                  </tr>
                </thead>
                <tbody>
                  {formRows.filter(r => !isReforco || r.alunoId === selectedAluno).map((row, i) => (
                    <tr key={row.alunoId}>
                      <td className="font-bold text-[var(--color-azul-autoridade)]">{i + 1}</td>
                      <td className="font-medium whitespace-nowrap">{row.nome}</td>
                      <td><span className={`badge ${row.presenca === 'presente' ? 'badge-success' : 'badge-warning'} text-[10px] capitalize`}>{row.presenca}</span></td>
                      {selectedAcomp === 'pre_cmt_5' && <td className={`font-semibold ${row.video === 'fez' ? 'text-[var(--color-verde-sucesso)]' : 'text-[var(--color-amarelo-alerta)]'} capitalize`}>{row.video.replace('_', ' ')}</td>}
                      {selectedAcomp === 'pre_cmt_5' && <td className={`font-semibold ${row.palavraChave === 'fez' ? 'text-[var(--color-verde-sucesso)]' : 'text-[var(--color-amarelo-alerta)]'} capitalize`}>{row.palavraChave.replace('_', ' ')}</td>}
                      <td className={`font-semibold ${row.fixacao === 'fez' ? 'text-[var(--color-verde-sucesso)]' : 'text-[var(--color-amarelo-alerta)]'} capitalize`}>{row.fixacao.replace('_', ' ')}</td>
                      <td className={`font-semibold ${row.praticar === 'fez' ? 'text-[var(--color-verde-sucesso)]' : 'text-[var(--color-amarelo-alerta)]'} capitalize`}>{row.praticar.replace('_', ' ')}</td>
                      <td className="font-semibold capitalize text-[var(--color-verde-sucesso)]">{row.atencao}</td>
                      <td className="text-center font-bold">{row.participacao}</td>
                      <td className="text-center font-bold">{row.comportamento}</td>
                      <td><span className="badge badge-success text-[10px] capitalize">{row.pontualidade}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between">
            <button className="btn btn-outline" onClick={() => setStep(3)} disabled={isSubmitting}><ArrowLeft size={16} /> Voltar</button>
            <div className="flex gap-3">
              <button className="btn btn-outline" onClick={() => { setStep(1); setSelectedAcomp(null); }} disabled={isSubmitting}>
                <X size={16} /> Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
                {isSubmitting ? 'Salvando...' : 'Salvar registro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
