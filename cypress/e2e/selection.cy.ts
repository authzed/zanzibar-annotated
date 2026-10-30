export {};

describe('selection view', () => {
  beforeEach(() => {
    cy.visit('/228mrk3xXL:0:7'); // Section 2.4 API
  });

  it('renders selection', () => {
    // Shows share options. The page smooth-scrolls to the selection on load,
    // which can be cut short on slow CI runners, so bring the share options
    // into view before checking they're visible.
    cy.get('[data-testid="selection-share"]')
      .scrollIntoView()
      .should('be.visible');

    // Selection is highlighted
    cy.window().then((w) => {
      const selection = w.getSelection();
      expect(selection?.toString()).to.equal('2.4 API');
    });
  });

  it('has correct meta tags', () => {
    cy.get('meta[property="og:title"]').should(
      'have.attr',
      'content',
      'The Google Zanzibar Paper, annotated by AuthZed'
    );
    cy.get('meta[property="og:image"]')
      .should('have.attr', 'content')
      .and('contain', '/api/preview/228mrk3xXL:0:7');
    cy.get('meta[property="og:image:alt"]')
      .should('have.attr', 'content')
      .and('contain', '2.4 API');
  });
});
