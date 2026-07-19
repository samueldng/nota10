import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { alunoId, atividadeId, status, xpGanho = 0 } = body;

    if (!alunoId || !atividadeId || !status) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    if (!['bloqueada', 'em_andamento', 'concluida'].includes(status)) {
       return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
    }

    let queryStr = '';
    let params: any[] = [];

    if (status === 'concluida') {
      queryStr = `
        INSERT INTO atividades_progresso (aluno_id, atividade_id, status, xp_ganho, completed_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        ON CONFLICT (aluno_id, atividade_id)
        DO UPDATE SET status = $3, xp_ganho = $4, completed_at = NOW(), updated_at = NOW()
      `;
      params = [alunoId, atividadeId, status, xpGanho];
    } else if (status === 'em_andamento') {
      queryStr = `
        INSERT INTO atividades_progresso (aluno_id, atividade_id, status, started_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (aluno_id, atividade_id)
        DO UPDATE SET status = $3, updated_at = NOW()
      `;
      params = [alunoId, atividadeId, status];
    } else {
      // bloqueada
      queryStr = `
        INSERT INTO atividades_progresso (aluno_id, atividade_id, status, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (aluno_id, atividade_id)
        DO UPDATE SET status = $3, updated_at = NOW()
      `;
      params = [alunoId, atividadeId, status];
    }

    await query(queryStr, params);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao atualizar progresso da trilha:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
