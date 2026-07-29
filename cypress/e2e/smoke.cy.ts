describe('Smoke Test', () => {
  it('Should load the login page successfully', () => {
    cy.visit('/login');
    cy.contains('Acessar').should('be.visible');
  });

  it('Should redirect protected routes to login', () => {
    cy.visit('/portal/bem-vindos');
    cy.url().should('include', '/login');
  });
});
