import fs from 'fs';
import { load } from 'js-yaml';
import path from 'path';
import { describe, expect, test } from 'vitest';
import { EditRefusal } from './mdx';
import { appendAddendum, groupOf, hasEntry, insertAnnotation } from './yaml';

// The start of content/annotations-intro.yaml.
const FIXTURE = `id: 'intro'
label: 'Introduction to Zanzibar'
highlightColor: 'amber'
author:
  name: 'Jake Moshenko'
groups:
  page-1-col-2:
    across-applications:
      content: |
        This can also come into play when you have multiple micro-services trying to access authorization data.
    gmail-example:
      content: |
        Concrete example that I use in talks: sending an email through Gmail, _and allow you to grant it right from within Gmail_.
    set-operations-list:
      content: |
        At no point in the paper is the full list of operators outlined.

  page-2-col-1:
    gaia-ids-shortcut:
      content: |
        This is one of the interesting Google-isms inherent in Zanzibar.

        Outside of Google, one can't make such strong claims about users and how one should refer to them.
    pointer-chasing:
      content: |
        Outside of Google, this problem is not just for group membership.

  page-2-col-2:
    uptime-fine-print:
      content: |
        Make sure to read the fine-print in [§4.3](#4.3-availability).
`;

type Parsed = {
  groups: Record<
    string,
    Record<
      string,
      {
        content: string;
        addenda?: { date: unknown; author?: string; content: string }[];
      }
    >
  >;
};

const parse = (yaml: string) => load(yaml) as Parsed;

// The lines of `result` that aren't in the fixture, in order.
function addedLines(result: string): string[] {
  const original = FIXTURE.split('\n');
  const added: string[] = [];
  let position = 0;
  for (const line of result.split('\n')) {
    if (line === original[position]) {
      position++;
    } else {
      added.push(line);
    }
  }
  // Everything in the fixture is still there, in the same order.
  expect(position).toBe(original.length);
  return added;
}

describe('insertAnnotation', () => {
  test('appends to an existing group', () => {
    const result = insertAnnotation(FIXTURE, {
      groupId: 'page-1-col-2',
      entryId: 'new-entry',
      content: 'A new note.',
    });
    const group = parse(result).groups['page-1-col-2'];
    expect(Object.keys(group)).toEqual([
      'across-applications',
      'gmail-example',
      'set-operations-list',
      'new-entry',
    ]);
    expect(group['new-entry']).toEqual({ content: 'A new note.\n' });
    expect(addedLines(result)).toEqual([
      '    new-entry:',
      '      content: |',
      '        A new note.',
    ]);
  });

  test('inserts before beforeEntryId', () => {
    const result = insertAnnotation(FIXTURE, {
      groupId: 'page-1-col-2',
      entryId: 'new-entry',
      content: 'A new note.',
      beforeEntryId: 'gmail-example',
    });
    expect(Object.keys(parse(result).groups['page-1-col-2'])).toEqual([
      'across-applications',
      'new-entry',
      'gmail-example',
      'set-operations-list',
    ]);
    expect(addedLines(result)).toHaveLength(3);
  });

  test('a beforeEntryId from another group is ignored', () => {
    const result = insertAnnotation(FIXTURE, {
      groupId: 'page-1-col-2',
      entryId: 'new-entry',
      content: 'A new note.',
      beforeEntryId: 'pointer-chasing',
    });
    expect(Object.keys(parse(result).groups['page-1-col-2']).at(-1)).toBe(
      'new-entry'
    );
    expect(Object.keys(parse(result).groups['page-2-col-1'])).toEqual([
      'gaia-ids-shortcut',
      'pointer-chasing',
    ]);
  });

  test('appends to the last group of the file', () => {
    const result = insertAnnotation(FIXTURE, {
      groupId: 'page-2-col-2',
      entryId: 'new-entry',
      content: 'A new note.',
    });
    expect(Object.keys(parse(result).groups['page-2-col-2'])).toEqual([
      'uptime-fine-print',
      'new-entry',
    ]);
    expect(result.endsWith('        A new note.\n')).toBe(true);
    expect(addedLines(result)).toHaveLength(3);
  });

  test.each([
    ['page-1-col-1', 0],
    ['page-2-col-0', 1],
    ['page-9-col-1', 3],
    ['page-10-col-1', 3],
  ])('creates the missing group %s in page order', (groupId, position) => {
    const result = insertAnnotation(FIXTURE, {
      groupId,
      entryId: 'new-entry',
      content: 'A new note.',
    });
    const groups = parse(result).groups;
    expect(Object.keys(groups).indexOf(groupId)).toBe(position);
    expect(groups[groupId]).toEqual({
      'new-entry': { content: 'A new note.\n' },
    });
    expect(addedLines(result).filter(Boolean)).toEqual([
      `  ${groupId}:`,
      '    new-entry:',
      '      content: |',
      '        A new note.',
    ]);
  });

  test('a duplicate entry id anywhere in the set is refused', () => {
    expect(() =>
      insertAnnotation(FIXTURE, {
        groupId: 'page-1-col-2',
        entryId: 'pointer-chasing',
        content: 'A new note.',
      })
    ).toThrow(/already exists/);
  });

  test('multi-paragraph content round-trips', () => {
    const result = insertAnnotation(FIXTURE, {
      groupId: 'page-2-col-1',
      entryId: 'new-entry',
      content: 'First paragraph.\nSame paragraph.\n\nSecond *paragraph*.',
    });
    expect(parse(result).groups['page-2-col-1']['new-entry'].content).toBe(
      'First paragraph.\nSame paragraph.\n\nSecond *paragraph*.\n'
    );
  });

  test('content that looks like YAML round-trips', () => {
    const result = insertAnnotation(FIXTURE, {
      groupId: 'page-1-col-2',
      entryId: 'new-entry',
      content:
        '\n- a list\n# not a comment\nkey: value\r\n\r\ntrailing spaces   \n  indented: "quoted" \'single\'\nlast | > & * !\n\n',
    });
    expect(parse(result).groups['page-1-col-2']['new-entry'].content).toBe(
      '- a list\n# not a comment\nkey: value\n\ntrailing spaces\n  indented: "quoted" \'single\'\nlast | > & * !\n'
    );
    // The entries around it are untouched.
    expect(Object.keys(parse(result).groups['page-2-col-1'])).toHaveLength(2);
  });

  test('empty content is refused', () => {
    expect(() =>
      insertAnnotation(FIXTURE, {
        groupId: 'page-1-col-2',
        entryId: 'new-entry',
        content: '  \n\n ',
      })
    ).toThrow(EditRefusal);
  });
});

