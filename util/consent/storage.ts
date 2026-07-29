import type { ConsentPreferences } from './types';

const COOKIE_NAME = 'az-consent';
const COOKIE_VERSION = 1;

export function readConsentCookie(): ConsentPreferences | null {
  if (typeof document === 'undefined') return null;

  const raw = getCookieValue(COOKIE_NAME);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed.version === COOKIE_VERSION) return parsed as ConsentPreferences;
  } catch {
    // invalid cookie
  }
  return null;
}

export function parseConsentCookie(
  rawValue: string | undefined | null
): ConsentPreferences | null {
  if (!rawValue) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(rawValue));
    if (parsed.version === COOKIE_VERSION) return parsed as ConsentPreferences;
  } catch {
    // invalid cookie
  }
  return null;
}

export const CONSENT_COOKIE_NAME = COOKIE_NAME;

export function consentedIdentify(
  ph: { identify: (id: string, props?: Record<string, unknown>) => void },
  distinctId: string,
  properties?: Record<string, unknown>
): void {
  const consent = readConsentCookie();
  if (consent?.statistics) {
    ph.identify(distinctId, properties);
  }
}

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
