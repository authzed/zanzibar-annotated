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

// `posthog-js`, as initialized by this app's `instrumentation-client.ts`
// (`import posthog from 'posthog-js'; posthog.init(...)`), does not assign
// itself to `window.posthog` -- that only happens with the classic snippet/array
// bundle, not the ESM/module entrypoint this app uses. Confirmed directly: after
// a full page load with PostHog initialized, `window.posthog` is `undefined` in
// the browser, and `node_modules/posthog-js/dist/module.full.js` contains no
// `window.posthog` (or `globalThis.posthog`) assignment at all.
//
// What the SDK does do, as a direct side effect of the `opt_in_capturing()` /
// `opt_out_capturing()` calls in `instrumentation-client.ts`, is persist its
// consent decision to `localStorage` under `__ph_opt_in_out_<project_key>`
// ("1" for opted in, "0" for opted out) -- this is exactly the state
// `has_opted_in_capturing()` / `has_opted_out_capturing()` read back
// (`consent.isOptedIn()` / `consent.isOptedOut()` in the SDK source resolve to
// this same persisted value). Reading it here asserts the SDK's own opt-in/
// opt-out state without needing a `window.posthog` reference or a live network
// round trip.
function readPostHogOptState(win: Cypress.AUTWindow): string | undefined {
  const key = Object.keys(win.localStorage).find((k) =>
    k.startsWith('__ph_opt_in_out_')
  );
  return key ? win.localStorage.getItem(key) ?? undefined : undefined;
}

describe('consent-gated tracking', () => {
  it('opts PostHog out of capturing when consent rejects statistics', () => {
    visitWithConsent(false);
    cy.window().should((win) => {
      expect(
        readPostHogOptState(win),
        'PostHog opt-out state was persisted by the SDK'
      ).to.equal('0');
    });
    cy.window().its('dataLayer').should((dataLayer) => {
      const consentUpdate = (dataLayer as unknown[]).find(
        (entry) => Array.isArray(entry) && entry[0] === 'consent' && entry[1] === 'update'
      ) as [string, string, Record<string, string>] | undefined;
      expect(consentUpdate, 'a consent update was pushed to dataLayer').to.exist;
      expect(consentUpdate?.[2].analytics_storage).to.equal('denied');
    });
  });

  it('opts PostHog in to capturing when consent grants statistics', () => {
    visitWithConsent(true);
    cy.window().should((win) => {
      expect(
        readPostHogOptState(win),
        'PostHog opt-in state was persisted by the SDK'
      ).to.equal('1');
    });
    cy.window().its('dataLayer').should((dataLayer) => {
      const consentUpdate = (dataLayer as unknown[]).find(
        (entry) => Array.isArray(entry) && entry[0] === 'consent' && entry[1] === 'update'
      ) as [string, string, Record<string, string>] | undefined;
      expect(consentUpdate, 'a consent update was pushed to dataLayer').to.exist;
      expect(consentUpdate?.[2].analytics_storage).to.equal('granted');
    });
  });
});
