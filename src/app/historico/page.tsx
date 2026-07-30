import HistoricoTable from '@/components/HistoricoTable';
import { getHistoricoPaginado, getHistoricoOptions } from '@/actions/historico';

// Força a renderização dinâmica no servidor a cada requisição
export const dynamic = 'force-dynamic'; 

export default async function HistoricoPage() {
  let initialData = { registros: [], totalPages: 1, currentPage: 1, totalRegistros: 0 };
  let options = { acompanhamentos: [], turmas: [], alunos: [], professores: [], disciplinas: [], status: [] };

  try {
    // Busca a primeira página de dados e as opções dos filtros em paralelo
    const [dataRes, optionsRes] = await Promise.all([
      getHistoricoPaginado({ page: 1, limit: 50 }),
      getHistoricoOptions()
    ]);
    
    initialData = dataRes as any;
    options = optionsRes as any;
  } catch (error) {
    console.error("Erro fatal ao buscar histórico ou opções:", error);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Histórico</h1>
        <p className="text-[#64748B] mt-1 text-sm">Central de consulta, revisão e auditoria de todos os registros lançados.</p>
      </div>
      
      {/* Injeção dos dados paginados, estado e opções formatadas no Componente Cliente */}
      <HistoricoTable 
        initialData={initialData} 
        options={options} 
      />
    </div>
  );
}