describe('groupOf', () => {
  test('finds the group an entry is listed under', () => {
    expect(groupOf(FIXTURE, 'across-applications')).toBe('page-1-col-2');
    expect(groupOf(FIXTURE, 'pointer-chasing')).toBe('page-2-col-1');
    expect(groupOf(FIXTURE, 'uptime-fine-print')).toBe('page-2-col-2');
    expect(groupOf(FIXTURE, 'nope')).toBeUndefined();
  });
});

describe('hasEntry', () => {
  test('finds entries in any group, and only entries', () => {
    expect(hasEntry(FIXTURE, 'pointer-chasing')).toBe(true);
    expect(hasEntry(FIXTURE, 'across-applications')).toBe(true);
    expect(hasEntry(FIXTURE, 'page-1-col-2')).toBe(false);
    expect(hasEntry(FIXTURE, 'content')).toBe(false);
    expect(hasEntry(FIXTURE, 'pointer')).toBe(false);
  });
});

describe('appendAddendum', () => {
  const first = () =>
    appendAddendum(FIXTURE, {
      entryId: 'gmail-example',
      date: '2026-11-12',
      content: 'Since then, things changed.',
    });

  test('the first addendum adds the addenda key', () => {
    const result = first();
    expect(parse(result).groups['page-1-col-2']['gmail-example']).toEqual({
      content: expect.stringContaining('Concrete example'),
      addenda: [{ date: '2026-11-12', content: 'Since then, things changed.\n' }],
    });
    expect(addedLines(result)).toEqual([
      '      addenda:',
      "        - date: '2026-11-12'",
      '          content: |',
      '            Since then, things changed.',
    ]);
  });

  test('the date stays a string', () => {
    const entry = parse(first()).groups['page-1-col-2']['gmail-example'];
    expect(typeof entry.addenda![0].date).toBe('string');
  });

  test('a second addendum follows the first', () => {
    const result = appendAddendum(first(), {
      entryId: 'gmail-example',
      date: '2026-12-01',
      author: 'Joey Schorr',
      content: 'And again.',
    });
    expect(
      parse(result).groups['page-1-col-2']['gmail-example'].addenda
    ).toEqual([
      { date: '2026-11-12', content: 'Since then, things changed.\n' },
      { date: '2026-12-01', author: 'Joey Schorr', content: 'And again.\n' },
    ]);
    expect(result.match(/addenda:/g)).toHaveLength(1);
  });

  test('an author with an apostrophe round-trips', () => {
    const result = appendAddendum(FIXTURE, {
      entryId: 'gmail-example',
      date: '2026-11-12',
      author: "Pat O'Brien: \"the\" #1",
      content: 'Note.',
    });
    expect(
      parse(result).groups['page-1-col-2']['gmail-example'].addenda![0].author
    ).toBe("Pat O'Brien: \"the\" #1");
  });

  test('a blank author is left out', () => {
    const result = appendAddendum(FIXTURE, {
      entryId: 'gmail-example',
      date: '2026-11-12',
      author: '   ',
      content: 'Note.',
    });
    expect(result).not.toContain('          author:');
    expect(
      parse(result).groups['page-1-col-2']['gmail-example'].addenda![0]
    ).toEqual({ date: '2026-11-12', content: 'Note.\n' });
  });

  test('on the last entry of a group', () => {
    const result = appendAddendum(FIXTURE, {
      entryId: 'set-operations-list',
      date: '2026-11-12',
      content: 'Note.',
    });
    const groups = parse(result).groups;
    expect(groups['page-1-col-2']['set-operations-list'].addenda).toHaveLength(1);
    expect(Object.keys(groups['page-2-col-1'])).toEqual([
      'gaia-ids-shortcut',
      'pointer-chasing',
    ]);
    expect(addedLines(result)).toHaveLength(4);
  });

  test('on an entry with several paragraphs', () => {
    const result = appendAddendum(FIXTURE, {
      entryId: 'gaia-ids-shortcut',
      date: '2026-11-12',
      content: 'One.\n\nTwo.',
    });
    const entry = parse(result).groups['page-2-col-1']['gaia-ids-shortcut'];
    expect(entry.content).toContain('Outside of Google');
    expect(entry.addenda).toEqual([
      { date: '2026-11-12', content: 'One.\n\nTwo.\n' },
    ]);
  });

  test('on the last entry of the file', () => {
    const result = appendAddendum(FIXTURE, {
      entryId: 'uptime-fine-print',
      date: '2026-11-12',
      content: 'Note.',
    });
    expect(
      parse(result).groups['page-2-col-2']['uptime-fine-print'].addenda
    ).toEqual([{ date: '2026-11-12', content: 'Note.\n' }]);
    expect(result.endsWith('            Note.\n')).toBe(true);
  });

  test('an unknown entry is refused', () => {
    expect(() =>
      appendAddendum(FIXTURE, {
        entryId: 'nope',
        date: '2026-11-12',
        content: 'Note.',
      })
    ).toThrow(/No annotation "nope"/);
  });

  test('empty content is refused', () => {
    expect(() =>
      appendAddendum(FIXTURE, {
        entryId: 'gmail-example',
        date: '2026-11-12',
        content: ' ',
      })
    ).toThrow(EditRefusal);
  });
});

