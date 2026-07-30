import { getKpisGlobais, getMetricasTurma, getDistribuicaoPraticar, getEvolucaoPresencas } from '@/actions/relatorios';
import RelatorioDashboard from '@/components/RelatorioDashboard';

export const dynamic = 'force-dynamic';

export default async function RelatoriosPage() {
  // Paralelismo total na recolha de dados - Não bloqueamos o processo sequencialmente
  let kpis = { xpSemana: 0, taxaAssiduidade: 0 };
  let turmaXP: any[] = [];
  let distribuicao: any[] = [];
  let presencas: any[] = [];

  try {
    const [kpisRes, turmaRes, distRes, presRes] = await Promise.all([
      getKpisGlobais(),
      getMetricasTurma(),
      getDistribuicaoPraticar(),
      getEvolucaoPresencas()
    ]);

    kpis = kpisRes;
    turmaXP = turmaRes;
    distribuicao = distRes;
    presencas = presRes;
  } catch (error) {
    console.error("Erro fatal ao buscar relatórios:", error);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Relatórios de Desempenho</h1>
        <p className="text-[#64748B] mt-1 text-sm">
          Inteligência de dados e evolução pedagógica calculados em tempo real.
        </p>
      </div>
      
      {/* O payload injetado já está 100% calculado e reduzido pelo PostgreSQL */}
      <RelatorioDashboard 
        kpis={kpis}
        turmaXP={turmaXP}
        distribuicao={distribuicao}
        presencas={presencas}
      />
    </div>
  );
}
