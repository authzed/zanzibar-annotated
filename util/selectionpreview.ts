const BLOCK_SELECTOR =
  'p, li, h1, h2, h3, h4, h5, h6, figcaption, blockquote, td, th';
const HEADING_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);
const MAX_CONTEXT_LENGTH = 300;
const MATH_SELECTOR = '.katex';

/**
 * SelectionPreview is the text shown in a selection's social card image: the
 * selected text plus the surrounding text of the block(s) it appears in.
 */
export type SelectionPreview = {
  previous?: ContextBlock;
  before: string;
  selected: string;
  after: string;
  isHeading: boolean;
  next?: ContextBlock;
};

/**
 * ContextBlock is a neighboring block of text shown around the selection.
 */
export type ContextBlock = {
  text: string;
  isHeading: boolean;
};

/**
 * getSelectionPreview returns the selected text of the given ranges along with
 * the text that surrounds it in its containing block elements.
 */
export function getSelectionPreview(ranges: Range[]): SelectionPreview | null {
  if (ranges.length === 0) {
    return null;
  }

  const first = ranges[0];
  const last = ranges[ranges.length - 1];
  const doc = first.startContainer.ownerDocument!;
  const startBlock = findBlock(first.startContainer);
  const endBlock = findBlock(last.endContainer);

  const beforeRange = doc.createRange();
  beforeRange.selectNodeContents(startBlock);
  beforeRange.setEnd(first.startContainer, first.startOffset);

  const afterRange = doc.createRange();
  afterRange.selectNodeContents(endBlock);
  afterRange.setStart(last.endContainer, last.endOffset);

  const blocks = Array.from(doc.querySelectorAll(BLOCK_SELECTOR));
  const isUnrelated = (block: Element, to: Element) =>
    !block.contains(to) && !to.contains(block) && !!blockText(block);
  const previous = blocks
    .slice(0, blocks.indexOf(startBlock))
    .reverse()
    .find((b) => isUnrelated(b, startBlock));
  const next = blocks
    .slice(blocks.indexOf(endBlock) + 1)
    .find((b) => isUnrelated(b, endBlock));

  const preview: SelectionPreview = {
    before: trimBefore(rangeText(beforeRange).trimStart()),
    selected: ranges.map(rangeText).join(' ').trim(),
    after: trimAfter(rangeText(afterRange).trimEnd()),
    isHeading: isHeading(startBlock),
  };
  if (previous) {
    preview.previous = {
      text: trimBefore(blockText(previous)),
      isHeading: isHeading(previous),
    };
  }
  if (next) {
    preview.next = { text: trimAfter(blockText(next)), isHeading: isHeading(next) };
  }
  return preview;
}

function blockText(block: Element): string {
  const range = block.ownerDocument.createRange();
  range.selectNodeContents(block);
  return rangeText(range).trim();
}

// Returns the visible text in a range with whitespace collapsed. Rendered math
// is skipped: KaTeX output includes MathML and TeX source that would otherwise
// show up as raw markup.
function rangeText(range: Range): string {
  const root = range.commonAncestorContainer;
  const textNodes: Node[] = [];
  if (root.nodeType === 3 /* text */) {
    textNodes.push(root);
  } else {
    const walker = root.ownerDocument!.createTreeWalker(
      root,
      4 /* NodeFilter.SHOW_TEXT */
    );
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      textNodes.push(node);
    }
  }

  let text = '';
  for (const node of textNodes) {
    if (!range.intersectsNode(node) || node.parentElement?.closest(MATH_SELECTOR)) {
      continue;
    }
    const value = node.textContent ?? '';
    const start = node === range.startContainer ? range.startOffset : 0;
    const end = node === range.endContainer ? range.endOffset : value.length;
    text += value.slice(start, end);
  }
  return normalize(text);
}

function isHeading(block: Element): boolean {
  return HEADING_TAGS.has(block.tagName);
}

function findBlock(node: Node): Element {
  const element =
    node.nodeType === 1 /* element */ ? (node as Element) : node.parentElement!;
  return element.closest(BLOCK_SELECTOR) ?? element;
}

// Collapses whitespace and maps characters missing from the card font to
// equivalent ones it has.
function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/⟨/g, '〈').replace(/⟩/g, '〉');
}

// Keeps the end of the text closest to the selection, cutting at a word
// boundary.
function trimBefore(text: string): string {
  if (text.length <= MAX_CONTEXT_LENGTH) {
    return text;
  }
  const tail = text.slice(-MAX_CONTEXT_LENGTH);
  return `…${tail.slice(tail.indexOf(' ') + 1).trimStart()}`;
}

// Keeps the start of the text closest to the selection, cutting at a word
// boundary.
function trimAfter(text: string): string {
  if (text.length <= MAX_CONTEXT_LENGTH) {
    return text;
  }
  const head = text.slice(0, MAX_CONTEXT_LENGTH);
  return `${head.slice(0, head.lastIndexOf(' ')).trimEnd()}…`;
}

/**
 * Word is a single word of preview text, along with whether it is part of the
 * selection.
 */
export type Word = { text: string; selected: boolean };

/**
 * toWords splits text segments into words so they can be laid out as wrapping
 * flex items. Each word carries its trailing space so that the selection
 * highlight is continuous between selected words, while spaces bordering the
 * selection stay outside of it.
 */
export function toWords(segments: [string, boolean][]): Word[] {
  const words: Word[] = [];
  for (const [text, selected] of segments) {
    for (const match of text.matchAll(/\s+|\S+\s*/g)) {
      if (/^\s/.test(match[0])) {
        // Leading whitespace of a segment.
        words.push({ text: match[0], selected: false });
      } else if (selected && match.index + match[0].length === text.length) {
        // Keep the highlight from extending past the last selected word.
        const trimmed = match[0].trimEnd();
        words.push({ text: trimmed, selected: true });
        if (trimmed !== match[0]) {
          words.push({ text: match[0].slice(trimmed.length), selected: false });
        }
      } else {
        words.push({ text: match[0], selected });
      }
    }
  }
  return words;
}
