export {};

const viewports: Cypress.ViewportPreset[] = [
  'macbook-16', // 2xl
  'macbook-13', // xl
  'ipad-2', // md
  'iphone-x', // sm
];

describe('reader view', () => {
  viewports.forEach((viewport) => {
    describe(`for screen: ${viewport}`, () => {
      beforeEach(() => {
        cy.visit('/');
        cy.viewport(viewport);
      });

      it('has header and footer', () => {
        cy.get('.header').should('contain', 'Zanzibar');
        cy.get('.footer')
          .should('contain', 'AuthZed')
          .and('contain', 'Zanzibar Paper © USENIX and original authors');
      });

      it('has paper content', () => {
        cy.get('.paper-content-container')
          .children()
          .should(
            'contain',
            'Zanzibar: Google’s Consistent, Global Authorization System'
          )
          .and('contain', 'Abstract')
          .and('contain', 'Introduction')
          .and('contain', 'Model, Language, and API')
          .and('contain', 'Relation Tuples')
          .and('contain', 'Consistency Model')
          .and('contain', 'Namespace Configuration')
          .and('contain', 'API')
          .and('contain', 'Architecture and Implementation')
          .and('contain', 'Storage')
          .and('contain', 'Serving')
          .and('contain', 'Experience')
          .and('contain', 'Requests')
          .and('contain', 'Latency')
          .and('contain', 'Availability')
          .and('contain', 'Internals')
          .and('contain', 'Lessons Learned')
          .and('contain', 'Related Work')
          .and('contain', 'Conclusion')
          .and('contain', 'Acknowledgments')
          .and('contain', 'References');
      });
    });
  });
});
