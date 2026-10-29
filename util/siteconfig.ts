// Site-wide constants. These were previously exposed through Next's
// `publicRuntimeConfig`, which was removed in Next.js 16.
export const GA_MEASUREMENT_ID = 'G-SPCEM7FV1Z';
export const CANONICAL_URL_BASE = 'https://authzed.com/zanzibar';

// PostHog analytics configuration. Analytics are disabled unless
// NEXT_PUBLIC_POSTHOG_KEY is set. Each variable must be referenced literally so
// Next.js can inline it into the client bundle.
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
export const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
export const POSTHOG_UI_HOST = process.env.NEXT_PUBLIC_POSTHOG_UI_HOST;
