import { describe, expect, test } from 'vitest';
import { addendumLabel, formatAddendumDate } from './addendum';

describe('formatAddendumDate', () => {
  test('formats a day', () => {
    expect(formatAddendumDate('2026-11-12')).toBe('Nov 12, 2026');
    expect(formatAddendumDate('2026-01-05')).toBe('Jan 5, 2026');
  });

  test('formats a day that YAML read as a date', () => {
    expect(formatAddendumDate(new Date('2026-11-12'))).toBe('Nov 12, 2026');
  });

  test('leaves anything else as written', () => {
    expect(formatAddendumDate('soon')).toBe('soon');
    expect(formatAddendumDate('2026-13-01')).toBe('2026-13-01');
  });
});

describe('addendumLabel', () => {
  test('without an author', () => {
    expect(addendumLabel({ date: '2026-11-12', content: 'x' })).toBe(
      'Addendum · Nov 12, 2026'
    );
  });

  test('with an author', () => {
    expect(
      addendumLabel({ date: '2026-11-12', author: 'Joey Schorr', content: 'x' })
    ).toBe('Addendum · Nov 12, 2026 · Joey Schorr');
  });
});
