/// <reference types="cypress" />

declare global {
    namespace Cypress {
        interface Chainable {
            /**
             * Programmatically logs in a user by setting localStorage.
             * Uses cy.session to persist state between tests.
             */
            login(email?: string, password?: string): Chainable<void>;
        }
    }
}

Cypress.Commands.add('login', (email = 'ysrly0234@gmail.com', password = 'ysrly0234') => {
    cy.session([email, password], () => {
        // Visit home to establish domain/origin for localStorage
        cy.visit('http://localhost:4210/');

        // Mock User Data
        const mockUser = {
            id: 'user-cypress-test',
            email: email,
            firstName: 'Cypress',
            lastName: 'Tester'
        };

        // Populate Mock DB and Session
        const mockDB = [{ ...mockUser, password }];

        cy.window().then((win) => {
            win.localStorage.setItem('mock_users_db', JSON.stringify(mockDB));
            win.localStorage.setItem('mock_session', JSON.stringify(mockUser));
        });
    }, {
        validate() {
            cy.window().then((win) => {
                const session = win.localStorage.getItem('mock_session');
                expect(session).to.not.be.null;
            });
        },
        cacheAcrossSpecs: true
    });
});

export { };