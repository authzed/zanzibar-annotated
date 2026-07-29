export {};

describe('annotation deep-linking', () => {
  beforeEach(() => {
    cy.viewport('macbook-16');
  });

  it('opens the linked annotation and scrolls it into view', () => {
    cy.visit('/#annotations/intro/across-applications');

    // Verify the annotation element exists (anchor is hidden but still present for scroll targeting)
    cy.get('#annotation-intro-across-applications', { timeout: 5000 }).should(
      'exist'
    );
    // Verify the annotation content is visible
    cy.contains(
      'This can also come into play when you have multiple micro-services'
    ).should('be.visible');
  });
});