describe.each(['intro', 'spicedb'])('the %s annotation set', (setId) => {
  const source = fs.readFileSync(
    path.join(__dirname, `../../content/annotations-${setId}.yaml`),
    'utf8'
  );
  const original = parse(source);
  const entries = Object.entries(original.groups).flatMap(([groupId, group]) =>
    Object.keys(group).map((entryId) => [groupId, entryId])
  );

  test.each(entries)('takes an addendum on %s/%s', (groupId, entryId) => {
    const result = parse(
      appendAddendum(source, { entryId, date: '2026-11-12', content: 'Note.' })
    );
    const { addenda, ...rest } = result.groups[groupId][entryId];
    expect(addenda?.at(-1)).toEqual({ date: '2026-11-12', content: 'Note.\n' });
    expect(rest.content).toBe(original.groups[groupId][entryId].content);

    // Nothing else changed.
    result.groups[groupId][entryId] = original.groups[groupId][entryId];
    expect(result).toEqual(original);
  });

  test.each(Object.keys(original.groups))(
    'takes an annotation at the start and end of %s',
    (groupId) => {
      const [firstEntry] = Object.keys(original.groups[groupId]);
      for (const beforeEntryId of [firstEntry, undefined]) {
        const result = parse(
          insertAnnotation(source, {
            groupId,
            entryId: 'a-new-entry',
            content: 'Note.',
            beforeEntryId,
          })
        );
        const keys = Object.keys(result.groups[groupId]);
        expect(keys.indexOf('a-new-entry')).toBe(
          beforeEntryId ? 0 : keys.length - 1
        );
        delete result.groups[groupId]['a-new-entry'];
        expect(result).toEqual(original);
      }
    }
  );
});
