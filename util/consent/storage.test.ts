import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ConsentPreferences } from './types';
import {
  parseConsentCookie,
  readConsentCookie,
  shouldOptOutCapturing,
} from './storage';

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/`;
}

function clearCookies() {
  document.cookie.split(';').forEach((c) => {
    document.cookie =
      c.trim().split('=')[0] + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
  });
}

describe('readConsentCookie', () => {
  beforeEach(clearCookies);
  afterEach(clearCookies);

  it('returns null when no cookie exists', () => {
    expect(readConsentCookie()).toBeNull();
  });

  it('reads and parses the az-consent cookie', () => {
    const prefs: ConsentPreferences = {
      version: 1,
      necessary: true,
      preferences: true,
      statistics: false,
      marketing: false,
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    setCookie('az-consent', encodeURIComponent(JSON.stringify(prefs)));
    expect(readConsentCookie()).toEqual(prefs);
  });

  it('returns null for a wrong-version cookie', () => {
    setCookie('az-consent', encodeURIComponent(JSON.stringify({ version: 2 })));
    expect(readConsentCookie()).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    setCookie('az-consent', 'not-json');
    expect(readConsentCookie()).toBeNull();
  });
});

describe('parseConsentCookie', () => {
  it('returns null for undefined/null input', () => {
    expect(parseConsentCookie(undefined)).toBeNull();
    expect(parseConsentCookie(null)).toBeNull();
  });

  it('parses a URI-encoded raw cookie value', () => {
    const prefs: ConsentPreferences = {
      version: 1,
      necessary: true,
      preferences: false,
      statistics: true,
      marketing: false,
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    expect(parseConsentCookie(encodeURIComponent(JSON.stringify(prefs)))).toEqual(
      prefs
    );
  });
});

describe('shouldOptOutCapturing', () => {
  beforeEach(clearCookies);
  afterEach(clearCookies);

  it('honors the cookie when present, regardless of EU status', () => {
    setCookie(
      'az-consent',
      encodeURIComponent(
        JSON.stringify({
          version: 1,
          necessary: true,
          preferences: true,
          statistics: true,
          marketing: true,
          updatedAt: '2026-01-01T00:00:00.000Z',
        })
      )
    );
    expect(shouldOptOutCapturing(true)).toBe(false);
    expect(shouldOptOutCapturing(false)).toBe(false);
  });

  it('falls back to the EU heuristic when no cookie exists', () => {
    expect(shouldOptOutCapturing(true)).toBe(true);
    expect(shouldOptOutCapturing(false)).toBe(false);
  });
});
