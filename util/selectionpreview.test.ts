import { JSDOM } from 'jsdom';
import { describe, expect, test } from 'vitest';
import { getSelectionPreview, toWords } from './selectionpreview';

function rangeOver(doc: Document, text: string): Range {
  const walker = doc.createTreeWalker(doc.body, 4 /* NodeFilter.SHOW_TEXT */);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const index = node.textContent!.indexOf(text);
    if (index >= 0) {
      const range = doc.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + text.length);
      return range;
    }
  }
  throw new Error(`text not found: ${text}`);
}

const doc = new JSDOM(`<body>
  <p>Introduction text.</p>
  <h2>2.4 API</h2>
  <p>Clients read and modify <em>relation tuples</em> through the API.
     Zanzibar also offers a watch API.</p>
  <p>${'Long context words. '.repeat(40)}TARGET${' trailing words.'.repeat(40)}</p>
  <ul><li>list intro<p>nested paragraph</p></li></ul>
  <p>After list.</p>
  <p>Inline <span class="katex"><span class="katex-mathml">MATHML</span><span class="katex-html">x</span></span> math and ⟨object id⟩ brackets.</p>
  <p><span class="katex">\\lang only math \\rang</span></p>
  <p>After math.</p>
</body>`).window.document;

describe('getSelectionPreview', () => {
  test('heading selection includes neighboring blocks', () => {
    expect(getSelectionPreview([rangeOver(doc, '2.4 API')])).toEqual({
      previous: { text: 'Introduction text.', isHeading: false },
      before: '',
      selected: '2.4 API',
      after: '',
      isHeading: true,
      next: {
        text: 'Clients read and modify relation tuples through the API. Zanzibar also offers a watch API.',
        isHeading: false,
      },
    });
  });

  test('includes surrounding paragraph text across inline elements', () => {
    const preview = getSelectionPreview([rangeOver(doc, 'relation tuples')]);
    expect(preview).toMatchObject({
      previous: { text: '2.4 API', isHeading: true },
      before: 'Clients read and modify ',
      selected: 'relation tuples',
      after: ' through the API. Zanzibar also offers a watch API.',
      isHeading: false,
    });
  });

  test('neighbors skip blocks nested in the selected block', () => {
    const preview = getSelectionPreview([rangeOver(doc, 'list intro')]);
    // The long previous paragraph keeps the end closest to the selection.
    expect(preview?.previous?.text).toMatch(/^….*trailing words\.$/);
    expect(preview?.previous?.text.length).toBeLessThanOrEqual(301);
    expect(preview?.next).toEqual({ text: 'After list.', isHeading: false });
  });

  test('trims long context at word boundaries', () => {
    const preview = getSelectionPreview([rangeOver(doc, 'TARGET')])!;
    expect(preview.selected).toBe('TARGET');
    expect(preview.before.startsWith('…')).toBe(true);
    expect(preview.after.endsWith('…')).toBe(true);
    expect(preview.before.length).toBeLessThanOrEqual(301);
    expect(preview.after.length).toBeLessThanOrEqual(301);
    expect(preview.before).toMatch(/^…\S/);
    expect(preview.after).toMatch(/\S…$/);
  });

  test('excludes math markup and normalizes angle brackets', () => {
    const preview = getSelectionPreview([rangeOver(doc, 'brackets')]);
    expect(preview).toMatchObject({
      before: 'Inline math and 〈object id〉 ',
      selected: 'brackets',
      after: '.',
    });
    // The math-only paragraph is skipped as a neighbor.
    expect(preview?.next).toEqual({ text: 'After math.', isHeading: false });
  });

  test('no ranges', () => {
    expect(getSelectionPreview([])).toBeNull();
  });
});

describe('toWords', () => {
  test('keeps spaces around the selection outside the highlight', () => {
    expect(
      toWords([
        ['provide ', false],
        ['external consistency', true],
        [' amid changes', false],
      ])
    ).toEqual([
      { text: 'provide ', selected: false },
      { text: 'external ', selected: true },
      { text: 'consistency', selected: true },
      { text: ' ', selected: false },
      { text: 'amid ', selected: false },
      { text: 'changes', selected: false },
    ]);
  });

  test('selection followed by punctuation', () => {
    expect(
      toWords([
        ['', false],
        ['API', true],
        ['.', false],
      ])
    ).toEqual([
      { text: 'API', selected: true },
      { text: '.', selected: false },
    ]);
  });
});
