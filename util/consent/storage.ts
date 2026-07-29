import type { ConsentPreferences } from './types';

const COOKIE_NAME = 'az-consent';
const COOKIE_VERSION = 1;

export function readConsentCookie(): ConsentPreferences | null {
  if (typeof document === 'undefined') return null;

  const raw = getCookieValue(COOKIE_NAME);
  if (!raw) return null;

  try {
    return validateParsedCookie(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function parseConsentCookie(
  rawValue: string | undefined | null
): ConsentPreferences | null {
  if (!rawValue) return null;
  try {
    return validateParsedCookie(JSON.parse(decodeURIComponent(rawValue)));
  } catch {
    return null;
  }
}

// Shared by readConsentCookie/parseConsentCookie: both JSON.parse a raw
// cookie value differently (document.cookie vs. an already-extracted raw
// string) but need identical version validation afterward.
function validateParsedCookie(parsed: unknown): ConsentPreferences | null {
  if (
    typeof parsed === 'object' &&
    parsed !== null &&
    (parsed as { version?: unknown }).version === COOKIE_VERSION
  ) {
    return parsed as ConsentPreferences;
  }
  return null;
}

export const CONSENT_COOKIE_NAME = COOKIE_NAME;

export function shouldOptOutCapturing(isEU: boolean): boolean {
  const consent = readConsentCookie();
  if (consent !== null) return !consent.statistics;
  return isEU;
}

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
}
