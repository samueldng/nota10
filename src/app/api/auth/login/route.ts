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

    // Buscar todos os alunos que batam com a matrícula ou telefone nos campos responsavel1_telefone ou responsavel2_telefone
    const result = await query(`
      SELECT id, numero, nome, turma_id, turma_nome, acompanhamento, status, plano, senha_inicial, primeiro_acesso,
             responsavel1_nome, responsavel1_telefone, responsavel2_nome, responsavel2_telefone
      FROM alunos
      WHERE numero = $1 
         OR REPLACE(REPLACE(REPLACE(REPLACE(responsavel1_telefone, ' ', ''), '-', ''), '(', ''), ')', '') = $2
         OR REPLACE(REPLACE(REPLACE(REPLACE(responsavel2_telefone, ' ', ''), '-', ''), '(', ''), ')', '') = $2
    `, [matriculaOrTelefone, cleanInput]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Matrícula ou celular não encontrado.' }, { status: 404 });
    }

    const matchingAlunos = result.rows;

    // Filtrar os alunos onde a senha é válida (senha_inicial, '123456' ou os últimos 4 dígitos do celular)
    const validAlunos = matchingAlunos.filter(aluno => {
      const validPasswords = ['123456', aluno.senha_inicial, (aluno.responsavel1_telefone || '').replace(/\D/g, '').slice(-4)].filter(Boolean);
      return validPasswords.includes(password);
    });

    if (validAlunos.length === 0) {
      return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
    }

    if (validAlunos.length === 1) {
      const aluno = validAlunos[0];
      const sessionUser = {
        name: aluno.responsavel1_nome || `Responsável de ${aluno.nome}`,
        role: 'parent',
        alunoId: aluno.id,
        alunoNumero: aluno.numero,
        alunoNome: aluno.nome,
        plano: aluno.plano || 'padrao',
        turmaId: aluno.turma_id,
        turma: aluno.turma_nome,
        primeiroAcesso: aluno.primeiro_acesso ?? false,
      };

      return NextResponse.json({
        success: true,
        user: sessionUser
      });
    }

    // Múltiplos perfis encontrados
    const profiles = validAlunos.map(aluno => ({
      id: aluno.id,
      numero: aluno.numero,
      nome: aluno.nome,
      turma: aluno.turma_nome,
      turmaId: aluno.turma_id,
      plano: aluno.plano || 'padrao',
      primeiroAcesso: aluno.primeiro_acesso ?? false,
      responsavelNome: aluno.responsavel1_nome
    }));

    return NextResponse.json({
      requireProfileSelection: true,
      profiles
    }, { status: 206 });

  } catch (err: any) {
    console.error('Erro no login backend:', err);
    return NextResponse.json({ error: err.message || 'Erro interno no servidor.' }, { status: 500 });
  }
}
