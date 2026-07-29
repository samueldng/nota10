describe('Blindagem do Cadastro de Alunos', () => {
  beforeEach(() => {
    // Injeta a sessão anonimamente nos bastidores
    cy.login();

    // Intercepta a chamada de API de turmas para o componente não quebrar em ambiente de teste isolado
    cy.intercept('GET', '/api/turmas', {
      statusCode: 200,
      body: [
        { id: 'uuid-1', nome: 'T1 - Segunda-feira', status: 'ativa' },
        { id: 'uuid-2', nome: 'T2 - Terça-feira', status: 'ativa' }
      ]
    }).as('getTurmas');

    // Navega para a rota (ajuste para a URL exata do seu modal/página)
    cy.visit('/cadastros/alunos');
    cy.wait('@getTurmas');
  });

  it('Deve bloquear a submissão de um formulário completamente em branco', () => {
    // Abre o modal de Novo Aluno
    cy.contains('Novo Aluno').click();

    cy.get('button[type="submit"]').click();

    // Validações do Zod devem aparecer no DOM
    cy.contains('O nome completo é obrigatório.').should('be.visible');
    cy.contains('Selecione pelo menos um acompanhamento/produto.').should('be.visible');
    cy.contains('Vincule o aluno a pelo menos uma turma.').should('be.visible');
  });

  it('Deve rejeitar senhas que contenham letras (Regex Validation)', () => {
    // Abre o modal de Novo Aluno
    cy.contains('Novo Aluno').click();

    // Preenche dados válidos básicos
    cy.get('input[name="nome"]').type('Aluno de Teste Cypress');
    cy.get('select[name="planoPortal"]').select('Padrão');
    
    // Marca a primeira turma injetada dinamicamente
    cy.get('input[type="checkbox"][value="uuid-1"]').check();

    // Marca um produto
    cy.get('input[type="checkbox"][name="produtosIds"]').first().check();

    // Tenta injetar uma senha inválida (letras em vez de números)
    cy.get('input[name="senhaInicial"]').type('abcd');
    cy.get('button[type="submit"]').click();

    // A validação rigorosa do Zod deve travar o frontend
    cy.contains('A senha deve conter estritamente números.').should('be.visible');
  });
});
