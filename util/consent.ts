// Read-only consumer of the `az-consent` cookie that authzed.com sets when a
// visitor makes a cookie consent choice. This site never writes the cookie or
// shows a banner. Adapted from authzed/docs lib/consent.

export const CONSENT_COOKIE_NAME = 'az-consent';
const CONSENT_COOKIE_VERSION = 1;

export interface ConsentPreferences {
  version: 1;
  necessary: true;
  preferences: boolean;
  statistics: boolean;
  marketing: boolean;
  updatedAt: string; // ISO-8601
}

/**
 * readConsentCookie returns the visitor's consent preferences from a
 * `document.cookie` style string, or null if none were recorded.
 */
export function readConsentCookie(cookies: string): ConsentPreferences | null {
  const row = cookies
    .split('; ')
    .find((r) => r.startsWith(`${CONSENT_COOKIE_NAME}=`));
  if (!row) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      decodeURIComponent(row.substring(CONSENT_COOKIE_NAME.length + 1))
    );
    if (parsed?.version === CONSENT_COOKIE_VERSION) {
      return parsed as ConsentPreferences;
    }
  } catch {
    // invalid cookie
  }
  return null;
}

/**
 * hasStatisticsConsent returns true only if the visitor explicitly allowed
 * statistics cookies on authzed.com.
 */
export function hasStatisticsConsent(cookies: string): boolean {
  return readConsentCookie(cookies)?.statistics === true;
}
