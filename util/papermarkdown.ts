import { Addendum, addendumLabel } from './addendum';
import {
  PAPER_CONFERENCE,
  PAPER_SOURCE_URL,
  SITE_TITLE,
} from './papermetadata';
import { CANONICAL_URL_BASE } from './siteconfig';

export const MARKDOWN_PATH = '/paper.md';
export const MARKDOWN_URL = `${CANONICAL_URL_BASE}${MARKDOWN_PATH}`;

/**
 * AnnotationSetSource is an annotation set as written in its YAML file.
 */
export type AnnotationSetSource = {
  id: string;
  title: string;
  subtitle?: string;
  author?: { name: string; url: string };
  // Annotations by entry id, grouped by where they appear on the page.
  // A set that has no annotations yet has no groups.
  groups: Record<
    string,
    Record<string, { content: string; addenda?: Addendum[] }>
  > | null;
};

// A block of the paper's markdown, with the annotations made on it.
type Block = {
  text: string;
  annotations: string[];
  // Whether a column or page ended between the previous block and this one.
  afterBreak: boolean;
};

// The longest highlighted text quoted in full by its annotation.
const MAX_QUOTE_LENGTH = 120;

// Marks where a column or page ends. Paragraphs that run across one are
// written in two parts in the source.
const BREAK = '\u0000';

