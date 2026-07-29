export {};

function visitWithConsent(statistics: boolean) {
  cy.setCookie(
    'az-consent',
    encodeURIComponent(
      JSON.stringify({
        version: 1,
        necessary: true,
        preferences: statistics,
        statistics,
        marketing: statistics,
        updatedAt: '2026-01-01T00:00:00.000Z',
      })
    )
  );
  cy.visit('/');
  cy.get('.header').should('contain', 'Zanzibar');
}

describe('consent-gated tracking', () => {
  it('does not request GTM or PostHog when consent rejects statistics', () => {
    cy.intercept('GET', 'https://www.googletagmanager.com/**').as('gtm');
    cy.intercept('POST', '/i/**').as('posthogCapture');
    visitWithConsent(false);
    cy.wait(500);
    cy.get('@gtm.all').should('have.length', 0);
    cy.get('@posthogCapture.all').should('have.length', 0);
  });

  it('requests GTM and PostHog when consent grants statistics', () => {
    cy.intercept('GET', 'https://www.googletagmanager.com/**', {
      statusCode: 200,
      body: '',
    }).as('gtm');
    cy.intercept('POST', '/i/**', { statusCode: 200, body: {} }).as(
      'posthogCapture'
    );
    visitWithConsent(true);
    cy.wait('@gtm', { timeout: 5000 });
    cy.wait('@posthogCapture', { timeout: 5000 });
  });
});
