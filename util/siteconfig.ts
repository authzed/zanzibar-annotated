// Site-wide constants. These were previously exposed through Next's
// `publicRuntimeConfig`, which was removed in Next.js 16.
export const GA_MEASUREMENT_ID = 'G-SPCEM7FV1Z';
export const CANONICAL_URL_BASE = 'https://authzed.com/zanzibar';

/**
 * getAssetUrl returns the origin that serves this deployment's public assets,
 * or an empty string to use relative URLs. Safe to call on the server and the
 * client.
 */
export function getAssetUrl(): string {
  return process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : '';
}

/**
 * getPreviewEndpoint returns the public base URL of the site, used in share
 * preview image URLs.
 * Defaults to the Vercel deployment's URL, and otherwise to this server on
 * localhost. Server only.
 */
export function getPreviewEndpoint(): string {
  if (process.env.PREVIEW_ENDPOINT) {
    return process.env.PREVIEW_ENDPOINT;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return `http://localhost:${process.env.PORT || 3000}`;
}

// PostHog analytics configuration. Analytics are disabled unless
// NEXT_PUBLIC_POSTHOG_KEY is set. Each variable must be referenced literally so
// Next.js can inline it into the client bundle.
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
export const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
export const POSTHOG_UI_HOST = process.env.NEXT_PUBLIC_POSTHOG_UI_HOST;
