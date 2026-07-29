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
});
