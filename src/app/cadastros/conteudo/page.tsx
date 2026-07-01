'use client';

import { useState, useEffect } from 'react';
import {
  getVideoaulas, addVideoaula, deleteVideoaula,
  getMateriais, addMaterial, deleteMaterial,
  getComunicados, addComunicado, deleteComunicado,
  Videoaula,
} from '@/lib/portalData';
import type { MaterialDownload, ComunicadoEscola } from '@/lib/mockData';
import {
  Plus, PlayCircle, FileText, Megaphone, Trash2, Save, X, Link as LinkIcon,
  Upload, CheckCircle, Info, AlertTriangle, Bell, Lock, Globe,
} from 'lucide-react';

export default function PainelConteudoAdminPage() {
  const [activeTab, setActiveTab] = useState<'videos' | 'materiais' | 'comunicados'>('videos');
  const [showModal, setShowModal] = useState(false);

  // List states
  const [videoList, setVideoList] = useState<Videoaula[]>([]);
  const [materialList, setMaterialList] = useState<MaterialDownload[]>([]);
  const [comunicadoList, setComunicadoList] = useState<ComunicadoEscola[]>([]);

  // Form states
  const [videoForm, setVideoForm] = useState({
    titulo: '',
    disciplina: 'Português',
    bloco: 'Bloco 1',
    duracao: '15:00',
    videoSource: 'youtube' as 'youtube' | 'local',
    videoUrl: '',
    localFileName: '',
  });

  const [materialForm, setMaterialForm] = useState({
    titulo: '',
    tipo: 'apostila' as any,
    turmaId: 'T001',
    tamanho: '5.2 MB',
  });

  const [comunicadoForm, setComunicadoForm] = useState({
    titulo: '',
    conteudo: '',
    tipo: 'informativo' as any,
    turmaTarget: 'todas',
  });

  // Load data from portalData (which loads from localStorage)
  const refreshData = () => {
    setVideoList(getVideoaulas());
    setMaterialList(getMateriais());
    setComunicadoList(getComunicados());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleOpenAddModal = () => {
    setShowModal(true);
  };

  const handleCreateVideo = () => {
    if (!videoForm.titulo) return;

    const newVideo: Videoaula = {
      id: 'v_' + Math.random().toString(36).substring(2, 9),
      titulo: videoForm.titulo,
      disciplina: videoForm.disciplina,
      bloco: videoForm.bloco,
      duracao: videoForm.duracao,
      status: 'disponivel',
      xp: 15,
      thumbnailColor: videoForm.disciplina === 'Português' ? '#8B5CF6' : '#F59E0B',
      videoSource: videoForm.videoSource,
      videoUrl: videoForm.videoSource === 'youtube' ? videoForm.videoUrl : videoForm.localFileName || 'aula_local.mp4',
    };

    addVideoaula(newVideo);
    refreshData();
    setShowModal(false);
    setVideoForm({
      titulo: '',
      disciplina: 'Português',
      bloco: 'Bloco 1',
      duracao: '15:00',
      videoSource: 'youtube',
      videoUrl: '',
      localFileName: '',
    });
  };

  const handleCreateMaterial = () => {
    if (!materialForm.titulo) return;

    const newMaterial: MaterialDownload = {
      id: 'm_' + Math.random().toString(36).substring(2, 9),
      titulo: materialForm.titulo,
      tipo: materialForm.tipo,
      turmaId: materialForm.turmaId,
      tamanho: materialForm.tamanho,
      dataUpload: new Date().toLocaleDateString('pt-BR'),
    };

    addMaterial(newMaterial);
    refreshData();
    setShowModal(false);
    setMaterialForm({
      titulo: '',
      tipo: 'apostila',
      turmaId: 'T001',
      tamanho: '5.2 MB',
    });
  };

  const handleCreateComunicado = () => {
    if (!comunicadoForm.titulo || !comunicadoForm.conteudo) return;

    const newComunicado: ComunicadoEscola = {
      id: 'com_' + Math.random().toString(36).substring(2, 9),
      titulo: comunicadoForm.titulo,
      conteudo: comunicadoForm.conteudo,
      tipo: comunicadoForm.tipo,
      data: new Date().toLocaleDateString('pt-BR'),
      turmas: comunicadoForm.turmaTarget === 'todas' ? ['T001', 'T002', 'T003', 'T004', 'T005', 'T006'] : [comunicadoForm.turmaTarget],
    };

    addComunicado(newComunicado);
    refreshData();
    setShowModal(false);
    setComunicadoForm({
      titulo: '',
      conteudo: '',
      tipo: 'informativo',
      turmaTarget: 'todas',
    });
  };

  const handleDeleteVideo = (id: string) => {
    deleteVideoaula(id);
    refreshData();
  };

  const handleDeleteMaterial = (id: string) => {
    deleteMaterial(id);
    refreshData();
  };

  const handleDeleteComunicado = (id: string) => {
    deleteComunicado(id);
    refreshData();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Tab Navigation header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-[var(--color-cinza-borda)] shadow-sm animate-fade-in-up">
        <div className="flex bg-[var(--color-cinza-fundo)] p-1 rounded-xl w-full sm:w-auto">
          {[
            { id: 'videos', label: 'Videoaulas', icon: <PlayCircle size={16} /> },
            { id: 'materiais', label: 'Materiais PDF', icon: <FileText size={16} /> },
            { id: 'comunicados', label: 'Mural de Comunicados', icon: <Megaphone size={16} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-none ${
                activeTab === tab.id
                  ? 'bg-[var(--color-azul-autoridade)] text-white shadow-sm'
                  : 'text-[var(--color-cinza-texto)] hover:text-[var(--color-azul-autoridade)]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleOpenAddModal}
          className="btn btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          {activeTab === 'videos' ? 'Novo Vídeo' : activeTab === 'materiais' ? 'Postar Material' : 'Criar Comunicado'}
        </button>
      </div>

      {/* Videoaulas Tab Panel */}
      {activeTab === 'videos' && (
        <div className="card p-0 overflow-hidden animate-fade-in-up">
          <div className="p-4 border-b border-[var(--color-cinza-borda)] bg-gray-50/50">
            <h3 className="text-sm font-bold text-[var(--color-azul-autoridade)] m-0">Videoaulas Publicadas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vídeo</th>
                  <th>Disciplina</th>
                  <th>Bloco</th>
                  <th>Origem</th>
                  <th>Link/Arquivo</th>
                  <th>Duração</th>
                  <th className="text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {videoList.map((vid) => (
                  <tr key={vid.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <PlayCircle size={18} className="text-[var(--color-azul-autoridade)]" />
                        <span className="font-semibold">{vid.titulo}</span>
                      </div>
                    </td>
                    <td>{vid.disciplina}</td>
                    <td><span className="badge badge-info">{vid.bloco}</span></td>
                    <td>
                      <span className={`badge ${vid.videoSource === 'youtube' ? 'badge-warning' : 'badge-success'}`}>
                        {vid.videoSource === 'youtube' ? 'YouTube' : 'Arquivo Local'}
                      </span>
                    </td>
                    <td className="max-w-[200px] truncate text-xs font-mono text-[var(--color-cinza-texto)]">
                      {vid.videoUrl}
                    </td>
                    <td>{vid.duracao}</td>
                    <td>
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleDeleteVideo(vid.id)}
                          className="p-1.5 rounded-lg hover:bg-[var(--color-vermelho-light)] transition-colors text-[var(--color-vermelho-erro)]"
                          title="Remover vídeo"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Materiais Tab Panel */}
      {activeTab === 'materiais' && (
        <div className="card p-0 overflow-hidden animate-fade-in-up">
          <div className="p-4 border-b border-[var(--color-cinza-borda)] bg-gray-50/50">
            <h3 className="text-sm font-bold text-[var(--color-azul-autoridade)] m-0">Arquivos e Apostilas no Mural</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Título do Material</th>
                  <th>Tipo</th>
                  <th>Tamanho</th>
                  <th>Turma Destino</th>
                  <th>Data de Upload</th>
                  <th className="text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {materialList.map((mat) => (
                  <tr key={mat.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <FileText size={18} className="text-[var(--color-azul-autoridade)]" />
                        <span className="font-semibold">{mat.titulo}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info uppercase text-[10px]">{mat.tipo}</span>
                    </td>
                    <td>{mat.tamanho}</td>
                    <td>
                      <span className="font-bold text-xs">
                        {mat.turmaId === 'todas' ? 'Todas' : mat.turmaId === 'T001' ? '5A Manhã' : mat.turmaId}
                      </span>
                    </td>
                    <td>{mat.dataUpload}</td>
                    <td>
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleDeleteMaterial(mat.id)}
                          className="p-1.5 rounded-lg hover:bg-[var(--color-vermelho-light)] transition-colors text-[var(--color-vermelho-erro)]"
                          title="Excluir material"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Comunicados Tab Panel */}
      {activeTab === 'comunicados' && (
        <div className="card p-0 overflow-hidden animate-fade-in-up">
          <div className="p-4 border-b border-[var(--color-cinza-borda)] bg-gray-50/50">
            <h3 className="text-sm font-bold text-[var(--color-azul-autoridade)] m-0">Comunicados Ativos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Título do Aviso</th>
                  <th>Tipo/Criticidade</th>
                  <th>Descrição</th>
                  <th>Data</th>
                  <th className="text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {comunicadoList.map((com) => (
                  <tr key={com.id}>
                    <td className="font-bold">{com.titulo}</td>
                    <td>
                      <span className={`badge ${
                        com.tipo === 'urgente' ? 'badge-error' :
                        com.tipo === 'aviso' ? 'badge-warning' :
                        'badge-info'
                      }`}>
                        {com.tipo}
                      </span>
                    </td>
                    <td className="max-w-md truncate text-xs text-[var(--color-cinza-texto)]">
                      {com.conteudo}
                    </td>
                    <td>{com.data}</td>
                    <td>
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleDeleteComunicado(com.id)}
                          className="p-1.5 rounded-lg hover:bg-[var(--color-vermelho-light)] transition-colors text-[var(--color-vermelho-erro)]"
                          title="Excluir comunicado"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal para Adição de Conteúdo */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5 border-b pb-3">
              <h3 className="text-base font-bold text-[var(--color-azul-autoridade)]">
                {activeTab === 'videos' ? 'Cadastrar Nova Videoaula' : activeTab === 'materiais' ? 'Publicar Novo Material PDF' : 'Criar Novo Comunicado'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-[var(--color-cinza-fundo)] rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* FORM: VIDEOS */}
            {activeTab === 'videos' && (
              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Título do Vídeo</label>
                  <input
                    type="text"
                    className="form-input"
                    value={videoForm.titulo}
                    onChange={(e) => setVideoForm({ ...videoForm, titulo: e.target.value })}
                    placeholder="Ex: Frações Equivalentes"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label">Disciplina</label>
                    <select
                      className="form-select"
                      value={videoForm.disciplina}
                      onChange={(e) => setVideoForm({ ...videoForm, disciplina: e.target.value })}
                    >
                      <option>Português</option>
                      <option>Matemática</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bloco</label>
                    <select
                      className="form-select"
                      value={videoForm.bloco}
                      onChange={(e) => setVideoForm({ ...videoForm, bloco: e.target.value })}
                    >
                      <option>Bloco 1</option>
                      <option>Bloco 2</option>
                      <option>Bloco 3</option>
                      <option>Bloco 4</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label">Duração</label>
                    <input
                      type="text"
                      className="form-input"
                      value={videoForm.duracao}
                      onChange={(e) => setVideoForm({ ...videoForm, duracao: e.target.value })}
                      placeholder="Ex: 14:30"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Origem do Vídeo</label>
                    <select
                      className="form-select"
                      value={videoForm.videoSource}
                      onChange={(e) => setVideoForm({ ...videoForm, videoSource: e.target.value as any })}
                    >
                      <option value="youtube">YouTube Link</option>
                      <option value="local">Arquivo Local (.mp4)</option>
                    </select>
                  </div>
                </div>

                {videoForm.videoSource === 'youtube' ? (
                  <div className="form-group">
                    <label className="form-label flex items-center gap-1">
                      <LinkIcon size={12} /> URL do Vídeo (YouTube)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={videoForm.videoUrl}
                      onChange={(e) => setVideoForm({ ...videoForm, videoUrl: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label flex items-center gap-1">
                      <Upload size={12} /> Simular Upload Local
                    </label>
                    <div className="border-2 border-dashed rounded-xl p-4 text-center hover:bg-[var(--color-azul-lightest)] transition-colors cursor-pointer relative">
                      <input
                        type="file"
                        accept="video/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setVideoForm({ ...videoForm, localFileName: file.name });
                          }
                        }}
                      />
                      <Upload size={24} className="mx-auto text-[var(--color-cinza-texto)] mb-1" />
                      <p className="text-xs font-bold text-[var(--color-azul-autoridade)]">
                        {videoForm.localFileName ? `Selecionado: ${videoForm.localFileName}` : 'Escolha um arquivo de vídeo (.mp4)'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* FORM: MATERIAIS */}
            {activeTab === 'materiais' && (
              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Título do Material PDF</label>
                  <input
                    type="text"
                    className="form-input"
                    value={materialForm.titulo}
                    onChange={(e) => setMaterialForm({ ...materialForm, titulo: e.target.value })}
                    placeholder="Ex: Apostila de Revisão de Português"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label">Tipo</label>
                    <select
                      className="form-select"
                      value={materialForm.tipo}
                      onChange={(e) => setMaterialForm({ ...materialForm, tipo: e.target.value as any })}
                    >
                      <option value="apostila">Apostila</option>
                      <option value="cronograma">Cronograma</option>
                      <option value="revisao">Revisão</option>
                      <option value="combinados">Regras e Combinados</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tamanho do Arquivo</label>
                    <input
                      type="text"
                      className="form-input"
                      value={materialForm.tamanho}
                      onChange={(e) => setMaterialForm({ ...materialForm, tamanho: e.target.value })}
                      placeholder="Ex: 3.4 MB"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Turma Alvo</label>
                  <select
                    className="form-select"
                    value={materialForm.turmaId}
                    onChange={(e) => setMaterialForm({ ...materialForm, turmaId: e.target.value })}
                  >
                    <option value="todas">Todas as turmas</option>
                    <option value="T001">5A Manhã</option>
                    <option value="T002">5B Tarde</option>
                    <option value="T004">4A Manhã</option>
                    <option value="T005">4B Tarde</option>
                    <option value="T006">Reforço Geral</option>
                  </select>
                </div>
              </div>
            )}

            {/* FORM: COMUNICADOS */}
            {activeTab === 'comunicados' && (
              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Título do Comunicado</label>
                  <input
                    type="text"
                    className="form-input"
                    value={comunicadoForm.titulo}
                    onChange={(e) => setComunicadoForm({ ...comunicadoForm, titulo: e.target.value })}
                    placeholder="Ex: Reunião Geral de Pais"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label">Criticidade</label>
                    <select
                      className="form-select"
                      value={comunicadoForm.tipo}
                      onChange={(e) => setComunicadoForm({ ...comunicadoForm, tipo: e.target.value as any })}
                    >
                      <option value="informativo">Informativo</option>
                      <option value="aviso">Aviso</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Turma Destino</label>
                    <select
                      className="form-select"
                      value={comunicadoForm.turmaTarget}
                      onChange={(e) => setComunicadoForm({ ...comunicadoForm, turmaTarget: e.target.value })}
                    >
                      <option value="todas">Todas as turmas</option>
                      <option value="T001">5A Manhã</option>
                      <option value="T002">5B Tarde</option>
                      <option value="T004">4A Manhã</option>
                      <option value="T005">4B Tarde</option>
                      <option value="T006">Reforço Geral</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Texto do Comunicado</label>
                  <textarea
                    rows={4}
                    className="form-input"
                    value={comunicadoForm.conteudo}
                    onChange={(e) => setComunicadoForm({ ...comunicadoForm, conteudo: e.target.value })}
                    placeholder="Escreva a mensagem completa..."
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-cinza-borda)]">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button
                className="btn btn-primary"
                onClick={
                  activeTab === 'videos' ? handleCreateVideo :
                  activeTab === 'materiais' ? handleCreateMaterial :
                  handleCreateComunicado
                }
              >
                <Save size={16} /> Publicar Conteúdo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
