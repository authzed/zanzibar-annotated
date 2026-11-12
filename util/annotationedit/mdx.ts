/**
 * EditRefusal is thrown when an edit can't be made safely. Its message is
 * shown to the person editing.
 */
export class EditRefusal extends Error {}

/**
 * PassageSelection is text selected on the rendered paper.
 */
export type PassageSelection = {
  pageNumber: number;
  // The column of the page the selection is in, starting from 1.
  column: number;
  selectedText: string;
  // The rendered text just before and after the selection, used to tell apart
  // passages that read the same. Either may be empty.
  before: string;
  after: string;
};

type Token = {
  start: number;
  end: number;
  // For a marker or an end of a link, the index of the token at the other end
  // of what it marks, if it has one.
  partner?: number;
} & (
  // A character is `inCode` if it's code, when it's the index of the backtick
  // that opens the code.
  | { kind: 'char'; ch: string; inCode?: number }
  // An emphasis marker or a backtick.
  | { kind: 'marker'; marker: string }
  | { kind: 'linkOpen' | 'linkClose' }
  | { kind: 'highlightOpen' | 'highlightClose' }
  | { kind: 'tag' }
  // Text can't be selected across these.
  | { kind: 'paragraphBreak' | 'math' }
);

// Stand in for the barriers in the text that selections are matched against.
const PARAGRAPH_BREAK = '\u0001';
const MATH = '\u0002';

// How much of the text around a selection has to agree with the source.
const CONTEXT_LENGTH = 20;

const MIN_SELECTION_LENGTH = 3;

const isAlphanumeric = (ch: string | undefined) =>
  !!ch && /[\p{L}\p{N}]/u.test(ch);

/**
 * columnRange returns where the content of a column of a page starts and ends
 * in the paper's source, if the page has that column.
 */
export function columnRange(
  mdx: string,
  pageNumber: number,
  column: number
): { start: number; end: number } | undefined {
  const pageOpen = `<Page pageNumber={${pageNumber}}>`;
  const pageStart = mdx.indexOf(pageOpen);
  if (pageStart < 0) {
    return undefined;
  }
  let pageEnd = mdx.indexOf('</Page>', pageStart);
  if (pageEnd < 0) {
    pageEnd = mdx.length;
  }

  let position = pageStart;
  for (let found = 1; ; found++) {
    const open = mdx.indexOf('<Column>', position);
    if (open < 0 || open >= pageEnd) {
      return undefined;
    }
    const start = open + '<Column>'.length;
    const end = mdx.indexOf('</Column>', start);
    if (end < 0 || end > pageEnd) {
      return undefined;
    }
    if (found === column) {
      return { start, end };
    }
    position = end;
  }
}

/**
 * tokenize splits a range of the paper's source into the characters a reader
 * sees and the syntax around them.
 */
