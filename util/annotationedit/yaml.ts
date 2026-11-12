import { EditRefusal } from './mdx';

/**
 * NewEntry is an annotation to add to an annotation set.
 */
export type NewEntry = {
  // The group the annotation is shown in, e.g. `page-2-col-1`.
  groupId: string;
  entryId: string;
  content: string;
  // The entry of the same group to place the annotation before. If it's
  // missing or isn't in the group, the annotation goes last.
  beforeEntryId?: string;
};

/**
 * NewAddendum is an addendum to add to an existing annotation.
 */
export type NewAddendum = {
  entryId: string;
  // The day the addendum was written, as YYYY-MM-DD.
  date: string;
  author?: string;
  content: string;
};

// The annotation sets are edited as text, rather than being parsed and written
// back out, so that everything else in them stays exactly as it was written.
// These are the indentations their files use.
const GROUP_INDENT = 2;
const ENTRY_INDENT = 4;
const ENTRY_KEY_INDENT = 6;
const ADDENDUM_INDENT = 8;

const GROUP = /^  (page-(\d+)-col-(\d+)):\s*$/;

const indent = (count: number) => ' '.repeat(count);
const isBlank = (line: string) => line.trim() === '';
const indentOf = (line: string) => line.length - line.trimStart().length;
const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The index of the line that starts the `groups` of the set.
function groupsStart(lines: string[]): number {
  const index = lines.findIndex((line) => /^groups:\s*$/.test(line));
  if (index < 0) {
    throw new EditRefusal('The annotation set has no groups');
  }
  return index;
}

// The index of the line that starts an entry, or -1.
function findEntry(lines: string[], entryId: string): number {
  const entry = new RegExp(
    `^${indent(ENTRY_INDENT)}${escapeRegExp(entryId)}:\\s*$`
  );
  return lines.findIndex(
    (line, index) => index > groupsStart(lines) && entry.test(line)
  );
}

// The index of the line after the block that starts at the given line, which
// is indented by the given amount. Blank lines that follow the block aren't
// part of it.
function blockEnd(lines: string[], start: number, blockIndent: number): number {
  let end = start + 1;
  while (
    end < lines.length &&
    (isBlank(lines[end]) || indentOf(lines[end]) > blockIndent)
  ) {
    end++;
  }
  while (end > start + 1 && isBlank(lines[end - 1])) {
    end--;
  }
  return end;
}

// The lines of a block scalar holding the given text, indented by the given
// amount.
function blockScalar(content: string, by: number, what: string): string[] {
  const lines = content
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd());
  while (lines.length > 0 && isBlank(lines[0])) {
    lines.shift();
  }
  while (lines.length > 0 && isBlank(lines[lines.length - 1])) {
    lines.pop();
  }
  if (lines.length === 0) {
    throw new EditRefusal(`${what} text is empty`);
  }

  // The first line sets the indentation of the block.
  lines[0] = lines[0].trimStart();
  return lines.map((line) => (line ? indent(by) + line : ''));
}

/**
 * hasEntry returns whether an annotation set has an annotation with the given
 * id, in any of its groups.
 */
export function hasEntry(yaml: string, entryId: string): boolean {
  return findEntry(yaml.split('\n'), entryId) >= 0;
}

/**
 * groupOf returns the id of the group that an annotation is listed under, if
 * the set has the annotation.
 */
export function groupOf(yaml: string, entryId: string): string | undefined {
  const lines = yaml.split('\n');
  for (let index = findEntry(lines, entryId); index >= 0; index--) {
    const group = GROUP.exec(lines[index]);
    if (group) {
      return group[1];
    }
  }
  return undefined;
}

/**
 * insertAnnotation returns the source of an annotation set with an annotation
 * added to it. The group is created if the set doesn't have it yet.
 */
export function insertAnnotation(yaml: string, entry: NewEntry): string {
  const lines = yaml.split('\n');
  if (findEntry(lines, entry.entryId) >= 0) {
    throw new EditRefusal(
      `Entry id "${entry.entryId}" already exists in this set`
    );
  }

  const target = GROUP.exec(`${indent(GROUP_INDENT)}${entry.groupId}:`);
  if (!target) {
    throw new EditRefusal(`"${entry.groupId}" is not a group of a page`);
  }

  const entryLines = [
    `${indent(ENTRY_INDENT)}${entry.entryId}:`,
    `${indent(ENTRY_KEY_INDENT)}content: |`,
    ...blockScalar(entry.content, ENTRY_KEY_INDENT + 2, 'Annotation'),
  ];

  const first = groupsStart(lines) + 1;
  const groupLine = lines.findIndex(
    (line, index) => index >= first && GROUP.exec(line)?.[1] === entry.groupId
  );

  if (groupLine >= 0) {
    const end = blockEnd(lines, groupLine, GROUP_INDENT);
    const before = entry.beforeEntryId
      ? findEntry(lines, entry.beforeEntryId)
      : -1;
    const at = before > groupLine && before < end ? before : end;
    lines.splice(at, 0, ...entryLines);
    return lines.join('\n');
  }

  // Add the group before the first one that's later in the paper.
  const order = (match: RegExpExecArray) =>
    Number(match[2]) * 1000 + Number(match[3]);
  const following = lines.findIndex((line, index) => {
    const match = index >= first ? GROUP.exec(line) : null;
    return !!match && order(match) > order(target);
  });

  const newGroup = [`${indent(GROUP_INDENT)}${entry.groupId}:`, ...entryLines];
  if (following >= 0) {
    lines.splice(following, 0, ...newGroup, '');
  } else {
    const end = blockEnd(lines, first - 1, 0);
    lines.splice(end, 0, ...(end > first ? [''] : []), ...newGroup);
  }
  return lines.join('\n');
}

/**
 * appendAddendum returns the source of an annotation set with an addendum
 * added to one of its annotations, after any that it already has.
 */
export function appendAddendum(yaml: string, addendum: NewAddendum): string {
  const lines = yaml.split('\n');
  const entryLine = findEntry(lines, addendum.entryId);
  if (entryLine < 0) {
    throw new EditRefusal(`No annotation "${addendum.entryId}" in this set`);
  }

  const author = addendum.author?.replace(/\s+/g, ' ').trim();
  const item = [
    `${indent(ADDENDUM_INDENT)}- date: '${addendum.date}'`,
    ...(author
      ? [`${indent(ADDENDUM_INDENT + 2)}author: '${author.replace(/'/g, "''")}'`]
      : []),
    `${indent(ADDENDUM_INDENT + 2)}content: |`,
    ...blockScalar(addendum.content, ADDENDUM_INDENT + 4, 'Addendum'),
  ];

  const entryEnd = blockEnd(lines, entryLine, ENTRY_INDENT);
  const addendaLine = lines.findIndex(
    (line, index) =>
      index > entryLine &&
      index < entryEnd &&
      /^ {6}addenda:\s*$/.test(line)
  );

  if (addendaLine >= 0) {
    lines.splice(blockEnd(lines, addendaLine, ENTRY_KEY_INDENT), 0, ...item);
  } else {
    lines.splice(entryEnd, 0, `${indent(ENTRY_KEY_INDENT)}addenda:`, ...item);
  }
  return lines.join('\n');
}
