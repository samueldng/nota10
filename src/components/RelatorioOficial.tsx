'use client';

import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, ComposedChart, LabelList, Legend
} from 'recharts';

// Cores extraídas do seu Design System
const CORES = {
  azulEscuro: '#1e3a8a',
  azulClaro: '#60a5fa',
  azulPrimario: '#3b82f6',
  amarelo: '#fde047',
  amareloForte: '#eab308',
  verdeForte: '#22c55e',
  verdeClaro: '#86efac',
  vermelhoForte: '#ef4444',
  laranjaForte: '#f97316',
};

// MOCK DE DADOS (Apenas para segurar o layout até a integração com o PostgreSQL)
const mockDesempenhoPt = [
  { bloco: 'Simulado', nota: 3, tendencia: 3 },
  { bloco: 'Bloco VI', nota: 4, tendencia: 4.5 },
  { bloco: 'Bloco VII', nota: 8, tendencia: 6 },
  { bloco: 'Bloco VIII', nota: 6, tendencia: 7 },
  { bloco: 'Bloco IX', nota: 9, tendencia: 8 },
  { bloco: 'Bloco X', nota: 7, tendencia: 9 },
];

const mockDesempenhoMat = [
  { bloco: 'Simulado', nota: 5, tendencia: 5 },
  { bloco: 'Bloco VI', nota: 6, tendencia: 5.5 },
  { bloco: 'Bloco VII', nota: 5, tendencia: 6 },
  { bloco: 'Bloco VIII', nota: 4, tendencia: 6.5 },
  { bloco: 'Bloco IX', nota: 7, tendencia: 7 },
  { bloco: 'Bloco X', nota: 8, tendencia: 7.5 },
];

const mockParticipacao = [
  { data: '13/05/2026', participacao: 5, comportamento: 5 },
  { data: '20/05/2026', participacao: 2, comportamento: 5 },
  { data: '27/05/2026', participacao: 3, comportamento: 5 },
  { data: '03/06/2026', participacao: 3, comportamento: 5 },
  { data: '10/06/2026', participacao: 3, comportamento: 5 },
  { data: '17/06/2026', participacao: 3, comportamento: 5 },
];

const mockPreAula = [
  { name: 'Videoaula', value: 91.67, fill: CORES.azulClaro },
  { name: 'Palavra-Chave', value: 91.67, fill: CORES.verdeClaro },
  { name: 'Fixação', value: 108.08, fill: '#fcd34d' },
];

const mockAtencao = [
  { name: 'Atento', value: 100, fill: CORES.azulPrimario }
];

const mockPontualidade = [
  { name: 'Pontual', value: 90, fill: CORES.azulPrimario },
  { name: 'Atraso', value: 10, fill: CORES.amareloForte }
];

const formatPercent = (value: number) => `${value.toFixed(2).replace('.', ',')}%`;

