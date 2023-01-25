export {};

describe('selection view', () => {
  beforeEach(() => {
    cy.visit('/228mrk3xXL:0:7'); // Section 2.4 API
  });

  it('renders selection', () => {
    // Shows share options
    cy.get('[class^="Popper_tooltip"]');

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
