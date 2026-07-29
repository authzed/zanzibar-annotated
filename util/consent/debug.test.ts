import { afterEach, describe, expect, it } from 'vitest';
import { DEBUG_EU_COOKIE, getDebugCookie } from './debug';

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/`;
}

function clearCookies() {
  document.cookie.split(';').forEach((c) => {
    document.cookie =
      c.trim().split('=')[0] + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
  });
}

describe('getDebugCookie', () => {
  afterEach(clearCookies);

  it('returns null when the cookie is not present', () => {
    expect(getDebugCookie(DEBUG_EU_COOKIE)).toBeNull();
  });

  it('returns the value for a simple cookie', () => {
    setCookie(DEBUG_EU_COOKIE, 'true');
    expect(getDebugCookie(DEBUG_EU_COOKIE)).toBe('true');
  });

  it('returns the full value when it contains a literal "=" character', () => {
    // Regression test: getDebugCookie must not truncate at the first "=" --
    // a naive `row.split('=')[1]` would return just "abc" here instead of
    // the full "abc=def".
    setCookie(DEBUG_EU_COOKIE, 'abc=def');
    expect(getDebugCookie(DEBUG_EU_COOKIE)).toBe('abc=def');
  });
});
