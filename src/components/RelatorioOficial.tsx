'use client';

import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';

interface RelatorioOficialProps {
  alunoSelecionado: {
    nome: string;
    matricula: string;
    turma: string;
    acompanhamento: string;
  };
  registrosLancados: any[];
}

export function RelatorioOficial({ alunoSelecionado, registrosLancados }: RelatorioOficialProps) {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Relatorio_${alunoSelecionado?.nome || 'Aluno'}`,
  });

  // Processamento dinâmico dos dados reais vindos do PostgreSQL
  const registros = registrosLancados || [];
  const totalPresencas = registros.filter(r => r.presenca === 'presente' || r.presenca === 'Presente').length;
  const totalFaltas = registros.filter(r => r.presenca === 'faltou' || r.presenca === 'Faltou' || r.presenca === 'Falta').length;

  // Função auxiliar para converter strings (Excelente, Bom, Regular, Ruim) em números 0-10 para os gráficos
  const mapearNota = (valor: string) => {
    if (!valor) return 0;
    const l = valor.toLowerCase();
    if (l === 'excelente') return 10;
    if (l === 'bom') return 8;
    if (l === 'regular') return 6;
    if (l === 'ruim') return 4;
    const num = Number(valor);
    return isNaN(num) ? 0 : num;
  };

  // Preparando dados para os gráficos
  const dadosGraficos = registros.map(r => ({
    ...r,
    fixacaoNum: mapearNota(r.fixacao)
  }));

  return (
    <div className="flex flex-col items-center pb-12 bg-gray-100 min-h-screen pt-8">
      
      {/* Barra de Ação */}
      <div className="w-[210mm] flex justify-end mb-4 print:hidden">
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-2 bg-blue-900 text-white font-bold rounded-md hover:bg-blue-800 transition-colors shadow-md"
        >
          <Printer className="w-5 h-5" />
          Imprimir Relatório Oficial (A4)
        </button>
      </div>

      {/* Folha A4 Oficial */}
      <div 
        ref={componentRef}
        className="w-[210mm] min-h-[297mm] bg-white text-black p-8 shadow-2xl print:shadow-none print:m-0 print:p-8"
        style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
      >
        
        {/* CABEÇALHO COM O LOGO OFICIAL DA PASTA PUBLIC */}
        <div className="flex justify-between items-center mb-6 border-b-2 border-blue-900 pb-4">
          <div className="w-48 h-14 relative flex items-center">
            {/* Substitua '/logo-nota10.png' pelo nome exato do ficheiro que está na sua pasta public */}
            <img 
              src="/logo-nota10.png" 
              alt="Nota 10 Educacional" 
              className="max-h-12 w-auto object-contain object-left"
            />
          </div>
          
          <div className="text-right">
            <h1 className="text-sm font-bold uppercase tracking-wide text-gray-700">Relatório Analítico de Desempenho</h1>
            <div className="mt-2 flex gap-4">
              <div className="bg-gray-100 px-3 py-1 rounded text-xs">
                <span className="font-bold mr-1">TURMA:</span> {alunoSelecionado?.turma || 'Não definida'}
              </div>
              <div className="bg-gray-100 px-3 py-1 rounded text-xs">
                <span className="font-bold mr-1">ALUNO:</span> {alunoSelecionado?.nome || 'Selecione um aluno'}
              </div>
            </div>
          </div>
        </div>

        {/* MÉTRICAS REAIS DA BASE DE DADOS */}
        <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h2 className="text-blue-900 font-bold uppercase mb-2 text-xs">Resumo Transacional do Período</h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <p>✅ <strong>Presenças Registradas:</strong> {totalPresencas}</p>
            <p>❌ <strong>Faltas Registradas:</strong> {totalFaltas}</p>
            <p>📊 <strong>Total de Aulas Analisadas:</strong> {registros.length}</p>
          </div>
        </div>

        {/* MALHA DE GRÁFICOS COM ALTURA FORÇADA (Garante render na web e impressão) */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border border-gray-200 rounded p-3 bg-white">
            <h3 className="text-center text-xs font-bold text-gray-600 mb-2">Desempenho por Disciplina (Fixação)</h3>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGraficos}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="disciplina" tick={{fontSize: 10}} />
                  <YAxis domain={[0, 10]} tick={{fontSize: 10}} />
                  <Tooltip />
                  <Bar dataKey="fixacaoNum" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-gray-200 rounded p-3 bg-white">
            <h3 className="text-center text-xs font-bold text-gray-600 mb-2">Evolução Temporal (Fixação)</h3>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dadosGraficos}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="data" tick={{fontSize: 10}} />
                  <YAxis domain={[0, 10]} tick={{fontSize: 10}} />
                  <Tooltip />
                  <Line type="monotone" dataKey="fixacaoNum" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* PARECER E OBSERVAÇÕES REAIS */}
        <div className="space-y-4">
          <div className="border-t pt-4">
            <h3 className="font-bold text-xs uppercase text-blue-900 mb-2">Observações Registradas em Aula</h3>
            {registros.length === 0 ? (
              <p className="text-xs text-gray-500 italic">Nenhum registo encontrado para os filtros selecionados.</p>
            ) : (
              <ul className="list-disc pl-4 text-xs space-y-1 text-gray-700">
                {registros.map((reg, idx) => (
                  <li key={idx}>
                    <strong>{reg.data} ({reg.disciplina}):</strong> {(Array.isArray(reg.observacoes) ? reg.observacoes.join(', ') : reg.observacoes) || 'Nenhuma observação marcada.'}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