export function RelatorioOficial({ dadosGerais, parecerIA }: any) {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Relatorio_Brunna_Mirelly`,
  });

  return (
    <div className="flex flex-col items-center pb-12 bg-gray-100 min-h-screen pt-8">
      
      {/* Action Bar (Não sai na impressão) */}
      <div className="w-[210mm] flex justify-end mb-4 print:hidden">
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-2 bg-[var(--color-azul-autoridade)] text-white font-bold rounded-md hover:bg-blue-800 transition-colors shadow-md"
        >
          <Printer className="w-5 h-5" />
          Imprimir Relatório (A4)
        </button>
      </div>

      {/* 
        FOLHA A4 - CONTAINER PRINCIPAL 
      */}
      <div 
        ref={componentRef}
        className="w-[210mm] min-h-[297mm] bg-white text-black p-8 shadow-2xl print:shadow-none print:m-0 print:p-8"
        style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
      >
        
        {/* CABEÇALHO */}
        <div className="flex justify-between items-start mb-6">
          <div className="w-48 relative h-16">
            {/* Fallback de logo se a imagem não existir */}
            <div className="text-4xl font-black text-blue-600 tracking-tighter">NOTA <span className="text-yellow-400">10</span></div>
            <div className="text-xs font-bold tracking-widest text-blue-900 mt-[-4px]">EDUCACIONAL</div>
          </div>
          
          <div className="text-right">
            <h1 className="text-xl font-bold uppercase tracking-wide">Relatório Mensal: Maio - Junho - 2026</h1>
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded">
                <span className="font-bold text-sm w-16 text-left">TURMA</span>
                <span className="text-sm font-semibold">T5</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded">
                <span className="font-bold text-sm w-16 text-left">ALUNO</span>
                <span className="text-sm font-semibold">Brunna Mirelly</span>
              </div>
            </div>
          </div>
        </div>

        {/* RESUMO PEDAGÓGICO */}
        <div className="mb-4">
          <h2 className="text-blue-900 font-bold uppercase mb-2 text-sm">Relatório Pedagógico - PRÉ CMT</h2>
          <p className="text-[10px] mb-2 font-semibold">Segue o resumo da aluna Brunna Mirelly nos registros analisados:</p>
          <div className="text-[10px] leading-tight space-y-0.5 mb-2">
            <p>✅ <strong>Presenças registradas:</strong> 12</p>
            <p>❌ <strong>Faltas registradas:</strong> 0</p>
            <p>📊 <strong>Média geral do período:</strong> 6,0 / 10</p>
            <p>📝 <strong>Média considerando os encontros em que esteve presente:</strong> 6,0 / 10</p>
            <p>👁️ <strong>Atenção:</strong> Boa e estável em todo o período</p>
            <p>🗣️ <strong>Participação:</strong> Baixa a mediana no geral, com melhor nível apenas no simulado</p>
            <p>🤝 <strong>Comportamento:</strong> Excelente em todos os encontros presenciais</p>
            <p>🏠 <strong>Rotina acadêmica:</strong> Boa no geral, com execução completa na maior parte do período e quebra pontual no Bloco IX</p>
            <p>⚠️ <strong>Ponto de atenção:</strong> Rendimento abaixo do esperado, principalmente em Matemática, com maior necessidade de reforço em Frações, Medidas, Área e Volume.</p>
            <p>⏰ <strong>Pontualidade dos pais:</strong> Boa no geral, com atraso pontual em Matemática Bloco VII</p>
          </div>
          <p className="text-[10px] text-justify leading-snug font-medium mt-2">
            A Brunna Mirelly manteve boa presença, atenção estável e comportamento muito positivo durante todo o período. O principal ponto de atenção não está em postura de sala, mas no rendimento acadêmico, que oscilou bastante, principalmente em Matemática. Em Português, houve evolução mais clara do que em Matemática, com destaque para um bom resultado no Bloco IX. Em Matemática, o processo ainda exige mais consolidação de base, interpretação e aplicação prática dos conteúdos.
          </p>
        </div>

        {/* GRÁFICOS */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          
          {/* LINHA 1: Desempenho PT e MAT */}
          <div className="border border-gray-200 rounded p-2 flex flex-col h-44">
            <h3 className="text-center text-xs font-bold text-gray-500 mb-1">Desempenho Português</h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={mockDesempenhoPt} margin={{top: 10, right: 5, left: -25, bottom: 0}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="bloco" tick={{fontSize: 8}} interval={0} />
                  <YAxis domain={[0, 10]} tick={{fontSize: 8}} ticks={[1,2,3,4,5,6,7,8,9,10]} />
                  <Tooltip />
                  <Bar dataKey="nota" fill={CORES.azulClaro} barSize={25}>
                    <LabelList dataKey="nota" position="top" fontSize={8} />
                  </Bar>
                  <Line type="monotone" dataKey="tendencia" stroke={CORES.vermelhoForte} strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[8px] text-center mt-1 text-gray-400">Português</div>
          </div>

          <div className="border border-gray-200 rounded p-2 flex flex-col h-44">
            <h3 className="text-center text-xs font-bold text-gray-500 mb-1">Desempenho Matemática</h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={mockDesempenhoMat} margin={{top: 10, right: 5, left: -25, bottom: 0}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="bloco" tick={{fontSize: 8}} interval={0} />
                  <YAxis domain={[0, 10]} tick={{fontSize: 8}} ticks={[1,2,3,4,5,6,7,8,9,10]} />
                  <Tooltip />
                  <Bar dataKey="nota" fill={CORES.amarelo} barSize={25}>
                    <LabelList dataKey="nota" position="top" fontSize={8} />
                  </Bar>
                  <Line type="monotone" dataKey="tendencia" stroke={CORES.vermelhoForte} strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[8px] text-center mt-1 text-gray-400">Matemática</div>
          </div>

          {/* LINHA 2: Participação e Comportamento / Pré-Aula */}
          <div className="border border-gray-200 rounded p-2 flex flex-col h-44">
            <h3 className="text-center text-xs font-bold text-gray-500 mb-0">Participação e Comportamento</h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockParticipacao} margin={{top: 5, right: 5, left: -25, bottom: 10}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="data" tick={{fontSize: 7}} interval={0} angle={-15} textAnchor="end" />
                  <YAxis domain={[0, 5]} tick={{fontSize: 8}} ticks={[0,1,2,3,4,5]} />
                  <Tooltip />
                  <Legend iconType="plainline" iconSize={12} wrapperStyle={{fontSize: '9px'}} />
                  <Line type="monotone" dataKey="participacao" name="Participação" stroke={CORES.azulPrimario} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="comportamento" name="Comportamento" stroke={CORES.vermelhoForte} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[8px] text-center mt-[-10px] text-gray-400">DATA</div>
          </div>

          <div className="border border-gray-200 rounded p-2 flex flex-col h-44">
            <h3 className="text-center text-xs font-bold text-gray-500 mb-1">Pré-Aula em Casa</h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockPreAula} margin={{top: 15, right: 5, left: -15, bottom: 0}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 8}} interval={0} />
                  <YAxis domain={[0, 100]} tick={{fontSize: 8}} tickFormatter={(v) => `${v}%`} ticks={[0, 25, 50, 75, 100]} />
                  <Tooltip formatter={(value: any) => formatPercent(Number(value))} />
                  <Bar dataKey="value" barSize={40}>
                    {mockPreAula.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    <LabelList dataKey="value" position="top" formatter={(v: any) => formatPercent(Number(v))} fontSize={8} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* LINHA 3: Atenção em Aula / Pontualidade */}
          <div className="border border-gray-200 rounded p-2 flex flex-col h-32">
            <h3 className="text-center text-xs font-bold text-gray-500 mb-0">Atenção em Aula</h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={mockAtencao} cx="50%" cy="50%" outerRadius={35} innerRadius={0} dataKey="value" stroke="none">
                    {mockAtencao.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{fontSize: '9px'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-gray-200 rounded p-2 flex flex-col h-32">
            <h3 className="text-center text-xs font-bold text-gray-500 mb-0">Pontualidade pais</h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={mockPontualidade} cx="50%" cy="50%" outerRadius={35} innerRadius={0} dataKey="value" stroke="none">
                    {mockPontualidade.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{fontSize: '9px'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* PARECER IA - DUAS COLUNAS */}
        <div className="grid grid-cols-2 gap-4 mt-2">
          
          {/* COLUNA PORTUGUÊS */}
          <div>
            <div className="bg-gray-100 text-center font-black py-1 uppercase text-sm border-b-4 border-blue-900 mb-1">Português</div>
            
            <div className="mb-1 border-b border-green-200 pb-1">
              <h4 className="text-green-600 font-bold text-[9px] text-center uppercase mb-0.5">Pontos Fortes</h4>
              <ul className="list-disc pl-3 text-[8px] leading-tight space-y-0.5">
                <li>Em Língua Portuguesa Bloco VII — Leitura, compreensão e interpretação textual; elementos da estrutura narrativa; discurso direto e indireto, teve nota 8 e acertou 11 de 15 questões.</li>
                <li>Em Língua Portuguesa Bloco IX — Gêneros textuais II: causo, contos e minicontos, crônicas, textos dramáticos, poemas visuais e concretos e verbete de dicionário, teve nota 9 e acertou 18 de 21 questões.</li>
                <li>Em Língua Portuguesa Bloco X — Sujeito e predicado; concordância nominal e verbal, teve nota 7.</li>
                <li>Mesmo com oscilações, mostrou avanço claro em comparação ao simulado acumulado.</li>
                <li>Manteve atenção adequada e comportamento excelente em todos os encontros de Português.</li>
              </ul>
            </div>

            <div>
              <h4 className="text-red-600 font-bold text-[9px] text-center uppercase mb-0.5">Pontos a Melhorar</h4>
              <ul className="list-disc pl-3 text-[8px] leading-tight space-y-0.5">
                <li>No simulado acumulado dos Blocos I a V, teve nota 3 e acertou apenas 6 de 20 questões.</li>
                <li>Em Língua Portuguesa Bloco VI — Pontuação, teve nota 4 e acertou 6 de 17 questões.</li>
                <li>Em Língua Portuguesa Bloco VIII — Gêneros textuais I: fábula, anedota, cartum, história em quadrinhos e carta pessoal, teve nota 6 e acertou 8 de 16 questões.</li>
                <li>No Bloco IX, a rotina acadêmica veio apenas pela metade em videoaula e palavra-chave, embora o rendimento tenha sido bom.</li>
                <li>O principal ajuste em Português está em transformar os bons momentos de desempenho em constância ao longo de todos os blocos.</li>
              </ul>
            </div>
          </div>

          {/* COLUNA MATEMÁTICA */}
          <div>
            <div className="bg-gray-100 text-center font-black py-1 uppercase text-sm border-b-4 border-yellow-400 mb-1">Matemática</div>
            
            <div className="mb-1 border-b border-green-200 pb-1">
              <h4 className="text-green-600 font-bold text-[9px] text-center uppercase mb-0.5">Pontos Fortes</h4>
              <ul className="list-disc pl-3 text-[8px] leading-tight space-y-0.5">
                <li>No simulado acumulado dos Blocos I a V, teve nota 5 e acertou 10 de 20 questões.</li>
                <li>Em Matemática Bloco VI — Frações: conceito e equivalência; representação, frações equivalentes e simplificação, teve nota 6 e acertou 8 de 14 questões.</li>
                <li>Em Matemática Bloco IX — Medidas de tempo e comprimento: unidades de tempo e medidas métricas, teve nota 7 e a observação mostra que assimilou melhor medidas de tempo.</li>
                <li>Em Matemática Bloco X — Áreas, sólidos geométricos e volume: área de figuras planas, sólidos e volume, teve nota 8.</li>
                <li>Mesmo com dificuldades, permaneceu no processo e manteve bom comportamento em toda a sequência.</li>
              </ul>
            </div>

            <div>
              <h4 className="text-red-600 font-bold text-[9px] text-center uppercase mb-0.5">Pontos a Melhorar</h4>
              <ul className="list-disc pl-3 text-[8px] leading-tight space-y-0.5">
                <li>Em Matemática Bloco VII — Frações: comparação e operações; comparar, ordenar e resolver operações com frações, teve nota 5, e a observação registra dificuldade no conteúdo.</li>
                <li>Em Matemática Bloco VIII — Geometria plana, ângulos e raciocínio lógico: figuras planas, polígonos, ângulos e perímetro, teve nota 4 e acertou apenas 5 de 15 questões.</li>
                <li>Em Matemática Bloco IX — Medidas de tempo e comprimento, a observação registra dificuldade maior em medidas de comprimento.</li>
                <li>No Bloco IX, a rotina acadêmica veio apenas pela metade em videoaula e palavra-chave.</li>
                <li>Em Matemática Bloco X — Áreas, sólidos geométricos e volume, a observação registra dificuldade em área do trapézio e em transformação de volume.</li>
                <li>O principal ponto de atenção em Matemática está na base, na interpretação e na aplicação dos procedimentos.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* RODAPÉ ESTRATÉGICO */}
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="bg-orange-400 text-white p-2 h-full">
             <h4 className="font-bold text-[9px] text-center uppercase mb-0.5">O Que Fazer:</h4>
             <ul className="list-disc pl-3 text-[8px] leading-tight space-y-0.5">
                <li>Revisar o simulado acumulado dos Blocos I a V, principalmente em Português.</li>
                <li>Reforçar Língua Portuguesa Bloco VI — Pontuação.</li>
                <li>Reforçar Língua Portuguesa Bloco VIII — Gêneros textuais I.</li>
                <li>Manter o bom trabalho em Língua Portuguesa Bloco IX — Gêneros textuais II, buscando transformar esse resultado em constância.</li>
                <li>Reforçar Matemática Bloco VII — Frações: comparação e operações.</li>
                <li>Reforçar Matemática Bloco VIII — Geometria plana, ângulos e raciocínio lógico.</li>
                <li>Reforçar Matemática Bloco IX — Medidas de tempo e comprimento, principalmente medidas de comprimento.</li>
              </ul>
          </div>
          <div className="bg-orange-400 text-white p-2 h-full">
             <h4 className="font-bold text-[9px] text-center uppercase mb-0.5">Ajuste de Rotina Recomendado:</h4>
             <ul className="list-disc pl-3 text-[8px] leading-tight space-y-0.5">
                <li>Manter presença em todos os encontros do próximo bloco.</li>
                <li>Continuar fazendo videoaula, palavra-chave e fixação antes da aula.</li>
                <li>Evitar deixar videoaula e palavra-chave pela metade, como aconteceu no Bloco IX.</li>
                <li>Reservar um horário curto para revisão de frações, medidas de comprimento, área e volume.</li>
                <li>Refazer as questões erradas com correção guiada.</li>
                <li>Manter o bom comportamento e buscar mais constância no rendimento, especialmente em Matemática.</li>
              </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