function tokenize(mdx: string, from: number, to: number): Token[] {
  const tokens: Token[] = [];
  // Where the `](url)` of each link starts, and where it ends.
  const linkEnds = new Map<number, number>();
  let inCode = false;
  let lineStart = true;
  // The markers and links that are open, by the index of their tokens.
  let openMarkers = new Map<string, number>();
  let openLinks: number[] = [];

  const pair = (open: number | undefined, close: number) => {
    if (open !== undefined) {
      tokens[open].partner = close;
      tokens[close].partner = open;
    }
  };
  const addMarker = (marker: string, start: number) => {
    tokens.push({ kind: 'marker', marker, start, end: start + marker.length });
    if (openMarkers.has(marker)) {
      pair(openMarkers.get(marker), tokens.length - 1);
      openMarkers.delete(marker);
    } else {
      openMarkers.set(marker, tokens.length - 1);
    }
  };
  // Nothing stays open from one paragraph to the next.
  const addParagraphBreak = (at: number) => {
    tokens.push({ kind: 'paragraphBreak', start: at, end: at });
    openMarkers = new Map();
    openLinks = [];
    inCode = false;
  };

  for (let i = from; i < to; ) {
    const ch = mdx[i];

    if (ch === '\n') {
      // A blank line ends a paragraph.
      const blank = /^\n[ \t]*\n/.exec(mdx.slice(i, to));
      if (blank) {
        addParagraphBreak(i);
      }
      lineStart = true;
      i++;
      continue;
    }

    if (lineStart) {
      lineStart = false;
      // Headings and list items are blocks of their own.
      const block = /^[ \t]*(#{1,6}[ \t]+|\*[ \t]+|\d+\.[ \t]+)/.exec(
        mdx.slice(i, to)
      );
      if (block) {
        addParagraphBreak(i);
        i += block[0].length;
        continue;
      }
    }

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === '`') {
      inCode = !inCode;
      addMarker('`', i);
      i++;
      continue;
    }

    if (inCode) {
      tokens.push({
        kind: 'char',
        ch,
        start: i,
        end: i + 1,
        inCode: openMarkers.get('`'),
      });
      i++;
      continue;
    }

    if (ch === '\\' && i + 1 < to) {
      tokens.push({ kind: 'char', ch: mdx[i + 1], start: i, end: i + 2 });
      i += 2;
      continue;
    }

    if (ch === '$') {
      const delimiter = mdx.startsWith('$$', i) ? '$$' : '$';
      let close = i + delimiter.length;
      while (close < to && !mdx.startsWith(delimiter, close)) {
        close += mdx[close] === '\\' ? 2 : 1;
      }
      if (close < to) {
        tokens.push({ kind: 'math', start: i, end: close + delimiter.length });
        i = close + delimiter.length;
        continue;
      }
    }

    if (ch === '<' && /^<\/?[A-Za-z]/.test(mdx.slice(i, i + 3))) {
      // The tag ends at the first `>` outside of a `{}` expression.
      let depth = 0;
      let close = i + 1;
      for (; close < to; close++) {
        if (mdx[close] === '{') depth++;
        else if (mdx[close] === '}') depth--;
        else if (mdx[close] === '>' && depth === 0) break;
      }
      if (close < to) {
        const tag = mdx.slice(i, close + 1);
        const kind = tag.startsWith('</Highlight')
          ? 'highlightClose'
          : /^<Highlight\b/.test(tag) && !tag.endsWith('/>')
            ? 'highlightOpen'
            : 'tag';
        tokens.push({ kind, start: i, end: close + 1 });
        i = close + 1;
        continue;
      }
    }

    if (ch === '[') {
      // A bracket opens a link if its closing bracket is followed by `(`.
      let depth = 0;
      let close = i;
      for (; close < to; close++) {
        if (mdx[close] === '\\') close++;
        else if (mdx[close] === '[') depth++;
        else if (mdx[close] === ']' && --depth === 0) break;
        else if (mdx[close] === '\n' && /^\n[ \t]*\n/.test(mdx.slice(close)))
          break;
      }
      if (mdx[close] === ']' && mdx[close + 1] === '(') {
        const urlEnd = mdx.indexOf(')', close);
        if (urlEnd >= 0 && urlEnd < to && !mdx.slice(close, urlEnd).includes('\n')) {
          linkEnds.set(close, urlEnd + 1);
          tokens.push({ kind: 'linkOpen', start: i, end: i + 1 });
          openLinks.push(tokens.length - 1);
          i++;
          continue;
        }
      }
    }

    if (ch === ']' && linkEnds.has(i)) {
      const end = linkEnds.get(i)!;
      tokens.push({ kind: 'linkClose', start: i, end });
      pair(openLinks.pop(), tokens.length - 1);
      i = end;
      continue;
    }

    if (
      ch === '*' ||
      (ch === '_' && !(isAlphanumeric(mdx[i - 1]) && isAlphanumeric(mdx[i + 1])))
    ) {
      // Two of them mark bold text, which is a marker of its own.
      const marker = mdx[i + 1] === ch ? ch + ch : ch;
      addMarker(marker, i);
      i += marker.length;
      continue;
    }

    // Characters outside the basic plane are two code units long.
    const length = mdx.codePointAt(i)! > 0xffff ? 2 : 1;
    tokens.push({ kind: 'char', ch: mdx.slice(i, i + length), start: i, end: i + length });
    i += length;
  }

  return tokens;
}

// The text a selection is matched against: a character for each visible
// character and barrier, in step with the tokens they came from.
function matchable(tokens: Token[]): { text: string; tokenIndexes: number[] } {
  let text = '';
  const tokenIndexes: number[] = [];
  tokens.forEach((token, index) => {
    const chars =
      token.kind === 'char'
        ? token.ch
        : token.kind === 'paragraphBreak'
          ? PARAGRAPH_BREAK
          : token.kind === 'math'
            ? MATH
            : '';
    for (let i = 0; i < chars.length; i++) {
      tokenIndexes.push(index);
    }
    text += chars;
  });
  return { text, tokenIndexes };
}

const withoutWhitespace = (text: string) => text.replace(/\s+/g, '');
const withoutBarriers = (text: string) =>
  text.replaceAll(PARAGRAPH_BREAK, '').replaceAll(MATH, '');

function allIndexesOf(text: string, needle: string): number[] {
  const indexes: number[] = [];
  for (
    let index = text.indexOf(needle);
    index >= 0;
    index = text.indexOf(needle, index + 1)
  ) {
    indexes.push(index);
  }
  return indexes;
}

/**
 * wrapPassage returns the paper's source with the selected passage wrapped in
 * a Highlight for the given annotation. It throws an EditRefusal if the
 * passage can't be found exactly once, or can't be wrapped without breaking
 * the markup around it.
 */
