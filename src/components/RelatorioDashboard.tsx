'use client';

import { useEffect } from 'react';
import { motion, animate, useMotionValue, useTransform } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line
} from 'recharts';
import { Trophy, Users, Star, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

type Kpis = {
  xpSemana: number;
  taxaAssiduidade: number;
};

type TurmaXP = { name: string; xp: number; }[];
type Distribuicao = { name: string; value: number; }[];
type Presencas = { date: string; Presente: number; Falta: number; }[];

// Componente utilitário para animação de contagem fluida
function AnimatedCounter({ value, suffix = "" }: { value: number, suffix?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString() + suffix);

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.5, ease: "easeOut" });
    return controls.stop;
  }, [value, count]);

  return <motion.span>{rounded}</motion.span>;
}

// Cores estilizadas para o Donut Chart
const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

export default function RelatorioDashboard({ 
  kpis, 
  turmaXP, 
  distribuicao, 
  presencas 
}: { 
  kpis: Kpis, 
  turmaXP: TurmaXP, 
  distribuicao: Distribuicao, 
  presencas: Presencas 
}) {
  
  // Formatador de Datas para o XAxis do LineChart
  const formatXAxisDate = (tickItem: string) => {
    if (!tickItem) return '';
    try {
      return format(parseISO(tickItem), 'dd/MM');
    } catch {
      return tickItem;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 🏆 O KPI Dourado (Destaque Máximo) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden flex flex-col justify-between min-h-[140px]"
        >
          {/* 1. MARCA D'ÁGUA (BACKGROUND) - Posicionada no fundo à direita */}
          <div className="absolute -right-4 -bottom-4 pointer-events-none select-none z-0">
            <Trophy className="w-36 h-36 text-gray-900 opacity-[0.05]" />
          </div>

          {/* 2. CONTEÚDO PRINCIPAL (FOREGROUND) - z-10 garante que o texto fique ACIMA de tudo */}
          <div className="relative z-10">
            <div className="flex items-center">
              <span className="shrink-0 mr-2 flex items-center justify-center">
                <Star size={16} className="text-[var(--color-azul-primario)]" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                XP Global Gerado na Semana
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-gray-900 tracking-tight">
                <AnimatedCounter value={kpis.xpSemana} />
              </span>
              <span className="text-lg font-bold text-gray-400">XP</span>
            </div>
          </div>

          {/* Subtítulo no rodapé do Card */}
          <div className="relative z-10 mt-2">
            <p className="text-xs font-medium text-gray-400">
              Ritmo de produção dos últimos 7 dias
            </p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden flex flex-col justify-between min-h-[140px]"
        >
          {/* 1. MARCA D'ÁGUA (BACKGROUND) - Posicionada no fundo à direita */}
          <div className="absolute -right-4 -bottom-4 pointer-events-none select-none z-0">
            <Users className="w-36 h-36 text-gray-900 opacity-[0.05]" />
          </div>

          {/* 2. CONTEÚDO PRINCIPAL (FOREGROUND) - z-10 garante que o texto fique ACIMA de tudo */}
          <div className="relative z-10">
            <div className="flex items-center">
              <span className="shrink-0 mr-2 flex items-center justify-center">
                <Calendar size={16} className="text-emerald-500" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Taxa de Assiduidade Ativa
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-gray-900 tracking-tight">
                <AnimatedCounter value={kpis.taxaAssiduidade} suffix="%" />
              </span>
            </div>
          </div>

          {/* Subtítulo no rodapé do Card */}
          <div className="relative z-10 mt-2">
            <p className="text-xs font-medium text-gray-400">
              Presenças vs. faltas no mês corrente
            </p>
          </div>
        </motion.div>
        
      </div>

      {/* Grid de Gráficos Analíticos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico 1: XP por Turma (Barras) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-800">Ranking de Turmas</h3>
            <p className="text-sm text-slate-500">Volume de XP Acumulado por Turma</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={turmaXP} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="xp" fill="var(--color-azul-primario)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Gráfico 2: Distribuição de Desempenho (Donut) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
        >
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-800">Qualidade Pedagógica</h3>
            <p className="text-sm text-slate-500">Distribuição qualitativa de desempenho</p>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center">
            {distribuicao.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribuicao}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {distribuicao.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-sm">Sem dados suficientes para gerar gráfico.</p>
            )}
          </div>
        </motion.div>

        {/* Gráfico 3: Curva de Presenças (Linhas) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2"
        >
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-800">Tendência de Presenças vs. Faltas</h3>
            <p className="text-sm text-slate-500">Evolução de assiduidade temporal</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={presencas} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickFormatter={formatXAxisDate} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <RechartsTooltip labelFormatter={(label) => formatXAxisDate(label)} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="Presente" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Falta" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