const HIGHLIGHT =
  /<Highlight\s+setId="([^"]+)"\s+entryId="([^"]+)"[^>]*>((?:(?!<Highlight)[\s\S])*?)<\/Highlight>/;

function quote(text: string): string {
  return text
    .split('\n')
    .map((line) => (line ? `> ${line}` : '>'))
    .join('\n');
}

function byline(set: AnnotationSetSource): string {
  return set.author
    ? `Annotation by ${set.author.name} (${set.title})`
    : `Annotation (${set.title})`;
}

// Whether a block is running text, as opposed to a heading, list, figure
// caption or annotation.
function isParagraph(text: string): boolean {
  return !/^(#|\*\s|\d+\.\s|>|_(Figure|Table) |\*\*|\$|\\\*)/.test(text);
}

/**
 * stripLayout turns the paper's MDX source into markdown that still contains
 * its Highlight elements, by removing the components that lay it out as pages
 * and columns.
 */
function stripLayout(source: string): string {
  return (
    source
      .replace(/^import .*$/gm, '')
      .replace(/<PreviewLink previewComponent=\{<\w+ \/>\}>/g, '')
      .replace(/<\/PreviewLink>/g, '')
      .replace(/<PageFooter[^>]*\/>/g, '')
      .replace(/<a\s[^>]*(\/>|><\/a>)/g, '')
      .replace(/<br\s*\/>/g, '\n\n')
      // The figures are drawings, so only their captions can be kept.
      .replace(
        /<(?:Figure|Table)\d+\b[^>]*aria-label="([^"]*)"[^>]*\/>/g,
        '\n\n_$1_\n\n'
      )
      .replace(/<\/?(Page|Column)\b[^>]*>/g, `\n\n${BREAK}\n\n`)
      .replace(/<\/?(Header|Section|div|span|p)\b[^>]*>/g, '\n\n')
      // Links within the page have nowhere to point.
      .replace(/\[([^\]]+)\]\(#[^)]*\)/g, '$1')
  );
}

/**
 * paperToMarkdown converts the paper's MDX source to plain markdown, with each
 * annotation following the paragraph it comments on as a block quote.
 */
export function paperToMarkdown(
  source: string,
  sets: AnnotationSetSource[]
): string {
  const annotationSets = new Map(
    sets.map((set) => [
      set.id,
      {
        set,
        annotations: new Map(
          Object.values(set.groups ?? {}).flatMap((group) => Object.entries(group))
        ),
      },
    ])
  );

  const blocks: Block[] = [];
  let afterBreak = false;
  for (const part of stripLayout(source).split(/\n\s*\n/)) {
    let text = part.trim();
    if (text === BREAK) {
      afterBreak = true;
      continue;
    }
    if (!text) {
      continue;
    }

    // Replace each highlight with its text, innermost first, collecting the
    // annotations they refer to.
    const annotations: string[] = [];
    for (
      let match = HIGHLIGHT.exec(text);
      match;
      match = HIGHLIGHT.exec(text)
    ) {
      const [element, setId, entryId, highlighted] = match;
      text = text.replace(element, highlighted);

      const found = annotationSets.get(setId);
      const annotation = found?.annotations.get(entryId);
      if (found && annotation) {
        const quoted = highlighted.replace(/\s+/g, ' ').trim();
        const shortened =
          quoted.length > MAX_QUOTE_LENGTH
            ? `${quoted.substring(0, MAX_QUOTE_LENGTH).trimEnd()}…`
            : quoted;
        annotations.push(
          quote(
            [
              `**${byline(found.set)}** on “${shortened}”:`,
              annotation.content.trim(),
              ...(annotation.addenda ?? []).flatMap((addendum) => [
                `_${addendumLabel(addendum)}:_`,
                addendum.content.trim(),
              ]),
            ].join('\n\n')
          )
        );
      }
    }

    // Rejoin a paragraph that was split by the end of a column or page: this
    // block continues the nearest earlier paragraph that stops mid-sentence.
    if (afterBreak && isParagraph(text)) {
      const unfinished = blocks
        .slice(-3)
        .reverse()
        .find((block) => isParagraph(block.text));
      if (unfinished && !/[.:;?!][”"')_*]*$/.test(unfinished.text)) {
        unfinished.text += ` ${text}`;
        unfinished.annotations.push(...annotations);
        afterBreak = false;
        continue;
      }
    }

    blocks.push({ text, annotations, afterBreak });
    afterBreak = false;
  }

  const paper = blocks
    .flatMap((block) => [block.text, ...block.annotations])
    .join('\n\n');

  const setList = sets
    .map((set) => {
      const author = set.author
        ? `, by [${set.author.name}](${set.author.url})`
        : '';
      const subtitle = set.subtitle ? `: ${set.subtitle}` : '';
      return `- **${set.title}**${author}${subtitle}`;
    })
    .join('\n');

  return `**${SITE_TITLE}**

This is the annotated edition of the Zanzibar paper, published by AuthZed at ${CANONICAL_URL_BASE}. The paper was originally presented at the ${PAPER_CONFERENCE}: ${PAPER_SOURCE_URL}. The paper is © USENIX and its original authors; the annotations are © AuthZed, Inc.

Each annotation appears as a block quote after the paragraph it comments on, and quotes the text it refers to. Figures and tables are drawings on the web page, so only their captions appear here. The annotations are in ${sets.length === 1 ? 'one set' : `${sets.length} sets`}:

${setList}

---

${paper}
`;
}

/**
 * getLlmsTxt returns the site's llms.txt, which points language models at the
 * markdown edition of the paper.
 */
export function getLlmsTxt(sets: AnnotationSetSource[]): string {
  const authors = sets
    .map((set) => set.author?.name)
    .filter(Boolean)
    .join(' and ');
  return `# ${SITE_TITLE}

> The full text of “Zanzibar: Google’s Consistent, Global Authorization System”, presented at the ${PAPER_CONFERENCE} and annotated by ${authors} of AuthZed with commentary on the paper and lessons learned from building SpiceDB, the open source permissions database inspired by Zanzibar.

## Paper

- [Annotated paper in Markdown](${MARKDOWN_URL}): The whole paper, with every annotation following the paragraph it comments on
- [Annotated paper](${CANONICAL_URL_BASE}): The paper as a web page, with annotations beside the text

## Optional

- [Original paper at USENIX](${PAPER_SOURCE_URL}): The paper as published, without annotations
- [SpiceDB](https://github.com/authzed/spicedb): The open source, Zanzibar-inspired permissions database
- [AuthZed](https://authzed.com): The company behind SpiceDB and these annotations
`;
}
