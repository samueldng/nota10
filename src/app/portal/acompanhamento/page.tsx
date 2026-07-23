'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import UpgradeScreen from '@/components/portal/UpgradeScreen';
import {
  UserCheck, XCircle, Clock, CheckCircle2, AlertTriangle,
  Eye, Heart, Star, FileText, Send, Sparkles, Lock, Award, Loader2, CheckCircle
} from 'lucide-react';

export default function AcompanhamentoPage() {
  const { user } = useAuth();
  const plano = user?.plano || 'padrao';
  const alunoId = user?.alunoId || 'a1';

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchedSuccess, setDispatchedSuccess] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/relatorios/mensal?alunoId=${alunoId}`);
        if (res.ok) {
          const data = await res.json();
          setReportData(data);
        }
      } catch (err) {
        console.error('Erro ao buscar relatório mensal:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [alunoId]);

  const handleDispatchWhatsApp = async () => {
    if (dispatching || dispatchedSuccess || !reportData) return;
    setDispatching(true);
    try {
      const res = await fetch('/api/whatsapp/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alunoId,
          telefone: user?.telefone || '+55 (11) 98888-7777',
          mensagem: `[Nota10 Colégio Militar] Olá! O Parecer Pedagógico Mensal de ${reportData.nomeAluno} referente a ${reportData.mesReferencia} já está disponível. Resumo: ${reportData.parecerPedagogico}`,
          tipo: 'relatorio_mensal'
        })
      });
      if (res.ok) {
        setDispatchedSuccess(true);
      }
    } catch (err) {
      console.error('Erro ao disparar whatsapp:', err);
    } finally {
      setDispatching(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-[var(--color-azul-autoridade)] animate-spin" />
        <p className="text-sm font-semibold text-[var(--color-cinza-texto)]">Analisando indicadores e gerando parecer pedagógico...</p>
      </div>
    );
  }

  // Se o aluno não for Elite (ou plano padrao com eliteLocked), exibe Paywall Inteligente com blur dos indicadores reais
  if (reportData?.eliteLocked || (plano === 'padrao' && !reportData?.elite)) {
    return (
      <UpgradeScreen
        targetPlan="acompanhamento"
        previewContent={
          <div className="space-y-6 opacity-70 filter blur-[2px] pointer-events-none select-none">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="stat-card">
                <div className="stat-icon bg-green-100 text-green-600"><UserCheck size={20} /></div>
                <div>
                  <p className="text-2xl font-black text-green-600">94.5%</p>
                  <p className="text-xs font-bold text-gray-700">Assiduidade</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon bg-blue-100 text-blue-600"><Star size={20} /></div>
                <div>
                  <p className="text-2xl font-black text-blue-600">86.2</p>
                  <p className="text-xs font-bold text-gray-700">Média Simulados</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon bg-purple-100 text-purple-600"><Eye size={20} /></div>
                <div>
                  <p className="text-2xl font-black text-purple-600">100%</p>
                  <p className="text-xs font-bold text-gray-700">Frequência</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon bg-amber-100 text-amber-600"><Award size={20} /></div>
                <div>
                  <p className="text-2xl font-black text-amber-600">8º / 124</p>
                  <p className="text-xs font-bold text-gray-700">Ranking Geral</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border space-y-3">
              <h4 className="font-bold text-gray-800 flex items-center gap-2">
                <FileText className="text-blue-600" /> Parecer Pedagógico Humanizado ({reportData?.mesReferencia || 'Este Mês'})
              </h4>
              <p className="text-sm text-gray-600 italic bg-gray-50 p-4 rounded-xl leading-relaxed">
                {reportData?.parecerPedagogico || 'Parecer pedagógico personalizado disponível para assinantes do Plano Elite...'}
              </p>
            </div>
          </div>
        }
      />
    );
  }

  const ind = reportData?.indicadores || {
    assiduidadeAulas: 0,
    mediaSimulados: 0,
    frequenciaPresencial: 0,
    posicaoRanking: 'N/A'
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header com selo Elite */}
      <div className="bg-gradient-to-r from-[var(--color-azul-autoridade)] to-[var(--color-azul-dark)] rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[var(--color-amarelo-conquista)] text-[var(--color-azul-autoridade)] mb-2 uppercase shadow-sm">
            <Sparkles size={14} /> Assinatura Plano Elite Ativa
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            Acompanhamento & Pareceres
          </h1>
          <p className="text-sm text-white/80 mt-1">
            Análise comportamental, assiduidade e parecer pedagógico automático humanizado.
          </p>
        </div>

        <button
          onClick={handleDispatchWhatsApp}
          disabled={dispatching || dispatchedSuccess}
          className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shrink-0 ${
            dispatchedSuccess
              ? 'bg-emerald-600 text-white cursor-default'
              : dispatching
              ? 'bg-yellow-400 text-[var(--color-azul-marinho)] opacity-80'
              : 'bg-[var(--color-amarelo-conquista)] text-[var(--color-azul-marinho)] hover:bg-yellow-400 cursor-pointer'
          }`}
        >
          {dispatchedSuccess ? (
            <>
              <CheckCircle size={18} /> Notificado via WhatsApp
            </>
          ) : dispatching ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Disparando Fila...
            </>
          ) : (
            <>
              <Send size={18} /> Disparar via WhatsApp
            </>
          )}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in-up">
        <div className="stat-card">
          <div className="stat-icon bg-green-100 text-green-600"><UserCheck size={22} /></div>
          <div>
            <p className="text-2xl font-extrabold text-green-600">{ind.assiduidadeAulas}%</p>
            <p className="text-xs font-bold text-[var(--color-azul-autoridade)] mt-0.5">Assiduidade Aulas</p>
            <p className="text-[10px] text-[var(--color-cinza-texto)]">Videoaulas e Apostila</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-blue-100 text-blue-600"><Star size={22} /></div>
          <div>
            <p className="text-2xl font-extrabold text-blue-600">{ind.mediaSimulados}</p>
            <p className="text-xs font-bold text-[var(--color-azul-autoridade)] mt-0.5">Média Simulados</p>
            <p className="text-[10px] text-[var(--color-cinza-texto)]">Aproveitamento geral</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-purple-100 text-purple-600"><Eye size={22} /></div>
          <div>
            <p className="text-2xl font-extrabold text-purple-600">{ind.frequenciaPresencial}%</p>
            <p className="text-xs font-bold text-[var(--color-azul-autoridade)] mt-0.5">Frequência Presencial</p>
            <p className="text-[10px] text-[var(--color-cinza-texto)]">Encontros no polo</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-amber-100 text-amber-600"><Award size={22} /></div>
          <div>
            <p className="text-xl sm:text-2xl font-extrabold text-amber-600 truncate">{ind.posicaoRanking}</p>
            <p className="text-xs font-bold text-[var(--color-azul-autoridade)] mt-0.5">Classificação</p>
            <p className="text-[10px] text-[var(--color-cinza-texto)]">Em comparação com a turma</p>
          </div>
        </div>
      </div>

      {/* Parecer Pedagógico Humanizado (Destaque Principal) */}
      <div className="card animate-fade-in-up delay-1 border-l-4 border-l-[var(--color-azul-autoridade)] space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-lg font-bold text-[var(--color-azul-autoridade)] flex items-center gap-2">
            <FileText size={22} className="text-[var(--color-amarelo-conquista)]" />
            Parecer Pedagógico Humanizado ({reportData?.mesReferencia || 'Este Mês'})
          </h3>
        </div>

        <div className="bg-[var(--color-cinza-fundo)] p-5 rounded-2xl border border-[var(--color-cinza-borda)] shadow-inner">
          <p className="text-sm md:text-base text-[var(--color-cinza-escuro)] font-medium leading-relaxed italic">
            &ldquo;{reportData?.parecerPedagogico || 'Parecer em processamento. Conclua atividades na Trilha de Estudos para gerar seu relatório personalizado.'}&rdquo;
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-[var(--color-cinza-texto)] pt-2">
          <span>Aluno(a): <strong className="text-[var(--color-azul-autoridade)]">{reportData?.nomeAluno || user?.name || 'Aluno'}</strong></span>
          <span>Data de Emissão: <strong>{reportData?.dataGeracao ? new Date(reportData.dataGeracao).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</strong></span>
        </div>
      </div>

      {/* Atividades e Engajamento detalhado */}
      <div className="card animate-fade-in-up delay-2">
        <h3 className="text-base font-bold text-[var(--color-azul-autoridade)] mb-4 flex items-center gap-2">
          <Star size={18} className="text-[var(--color-amarelo-conquista)]" fill="currentColor" />
          Aproveitamento por Módulo
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(reportData?.aproveitamentoPorModulo && reportData.aproveitamentoPorModulo.length > 0
            ? reportData.aproveitamentoPorModulo
            : [
                { label: 'Videoaulas', value: '0/0', pct: 0, color: '#8B5CF6' },
                { label: 'Revisões', value: '0/0', pct: 0, color: '#22C55E' },
                { label: 'Fixação', value: '0/0', pct: 0, color: '#3B82F6' },
                { label: 'Simulados', value: '0/0', pct: 0, color: '#F59E0B' },
              ]
          ).map((a: any) => (
            <div key={a.label} className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-2">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={a.color} strokeWidth="3" strokeDasharray={`${a.pct}, 100`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-[var(--color-azul-autoridade)]">{a.pct}%</span>
              </div>
              <p className="text-xs font-bold text-[var(--color-cinza-escuro)]">{a.value}</p>
              <p className="text-[10px] text-[var(--color-cinza-texto)]">{a.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
