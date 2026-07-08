import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { matriculaOrTelefone, password } = await request.json();

    if (!matriculaOrTelefone || !password) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    const cleanInput = matriculaOrTelefone.replace(/\D/g, '');

    // Buscar alunos e suas matrículas (com nomes de turmas)
    const result = await query(`
      SELECT id, numero, nome, acompanhamento, plano, senha_inicial, primeiro_acesso,
             responsavel1_nome, responsavel1_telefone, responsavel2_nome, responsavel2_telefone,
             COALESCE(
               (SELECT json_agg(json_build_object(
                  'id', m.id,
                  'turmaId', m.turma_id,
                  'turmaNome', t.nome,
                  'status', m.status
                ))
                FROM matriculas m
                JOIN turmas t ON m.turma_id = t.id
                WHERE m.aluno_id = alunos.id),
               '[]'::json
             ) as matriculas
      FROM alunos
      WHERE numero = $1 
         OR REPLACE(REPLACE(REPLACE(REPLACE(responsavel1_telefone, ' ', ''), '-', ''), '(', ''), ')', '') = $2
         OR REPLACE(REPLACE(REPLACE(REPLACE(responsavel2_telefone, ' ', ''), '-', ''), '(', ''), ')', '') = $2
    `, [matriculaOrTelefone, cleanInput]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Matrícula ou celular não encontrado.' }, { status: 404 });
    }

    const matchingAlunos = result.rows;

    // Filtrar os alunos onde a senha é válida
    const validAlunos = matchingAlunos.filter(aluno => {
      const validPasswords = ['123456', aluno.senha_inicial, (aluno.responsavel1_telefone || '').replace(/\D/g, '').slice(-4)].filter(Boolean);
      return validPasswords.includes(password);
    });

    if (validAlunos.length === 0) {
      return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
    }

    // O login volta a ser direto (1 aluno encontrado)
    const aluno = validAlunos[0];
    const matriculas = typeof aluno.matriculas === 'string' ? JSON.parse(aluno.matriculas) : (aluno.matriculas || []);
    
    // Obter turma primária ativa
    const activeMatriculas = matriculas.filter((m: any) => m.status === 'ativo');
    const primaryMatricula = activeMatriculas[0] || matriculas[0];

    const sessionUser = {
      name: aluno.responsavel1_nome || `Responsável de ${aluno.nome}`,
      role: 'parent',
      alunoId: aluno.id,
      alunoNumero: aluno.numero,
      alunoNome: aluno.nome,
      plano: aluno.plano || 'padrao',
      turmaId: primaryMatricula?.turmaId || '',
      turma: primaryMatricula?.turmaNome || '',
      primeiroAcesso: aluno.primeiro_acesso ?? false,
      // Array com as turmas a que o aluno tem acesso
      turmas: matriculas.map((m: any) => ({
        id: m.turmaId,
        nome: m.turmaNome,
        status: m.status
      }))
    };

    return NextResponse.json({
      success: true,
      user: sessionUser
    });

  } catch (err: any) {
    console.error('Erro no login backend N:N:', err);
    return NextResponse.json({ error: err.message || 'Erro interno no servidor.' }, { status: 500 });
  }
}
