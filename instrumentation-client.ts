import posthog from 'posthog-js';
import { isEUVisitor, shouldOptOutCapturing } from './util/consent';
import { isVercelProduction } from './util/isProd';

function initPostHog() {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY || !isVercelProduction) {
    if (isVercelProduction && !process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      console.warn('NEXT_PUBLIC_POSTHOG_KEY is unset; PostHog will not initialize.');
    }
    return;
  }

  const optOut = shouldOptOutCapturing(isEUVisitor());

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: '/i',
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: '2025-11-30',
    person_profiles: 'always',
    cross_subdomain_cookie: false,
    opt_out_capturing_by_default: optOut,
    opt_out_persistence_by_default: optOut,
    cookieless_mode: 'on_reject',
  });

  // cookieless_mode "on_reject" treats PENDING consent as opted-out and
  // non-capturing. Move every visitor out of PENDING so that opted-out
  // users get cookieless tracking and opted-in users get full tracking.
  if (optOut) {
    posthog.opt_out_capturing();
  } else if (!posthog.has_opted_in_capturing()) {
    posthog.opt_in_capturing();
  }
}

initPostHog();