export function wrapPassage(
  mdx: string,
  selection: PassageSelection,
  setId: string,
  entryId: string
): string {
  const { pageNumber, column } = selection;
  const where = `page ${pageNumber}, column ${column}`;

  const range = columnRange(mdx, pageNumber, column);
  if (!range) {
    throw new EditRefusal(`Page ${pageNumber} has no column ${column}`);
  }

  const needle = withoutWhitespace(selection.selectedText);
  if ([...needle].length < MIN_SELECTION_LENGTH) {
    throw new EditRefusal(
      `Select at least ${MIN_SELECTION_LENGTH} characters to annotate`
    );
  }

  const tokens = tokenize(mdx, range.start, range.end);
  const { text, tokenIndexes } = matchable(tokens);

  let matches = allIndexesOf(text, needle);
  if (matches.length === 0) {
    const plain = withoutBarriers(text);
    const found = plain.indexOf(needle);
    if (found < 0) {
      throw new EditRefusal(`Couldn't find the selected text in ${where}`);
    }

    // The passage is there, but with something in the middle of it.
    let seen = 0;
    let crossed = '';
    for (const ch of text) {
      if (ch === PARAGRAPH_BREAK || ch === MATH) {
        if (seen > found && seen < found + needle.length) {
          crossed += ch;
        }
      } else {
        seen += ch.length;
      }
    }
    throw new EditRefusal(
      crossed.includes(MATH)
        ? 'Selection includes math, which can’t be annotated from here'
        : 'Selection crosses a paragraph break; select within one paragraph'
    );
  }

  // The text around the selection has to agree with the text around the
  // match, on at least one side. It tells apart passages that read the same,
  // and catches text that was selected where it isn't in the source as such,
  // as in rendered math, but reads the same as text that is.
  const before = withoutWhitespace(selection.before).slice(-CONTEXT_LENGTH);
  const after = withoutWhitespace(selection.after).slice(0, CONTEXT_LENGTH);
  const total = matches.length;
  if (before || after) {
    matches = matches.filter(
      (index) =>
        (before && withoutBarriers(text.slice(0, index)).endsWith(before)) ||
        (after &&
          withoutBarriers(text.slice(index + needle.length)).startsWith(after))
    );
  }
  if (matches.length !== 1) {
    throw new EditRefusal(
      total === 1
        ? `The selected text is in ${where}, but the text around it there doesn't match the selection`
        : `Selected text matches ${total} places in ${where}; select a longer passage`
    );
  }

  let first = tokenIndexes[matches[0]];
  let last = tokenIndexes[matches[0] + needle.length - 1];

  // Whatever starts or ends within the passage has to do both within it:
  // emphasis, code and links. An end that sits right against the passage is
  // taken into it, so that `_italic text_` is wrapped whole, and anything
  // else would be split in two by the highlight.
  const needed = (index: number): number[] => {
    const token = tokens[index];
    if (token.kind === 'char') {
      // Code is highlighted whole: a highlight inside it would be shown as
      // code itself.
      return token.inCode === undefined
        ? []
        : [token.inCode, tokens[token.inCode].partner ?? -1];
    }
    if (
      token.kind === 'marker' ||
      token.kind === 'linkOpen' ||
      token.kind === 'linkClose'
    ) {
      return [token.partner ?? -1];
    }
    return [];
  };
  for (let settled = false; !settled; ) {
    settled = true;
    for (let i = first; i <= last && settled; i++) {
      for (const other of needed(i)) {
        if (other >= first && other <= last) {
          continue;
        }
        if (other === last + 1) {
          last++;
        } else if (other === first - 1 && other >= 0) {
          first--;
        } else {
          throw new EditRefusal(
            tokens[i].kind === 'linkOpen' || tokens[i].kind === 'linkClose'
              ? 'Highlighting this would split a link; select all of the link or none of it'
              : 'Highlighting this would split italic, bold or code text; select all of it or none of it'
          );
        }
        settled = false;
        break;
      }
    }
  }
  // Emphasis around the whole passage is taken in too.
  while (
    first > 0 &&
    tokens[first - 1].kind === 'marker' &&
    tokens[first - 1].partner === last + 1
  ) {
    first--;
    last++;
  }

  let highlights = 0;
  for (let i = first; i <= last; i++) {
    const kind = tokens[i].kind;
    if (kind === 'tag') {
      throw new EditRefusal(
        'Selection includes an embedded component, which can’t be annotated from here'
      );
    }
    if (kind === 'highlightOpen') highlights++;
    if (kind === 'highlightClose' && --highlights < 0) break;
  }
  if (highlights !== 0) {
    throw new EditRefusal(
      'Selection partially overlaps an existing highlight; select all of it or stay inside it'
    );
  }

  const start = tokens[first].start;
  const end = tokens[last].end;
  return (
    mdx.slice(0, start) +
    `<Highlight setId="${setId}" entryId="${entryId}">` +
    mdx.slice(start, end) +
    '</Highlight>' +
    mdx.slice(end)
  );
}

/**
 * highlightOrder returns the entry ids of a set's highlights in a column of a
 * page, in the order they appear.
 */
export function highlightOrder(
  mdx: string,
  pageNumber: number,
  column: number,
  setId: string
): string[] {
  const range = columnRange(mdx, pageNumber, column);
  if (!range) {
    return [];
  }

  return Array.from(
    mdx
      .slice(range.start, range.end)
      .matchAll(/<Highlight\s+setId="([^"]+)"\s+entryId="([^"]+)"/g)
  )
    .filter((match) => match[1] === setId)
    .map((match) => match[2]);
}
