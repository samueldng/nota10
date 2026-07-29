// cypress/support/commands.ts

declare namespace Cypress {
  interface Chainable {
    login(): Chainable<void>;
  }
}

Cypress.Commands.add('login', () => {
  // A sessão é mantida no LocalStorage
  window.localStorage.setItem('nota10_session', JSON.stringify({ 
    name: 'Coordenador Geral', 
    email: 'admin@nota10.com', 
    role: 'admin' 
  }));
});
