describe('Authentication Flow (Register -> Login -> Logout)', () => {
  const email = 'ysrly0234@gmail.com';
  const password = 'ysrly0234';
  const firstName = 'Test User';

  it('should register a new user, logout, and ثم login successfully', () => {
    // 1. Visit the system and go to register
    cy.visit('http://localhost:4210/auth/register');

    // 2. Perform Registration
    cy.get('input[formControlName="firstName"]').type(firstName);
    cy.get('input[formControlName="email"]').type(email);
    cy.get('input[formControlName="password"]').type(password);
    cy.get('button[type="submit"]').click();

    // 3. Verify Registration Success (Auto-login)
    cy.url().should('eq', 'http://localhost:4210/');
    cy.get('nav.navbar').should('be.visible');

    // 4. Logout
    cy.get('button[title="התנתקות"]').click();
    cy.url().should('include', '/auth/login');

    // 5. Login with the newly created user
    cy.get('input[formControlName="email"]').type(email);
    cy.get('input[formControlName="password"]').type(password);
    cy.get('button[type="submit"]').click();

    // 6. Verify Login Success
    cy.url().should('eq', 'http://localhost:4210/');
    cy.get('nav.navbar').should('be.visible');

    // 7. Final Logout
    cy.get('button[title="התנתקות"]').click();
    cy.url().should('include', '/auth/login');
  });
});