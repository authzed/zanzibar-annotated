/**
 * Read-only consent consumer, ported from authzed/docs' lib/consent/*
 * (itself ported from authzed/web's src/consent/core/). Reads the
 * `az-consent` cookie set by authzed.com; does not write it or show a banner.
 */
export {
  readConsentCookie,
  parseConsentCookie,
  shouldOptOutCapturing,
  CONSENT_COOKIE_NAME,
} from './storage';
export { isEUVisitor } from './eu-detection';
export type { ConsentPreferences } from './types';
