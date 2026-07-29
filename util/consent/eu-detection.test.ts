import { afterEach, describe, expect, it, vi } from 'vitest';

describe('isEUVisitor', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('returns true for an EU timezone', async () => {
    vi.resetModules();
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation((() => ({
      resolvedOptions: () => ({ timeZone: 'Europe/Berlin' }),
    })) as unknown as typeof Intl.DateTimeFormat);
    const { isEUVisitor } = await import('./eu-detection.js');
    expect(isEUVisitor()).toBe(true);
  });

  it('returns false for a non-EU timezone', async () => {
    vi.resetModules();
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation((() => ({
      resolvedOptions: () => ({ timeZone: 'America/New_York' }),
    })) as unknown as typeof Intl.DateTimeFormat);
    const { isEUVisitor } = await import('./eu-detection.js');
    expect(isEUVisitor()).toBe(false);
  });

  it('returns true (conservative) if detection throws', async () => {
    vi.resetModules();
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('detection failed');
    });
    const { isEUVisitor } = await import('./eu-detection.js');
    expect(isEUVisitor()).toBe(true);
  });

  it('does not cache the result across calls within the same module instance', async () => {
    // Regression test for the removed module-level cache: deliberately do NOT
    // call vi.resetModules() between the two isEUVisitor() calls below, so
    // both calls hit the exact same module instance. If a module-level cache
    // were ever reintroduced, the second call would keep returning the first
    // call's (now-stale) result instead of reflecting the updated timezone.
    vi.resetModules();
    let timeZone = 'Europe/Berlin';
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation((() => ({
      resolvedOptions: () => ({ timeZone }),
    })) as unknown as typeof Intl.DateTimeFormat);
    const { isEUVisitor } = await import('./eu-detection.js');

    expect(isEUVisitor()).toBe(true);

    timeZone = 'America/New_York';
    expect(isEUVisitor()).toBe(false);
  });
});
