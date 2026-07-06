'use client';

import { useState, useEffect } from 'react';
import {
  Plus, PlayCircle, FileText, Megaphone, Trash2, Save, X, Link as LinkIcon,
  Upload, CheckCircle, Info, AlertTriangle, Bell, Lock, Globe,
} from 'lucide-react';

export default function PainelConteudoAdminPage() {
  const [activeTab, setActiveTab] = useState<'videos' | 'materiais' | 'comunicados'>('videos');
  const [showModal, setShowModal] = useState(false);

  // List states
  const [videoList, setVideoList] = useState<any[]>([]);
  const [materialList, setMaterialList] = useState<any[]>([]);
  const [comunicadoList, setComunicadoList] = useState<any[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);

  // Form states
  const [videoForm, setVideoForm] = useState({
    titulo: '',
    disciplina: 'Português',
    bloco: 'Bloco 1',
    duracao: '15:00',
    videoSource: 'youtube' as 'youtube' | 'local',
    videoUrl: '',
    localFileName: '',
    turmaId: 'todas',
  });

  const [materialForm, setMaterialForm] = useState({
    titulo: '',
    tipo: 'apostila' as any,
    turmaId: 'todas',
    tamanho: '5.2 MB',
    urlAcesso: '',
  });

  const [comunicadoForm, setComunicadoForm] = useState({
    titulo: '',
    conteudo: '',
    tipo: 'informativo' as any,
    turmaTarget: 'todas',
  });

  // Load data from DB APIs
  const refreshData = async () => {
    try {
      const resVideos = await fetch('/api/conteudos?tipoConteudo=videoaula');
      if (resVideos.ok) {
        const data = await resVideos.json();
        setVideoList(Array.isArray(data) ? data : []);
      }

      const resMateriais = await fetch('/api/conteudos?tipoConteudo=pdf');
      if (resMateriais.ok) {
        const data = await resMateriais.json();
        setMaterialList(Array.isArray(data) ? data : []);
      }

      const resComunicados = await fetch('/api/comunicados');
      if (resComunicados.ok) {
        const data = await resComunicados.json();
        setComunicadoList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro ao buscar dados do banco:', err);
    }
  };

  useEffect(() => {
    refreshData();
    // Fetch actual classes
    fetch('/api/turmas')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTurmas(data);
        }
      })
      .catch(err => console.error('Erro ao buscar turmas:', err));
  }, []);

  const handleOpenAddModal = () => {
    setShowModal(true);
  };

  const handleCreateVideo = async () => {
    if (!videoForm.titulo) return;

    try {
      const extra = {
        bloco: videoForm.bloco,
        duracao: videoForm.duracao,
        xp: 15,
        videoSource: videoForm.videoSource,
        thumbnailColor: videoForm.disciplina === 'Português' ? '#8B5CF6' : '#F59E0B'
      };

      const urlAcesso = videoForm.videoSource === 'youtube' ? videoForm.videoUrl : videoForm.localFileName || 'aula_local.mp4';

      const postVideo = async (tId: string) => {
        const body = {
          turmaId: tId,
          tipoConteudo: 'videoaula',
          titulo: videoForm.titulo,
          descricao: JSON.stringify(extra),
          urlAcesso,
          disciplina: videoForm.disciplina,
          dataDisponibilizacao: new Date().toISOString().split('T')[0],
          status: true,
        };

        const res = await fetch('/api/conteudos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          throw new Error('Falha ao cadastrar vídeo');
        }
      };

      if (videoForm.turmaId === 'todas') {
        for (const t of turmas) {
          await postVideo(t.id);
        }
      } else {
        await postVideo(videoForm.turmaId);
      }

      await refreshData();
      setShowModal(false);
      setVideoForm({
        titulo: '',
        disciplina: 'Português',
        bloco: 'Bloco 1',
        duracao: '15:00',
        videoSource: 'youtube',
        videoUrl: '',
        localFileName: '',
        turmaId: 'todas',
      });
    } catch (err: any) {
      console.error(err);
      alert('Erro ao criar videoaula: ' + err.message);
    }
  };

  const handleCreateMaterial = async () => {
    if (!materialForm.titulo) return;

    try {
      const extra = {
        tipo: materialForm.tipo,
        tamanho: materialForm.tamanho
      };

      const postMaterial = async (tId: string) => {
        const body = {
          turmaId: tId,
          tipoConteudo: 'pdf',
          titulo: materialForm.titulo,
          descricao: JSON.stringify(extra),
          urlAcesso: materialForm.urlAcesso || materialForm.titulo + '.pdf',
          disciplina: materialForm.tipo === 'combinados' ? 'Geral' : 'Revisão',
          dataDisponibilizacao: new Date().toISOString().split('T')[0],
          status: true,
        };

        const res = await fetch('/api/conteudos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          throw new Error('Falha ao cadastrar material');
        }
      };

      if (materialForm.turmaId === 'todas') {
        for (const t of turmas) {
          await postMaterial(t.id);
        }
      } else {
        await postMaterial(materialForm.turmaId);
      }

      await refreshData();
      setShowModal(false);
      setMaterialForm({
        titulo: '',
        tipo: 'apostila',
        turmaId: 'todas',
        tamanho: '5.2 MB',
        urlAcesso: '',
      });
    } catch (err: any) {
      console.error(err);
      alert('Erro ao criar material: ' + err.message);
    }
  };

  const handleCreateComunicado = async () => {
    if (!comunicadoForm.titulo || !comunicadoForm.conteudo) return;

    try {
      const body = {
        turmaId: comunicadoForm.turmaTarget === 'todas' ? null : comunicadoForm.turmaTarget,
        titulo: comunicadoForm.titulo,
        tipoCriticidade: comunicadoForm.tipo,
        descricao: comunicadoForm.conteudo,
        dataPublicacao: new Date().toISOString().split('T')[0],
        status: true,
      };

      const res = await fetch('/api/comunicados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error('Falha ao cadastrar comunicado');
      }

      await refreshData();
      setShowModal(false);
      setComunicadoForm({
        titulo: '',
        conteudo: '',
        tipo: 'informativo',
        turmaTarget: 'todas',
      });
    } catch (err: any) {
      console.error(err);
      alert('Erro ao criar comunicado: ' + err.message);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta videoaula?')) return;
    try {
      const res = await fetch(`/api/conteudos?id=${id}`, { method: 'DELETE' });
      if (res.ok) refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('Deseja realmente excluir este material?')) return;
    try {
      const res = await fetch(`/api/conteudos?id=${id}`, { method: 'DELETE' });
      if (res.ok) refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComunicado = async (id: string) => {
    if (!confirm('Deseja realmente excluir este comunicado?')) return;
    try {
      const res = await fetch(`/api/comunicados?id=${id}`, { method: 'DELETE' });
      if (res.ok) refreshData();
    } catch (err) {
      console.error(err);
    }
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
                  <th>Turma</th>
                  <th className="text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {videoList.map((vid) => {
                  let extra = { bloco: 'Bloco 1', duracao: '15:00', videoSource: 'youtube' };
                  if (vid.descricao) {
                    try {
                      extra = { ...extra, ...JSON.parse(vid.descricao) };
                    } catch (e) {}
                  }
                  return (
                    <tr key={vid.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <PlayCircle size={18} className="text-[var(--color-azul-autoridade)]" />
                          <span className="font-semibold">{vid.titulo}</span>
                        </div>
                      </td>
                      <td>{vid.disciplina}</td>
                      <td><span className="badge badge-info">{extra.bloco}</span></td>
                      <td>
                        <span className={`badge ${extra.videoSource === 'youtube' ? 'badge-warning' : 'badge-success'}`}>
                          {extra.videoSource === 'youtube' ? 'YouTube' : 'Arquivo Local'}
                        </span>
                      </td>
                      <td className="max-w-[200px] truncate text-xs font-mono text-[var(--color-cinza-texto)]">
                        {vid.urlAcesso}
                      </td>
                      <td>{extra.duracao}</td>
                      <td>
                        <span className="font-bold text-xs">
                          {turmas.find(t => t.id === vid.turmaId)?.nome || 'Carregando...'}
                        </span>
                      </td>
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
                  );
                })}
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
                {materialList.map((mat) => {
                  let extra = { tipo: 'apostila', tamanho: '5.2 MB' };
                  if (mat.descricao) {
                    try {
                      extra = { ...extra, ...JSON.parse(mat.descricao) };
                    } catch (e) {}
                  }
                  return (
                    <tr key={mat.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <FileText size={18} className="text-[var(--color-azul-autoridade)]" />
                          <span className="font-semibold">{mat.titulo}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-info uppercase text-[10px]">{extra.tipo}</span>
                      </td>
                      <td>{extra.tamanho}</td>
                      <td>
                        <span className="font-bold text-xs">
                          {turmas.find(t => t.id === mat.turmaId)?.nome || 'Todas'}
                        </span>
                      </td>
                      <td>{mat.dataDisponibilizacao ? new Date(mat.dataDisponibilizacao).toLocaleDateString('pt-BR') : ''}</td>
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
                  );
                })}
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
                  <th>Turma Alvo</th>
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
                        com.tipoCriticidade === 'urgente' ? 'badge-error' :
                        com.tipoCriticidade === 'aviso' ? 'badge-warning' :
                        'badge-info'
                      }`}>
                        {com.tipoCriticidade}
                      </span>
                    </td>
                    <td className="max-w-md truncate text-xs text-[var(--color-cinza-texto)]">
                      {com.descricao}
                    </td>
                    <td>
                      <span className="font-bold text-xs">
                        {com.turmaId ? (turmas.find(t => t.id === com.turmaId)?.nome || 'Carregando...') : 'Todas'}
                      </span>
                    </td>
                    <td>{com.dataPublicacao ? new Date(com.dataPublicacao).toLocaleDateString('pt-BR') : ''}</td>
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

                <div className="form-group">
                  <label className="form-label">Turma Alvo</label>
                  <select
                    className="form-select"
                    value={videoForm.turmaId}
                    onChange={(e) => setVideoForm({ ...videoForm, turmaId: e.target.value })}
                  >
                    <option value="todas">Todas as turmas</option>
                    {turmas.map(t => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                  </select>
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
                    {turmas.map(t => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label flex items-center gap-1">
                    <LinkIcon size={12} /> URL de Acesso (Google Drive / OneDrive)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={materialForm.urlAcesso}
                    onChange={(e) => setMaterialForm({ ...materialForm, urlAcesso: e.target.value })}
                    placeholder="https://drive.google.com/file/d/... ou https://onedrive.live.com/..."
                  />
                  <p className="text-[10px] text-[var(--color-cinza-texto)] mt-1">
                    Cole o link compartilhável do PDF. Se vazio, será gerado automaticamente.
                  </p>
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
                      {turmas.map(t => (
                        <option key={t.id} value={t.id}>{t.nome}</option>
                      ))}
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
