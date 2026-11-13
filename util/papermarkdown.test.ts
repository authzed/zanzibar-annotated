import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  AnnotationSetSource,
  getLlmsTxt,
  getMarkdownUrl,
  paperToMarkdown,
} from './papermarkdown';

const sets: AnnotationSetSource[] = [
  {
    id: 'intro',
    title: 'Introduction',
    subtitle: 'Commentary.',
    author: { name: 'Ada Author', url: 'https://example.com/ada' },
    groups: {
      'page-1-col-1': {
        outer: { content: 'About the whole phrase.\n' },
        'second-column': { content: 'First line.\n\nSecond line.\n' },
      },
    },
  },
  {
    id: 'other',
    title: 'Other',
    groups: { 'page-1-col-2': { inner: { content: 'About the inner words.' } } },
  },
];

const source = `import { Page } from '../components/layout';
import Figure1 from './Figure1.svg';

<Page pageNumber={1}>
<Header>

# The Title

<p className="text-lg">An Author</p>

</Header>
<Column>

## 1 Introduction

<Section titles={["1 Introduction"]}>
A sentence with <Highlight setId="intro" entryId="outer">an <Highlight setId="other" entryId="inner">inner</Highlight> phrase</Highlight>.
<PreviewLink previewComponent={<Figure1 />}>[Figure 1](#figure-1)</PreviewLink> shows it, as does [a site](https://example.com).

This paragraph runs across
</Section>
</Column>
<Column>
<Section titles={["1 Introduction"]}>
the <Highlight setId="intro" entryId="second-column">end of a column</Highlight>.

<a id="figure-1" />
<Figure1 role="img" aria-label="Figure 1: A drawing." className="w-full" />

* A list item
</Section>
</Column>
<PageFooter numberLabel="1" />
</Page>
`;

describe('paperToMarkdown', () => {
  const markdown = paperToMarkdown(source, sets);
  const paper = markdown.substring(markdown.indexOf('\n---\n'));

  test('removes the layout and keeps the text', () => {
    expect(paper).not.toMatch(/<|import|\u0000/);
    expect(paper).toContain('# The Title\n\nAn Author\n\n## 1 Introduction');
    expect(paper).toContain('A sentence with an inner phrase.');
    expect(paper).toContain('* A list item');
  });

  test('keeps external links and unlinks internal ones', () => {
    expect(paper).toContain(
      'Figure 1 shows it, as does [a site](https://example.com).'
    );
  });

  test('replaces figures with their captions', () => {
    expect(paper).toContain('\n\n_Figure 1: A drawing._\n\n');
  });

  test('rejoins a paragraph split across columns', () => {
    expect(paper).toContain(
      'This paragraph runs across the end of a column.'
    );
  });

  test('follows a paragraph with its annotations', () => {
    expect(paper).toContain(
      [
        'shows it, as does [a site](https://example.com).',
        '> **Annotation (Other)** on “inner”:\n>\n> About the inner words.',
        '> **Annotation by Ada Author (Introduction)** on “an inner phrase”:\n>\n> About the whole phrase.',
      ].join('\n\n')
    );
    expect(paper).toContain(
      [
        'runs across the end of a column.',
        '> **Annotation by Ada Author (Introduction)** on “end of a column”:\n>\n> First line.\n>\n> Second line.',
      ].join('\n\n')
    );
  });

  test('introduces the annotation sets', () => {
    expect(markdown).toContain(
      '- **Introduction**, by [Ada Author](https://example.com/ada): Commentary.'
    );
    expect(markdown).toContain('- **Other**');
  });
});

describe('getLlmsTxt', () => {
  test('links to the markdown edition and names the authors', () => {
    const llms = getLlmsTxt(sets);
    expect(llms).toContain('](https://authzed.com/zanzibar/paper.md)');
    expect(llms).toContain('annotated by Ada Author of AuthZed');
  });
});

describe('getMarkdownUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('uses the canonical URL in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_VERCEL_URL', 'zanzibar-abc.vercel.app');
    expect(getMarkdownUrl()).toBe('https://authzed.com/zanzibar/paper.md');
  });

  test("uses a preview deployment's own URL", () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview');
    vi.stubEnv('NEXT_PUBLIC_VERCEL_URL', 'zanzibar-abc.vercel.app');
    expect(getMarkdownUrl()).toBe('https://zanzibar-abc.vercel.app/paper.md');
  });

  test('uses a path on this server in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', '');
    vi.stubEnv('NEXT_PUBLIC_VERCEL_URL', '');
    expect(getMarkdownUrl()).toBe('/paper.md');
  });

  test('falls back to the canonical URL outside Vercel', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', '');
    vi.stubEnv('NEXT_PUBLIC_VERCEL_URL', '');
    expect(getMarkdownUrl()).toBe('https://authzed.com/zanzibar/paper.md');
  });
});
