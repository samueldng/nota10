import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Registros lançados
    const regResult = await query(`SELECT COUNT(*) as total FROM registros_lancados`);
    const totalRegistros = parseInt(regResult.rows[0].total, 10);

    // Turmas ativas
    const turmasResult = await query(`SELECT COUNT(*) as total FROM turmas WHERE status = 'ativo'`);
    const totalTurmas = parseInt(turmasResult.rows[0].total, 10);

    // Presença média
    const presencaResult = await query(`
      SELECT 
        COUNT(*) as total_mediacoes,
        SUM(CASE WHEN presenca = 'presente' THEN 1 ELSE 0 END) as total_presencas
      FROM registros_lancados
    `);
    
    const totalMediacoes = parseInt(presencaResult.rows[0].total_mediacoes, 10);
    const totalPresencas = parseInt(presencaResult.rows[0].total_presencas || '0', 10);
    
    let presencaMedia = 0;
    if (totalMediacoes > 0) {
      presencaMedia = Math.round((totalPresencas / totalMediacoes) * 100);
    }

    return NextResponse.json({
      registrosLancados: totalRegistros,
      turmasAtivas: totalTurmas,
      presencaMedia,
    });
  } catch (err: any) {
    console.error('Erro no GET /api/dashboard/stats:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
