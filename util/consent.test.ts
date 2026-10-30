import { describe, expect, test } from 'vitest';
import { hasStatisticsConsent, readConsentCookie } from './consent';

const consentCookie = (prefs: Record<string, unknown>) =>
  `az-consent=${encodeURIComponent(JSON.stringify(prefs))}`;

const granted = {
  version: 1,
  necessary: true,
  preferences: true,
  statistics: true,
  marketing: false,
  updatedAt: '2026-10-01T00:00:00.000Z',
};

describe('readConsentCookie', () => {
  test('missing cookie', () => {
    expect(readConsentCookie('')).toBeNull();
    expect(readConsentCookie('other=1; ph_foo=bar')).toBeNull();
  });

  test('valid cookie among others', () => {
    expect(readConsentCookie(`a=1; ${consentCookie(granted)}; b=2`)).toEqual(
      granted
    );
  });

  test('unsupported version', () => {
    expect(readConsentCookie(consentCookie({ ...granted, version: 2 }))).toBeNull();
  });

  test('malformed value', () => {
    expect(readConsentCookie('az-consent=%7Bnot-json')).toBeNull();
  });
});

describe('hasStatisticsConsent', () => {
  test('defaults to no consent', () => {
    expect(hasStatisticsConsent('')).toBe(false);
    expect(hasStatisticsConsent('az-consent=garbage')).toBe(false);
  });

  test('statistics granted', () => {
    expect(hasStatisticsConsent(consentCookie(granted))).toBe(true);
  });

  test('statistics rejected', () => {
    expect(
      hasStatisticsConsent(consentCookie({ ...granted, statistics: false }))
    ).toBe(false);
  });
});
