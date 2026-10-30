import posthog from 'posthog-js';
import { hasStatisticsConsent } from './util/consent';
import { POSTHOG_HOST, POSTHOG_KEY, POSTHOG_UI_HOST } from './util/siteconfig';

if (POSTHOG_KEY) {
  // Consent is decided on authzed.com and read from its az-consent cookie on
  // every load. This site never records a consent decision of its own: it
  // doesn't call opt_in_capturing/opt_out_capturing, which would persist one.
  const identified = hasStatisticsConsent(document.cookie);

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    ...(POSTHOG_UI_HOST && { ui_host: POSTHOG_UI_HOST }),
    defaults: '2026-08-30',
    // Selecting text rewrites the URL via history.replaceState to create a
    // shareable deep link, so history-based pageview tracking would record a
    // pageview for every selection. Only capture the initial page load.
    capture_pageview: true,
    ...(identified
      ? {
          // Visitors who allowed statistics cookies are tracked with a
          // persistent, cross-subdomain identity.
          person_profiles: 'always',
          cross_subdomain_cookie: true,
        }
      : {
          // Everyone else is tracked anonymously: cookieless, with nothing
          // stored on the device and no person profile.
          cookieless_mode: 'always',
          persistence: 'memory',
          person_profiles: 'identified_only',
        }),
  });
}
