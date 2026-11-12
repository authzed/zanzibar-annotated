import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { AnnotationAddenda } from './AnnotationAddenda';

describe('AnnotationAddenda', () => {
  test('renders each addendum under its label', () => {
    const html = renderToStaticMarkup(
      <AnnotationAddenda
        addenda={[
          { date: '2026-11-12', author: 'Joey Schorr', content: 'A _later_ note' },
          { date: '2026-12-01', content: 'Another' },
        ]}
      />
    );
    expect(html).toContain('Addendum · Nov 12, 2026 · Joey Schorr');
    expect(html).toContain('<em>later</em>');
    expect(html).toContain('Addendum · Dec 1, 2026<');
    expect(html.indexOf('later')).toBeLessThan(html.indexOf('Another'));
  });

  test('renders nothing without addenda', () => {
    expect(renderToStaticMarkup(<AnnotationAddenda />)).toBe('');
    expect(renderToStaticMarkup(<AnnotationAddenda addenda={[]} />)).toBe('');
  });
});
