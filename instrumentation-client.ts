import posthog from 'posthog-js';
import { hasStatisticsConsent } from './util/consent';
import { POSTHOG_HOST, POSTHOG_KEY, POSTHOG_UI_HOST } from './util/siteconfig';

if (POSTHOG_KEY) {
  // Visitors are tracked anonymously (cookieless, no person profile) unless
  // they allowed statistics cookies via the authzed.com consent banner.
  const identified = hasStatisticsConsent(document.cookie);

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    ...(POSTHOG_UI_HOST && { ui_host: POSTHOG_UI_HOST }),
    defaults: '2026-08-30',
    // Selecting text rewrites the URL via history.replaceState to create a
    // shareable deep link, so history-based pageview tracking would record a
    // pageview for every selection. Only capture the initial page load.
    capture_pageview: true,
    person_profiles: 'always',
    cross_subdomain_cookie: true,
    opt_out_capturing_by_default: !identified,
    opt_out_persistence_by_default: !identified,
    cookieless_mode: 'on_reject',
  });

  // cookieless_mode "on_reject" treats a pending consent state as
  // non-capturing, so move every visitor out of it: opted-out visitors get
  // cookieless tracking and consenting visitors get full tracking.
  if (!identified) {
    posthog.opt_out_capturing();
  } else if (!posthog.has_opted_in_capturing()) {
    posthog.opt_in_capturing();
  }
}
