import fs from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';
import {
  columnRange,
  EditRefusal,
  highlightOrder,
  PassageSelection,
  wrapPassage,
} from './mdx';

// Lines taken from content/zanzibar.mdx.
const FIXTURE = `import { Column, Header, Page, Section } from '../components/layout';

<Page pageNumber={1}>

<Header>

# Zanzibar: Google’s Consistent, Global Authorization System

</Header>

<Column>

## Abstract

<Section titles={["Abstract"]}>
Determining whether online users are authorized to access digital objects is central to preserving privacy.
Zanzibar provides a uniform data model and <Highlight setId="spicedb" entryId="config-language">configuration language</Highlight> for expressing a wide range of access control policies from hundreds of client services at Google, including Calendar, Cloud, Drive, Maps, Photos, and YouTube.
Zanzibar scales to trillions of access control lists and millions of authorization requests per second to support services used by billions of people.
</Section>

</Column>
<Column>

<Section titles={["1 Introduction"]}>

semantics and user experience <Highlight setId="intro" entryId="across-applications">across applications</Highlight>.
Finally, as we show below, authorization poses unique challenges involving data consistency and scalability.
It saves engineering resources to tackle them once across applications.

We have the following goals for the Zanzibar system:

* _Correctness_: It must ensure consistency of access control decisions to respect user intentions.
* _Flexibility_: It must support a rich set of access control policies.

The language allows clients to define arbitrary relations between users and objects, such as \`owner\`, \`editor\`, \`commenter\`, and \`viewer\`.

</Section>
</Column>

<PageFooter numberLabel="1" />

</Page>

<Page pageNumber={2}>
<Column>

A simple ACL takes the form of <Highlight setId="intro" entryId="gaia-ids-shortcut">“user _U_ has relation _R_ to object _O_”</Highlight>.
ACLs can thus refer to other ACLs, for example to specify that the set of users who can comment on a video.

Zanzibar provides these ordering properties by storing ACLs in a globally distributed database system with external consistency guarantees. [[15](#references-15), [18](#references-18)]

In Zanzibar, ACLs are collections of object-user or object-object relations represented as _relation tuples_.

$\\lang object \\rang \\coloncolonequals \\lang namespace \\rang$

where 〈_namespace_〉 and 〈_relation_〉 are predefined in client configurations [(§2.3)](#2.3-namespace-configuration), 〈_object id_〉 is a string.

</Column>
<Column>

Only in the second column of page two.

</Column>
</Page>
`;

function sel(
  pageNumber: number,
  column: number,
  selectedText: string,
  before = '',
  after = ''
): PassageSelection {
  return { pageNumber, column, selectedText, before, after };
}

const wrap = (selection: PassageSelection) =>
  wrapPassage(FIXTURE, selection, 'intro', 'x');

const OPEN = '<Highlight setId="intro" entryId="x">';
const CLOSE = '</Highlight>';

describe('wrapPassage', () => {
  test('wraps plain text', () => {
    expect(
      wrap(sel(1, 1, 'scales to trillions of access control lists'))
    ).toContain(
      `Zanzibar ${OPEN}scales to trillions of access control lists${CLOSE} and millions`
    );
  });

  test('only the passage changes', () => {
    const result = wrap(sel(1, 1, 'central to preserving privacy'));
    expect(result.replace(OPEN, '').replace(CLOSE, '')).toBe(FIXTURE);
  });

  test('ignores whitespace and line breaks in the selection', () => {
    expect(
      wrap(sel(1, 2, 'data consistency and   scalability. It saves\nengineering'))
    ).toContain(
      `${OPEN}data consistency and scalability.\nIt saves engineering${CLOSE} resources`
    );
  });

  test('a selection through italics keeps the markers inside', () => {
    expect(
      wrapPassage(
        FIXTURE.replace(/<Highlight setId="intro" entryId="gaia-ids-shortcut">|”<\/Highlight>/g, (m) =>
          m.startsWith('”') ? '”' : ''
        ),
        sel(2, 1, 'user U has relation R to object O'),
        'intro',
        'x'
      )
    ).toContain(`“${OPEN}user _U_ has relation _R_ to object _O_${CLOSE}”`);
  });

  test('a whole italic phrase keeps its markers inside', () => {
    expect(wrap(sel(2, 1, 'relation tuples'))).toContain(
      `represented as ${OPEN}_relation tuples_${CLOSE}.`
    );
  });

  test('a selection starting inside italics is refused', () => {
    expect(() => wrap(sel(2, 1, 'tuples.'))).toThrow(/split italic/);
  });

  test('a selection ending in code keeps the backticks inside', () => {
    expect(wrap(sel(1, 2, 'such as owner, editor'))).toContain(
      `${OPEN}such as \`owner\`, \`editor\`${CLOSE}`
    );
  });

  test('a selection ending inside code is refused', () => {
    expect(() => wrap(sel(1, 2, 'such as own'))).toThrow(/split italic/);
  });

  test('a selection inside link text', () => {
    expect(wrap(sel(2, 1, '(§2.3)'))).toContain(
      `[${OPEN}(§2.3)${CLOSE}](#2.3-namespace-configuration)`
    );
  });

  test('a selection covering a whole link', () => {
    expect(wrap(sel(2, 1, 'client configurations (§2.3),'))).toContain(
      `${OPEN}client configurations [(§2.3)](#2.3-namespace-configuration),${CLOSE}`
    );
  });

  test('a selection ending inside a link is refused', () => {
    expect(() => wrap(sel(2, 1, 'client configurations (§2'))).toThrow(
      /split a link/
    );
  });

  test('inside an existing highlight nests', () => {
    expect(wrap(sel(1, 1, 'configuration'))).toContain(
      `<Highlight setId="spicedb" entryId="config-language">${OPEN}configuration${CLOSE} language</Highlight>`
    );
  });

  test('containing an existing highlight nests', () => {
    expect(wrap(sel(1, 1, 'model and configuration language for'))).toContain(
      `${OPEN}model and <Highlight setId="spicedb" entryId="config-language">configuration language</Highlight> for${CLOSE}`
    );
  });

  test('half-overlapping an existing highlight is refused', () => {
    expect(() => wrap(sel(1, 1, 'language for expressing'))).toThrow(
      /partially overlaps/
    );
  });

  test('across a paragraph break is refused', () => {
    expect(() =>
      wrap(sel(1, 2, 'once across applications. We have the following'))
    ).toThrow(/paragraph break/);
  });

  test('across list items is refused', () => {
    expect(() => wrap(sel(1, 2, 'user intentions. Flexibility'))).toThrow(
      /paragraph break/
    );
  });

  test('including math is refused', () => {
    expect(() =>
      wrap(sel(2, 1, 'represented as relation tuples. where 〈namespace〉'))
    ).toThrow(/includes math/);
  });

  test('a repeated phrase is resolved by the text around it', () => {
    const result = wrap(
      sel(1, 2, 'across applications', 'to tackle them once ', '. We have')
    );
    expect(result).toContain(`them once ${OPEN}across applications${CLOSE}.`);
    expect(result).toContain(
      '<Highlight setId="intro" entryId="across-applications">across applications</Highlight>.'
    );
  });

  test('a repeated phrase with unhelpful context is refused', () => {
    expect(() => wrap(sel(1, 2, 'across applications'))).toThrow(
      /matches 2 places/
    );
    expect(() =>
      wrap(sel(1, 2, 'across applications', 'x²+y²', '∑ garbage'))
    ).toThrow(/matches 2 places/);
  });

  test('text from the other column is not found', () => {
    expect(() =>
      wrap(sel(2, 1, 'Only in the second column of page two.'))
    ).toThrow(/Couldn't find/);
    expect(
      wrap(sel(2, 2, 'Only in the second column of page two.'))
    ).toContain(`${OPEN}Only in the second column of page two.${CLOSE}`);
  });

  test('unknown page or column', () => {
    expect(() => wrap(sel(3, 1, 'anything at all'))).toThrow(/has no column/);
    expect(() => wrap(sel(1, 3, 'anything at all'))).toThrow(/has no column/);
  });

  test('a single match that the text around it contradicts is refused', () => {
    // As when text is selected inside rendered math, which isn't in the
    // source as such, but reads the same as words elsewhere in the column.
    expect(() =>
      wrap(sel(2, 1, 'namespace', '⟨object⟩::=⟨', '⟩‘:’⟨objectid⟩'))
    ).toThrow(/text around it/);
    expect(
      wrap(sel(2, 1, 'namespace', 'where 〈', '〉 and 〈relation'))
    ).toContain(`〈${OPEN}_namespace_${CLOSE}〉 and`);
    // One side agreeing is enough: the other may be next to math.
    expect(
      wrap(sel(2, 1, 'namespace', 'x²+y²', '〉 and 〈relation'))
    ).toContain(`〈${OPEN}_namespace_${CLOSE}〉 and`);
  });

  test('a selection from inside one italic phrase into another is refused', () => {
    const source = FIXTURE.replace(
      'Only in the second column of page two.',
      'provides _external consistency_ [[18]](#references-18) and _snapshot reads with bounded staleness_ here, some **bold phrase** more, and _foo_/_bar_.'
    );
    const wrapIn = (text: string) =>
      wrapPassage(source, sel(2, 2, text), 'intro', 'x');
    expect(() => wrapIn('consistency [18] and snapshot reads')).toThrow(
      /split italic/
    );
    expect(() => wrapIn('some bold')).toThrow(/split italic/);
    expect(() => wrapIn('phrase more')).toThrow(/split italic/);
    expect(wrapIn('some bold phrase')).toContain(
      `${OPEN}some **bold phrase**${CLOSE} more`
    );
    expect(wrapIn('foo/')).toContain(`${OPEN}_foo_/${CLOSE}_bar_`);
    expect(() => wrapIn('external consistency [18] and snapshot')).toThrow(
      /split italic/
    );
    expect(wrapIn('external consistency [18] and snapshot reads with bounded staleness')).toContain(
      `provides ${OPEN}_external consistency_ [[18]](#references-18) and _snapshot reads with bounded staleness_${CLOSE} here`
    );
  });

  test('a selection of part of some code is refused', () => {
    const source = FIXTURE.replace(
      'Only in the second column of page two.',
      'Uses the `MEMBER2GROUP` and `GROUP2GROUP` sets here.'
    );
    const wrapIn = (text: string) =>
      wrapPassage(source, sel(2, 2, text), 'intro', 'x');
    expect(() => wrapIn('GROUP2')).toThrow(/matches 2 places|split/);
    expect(() => wrapIn('MEMBER')).toThrow(/split italic, bold or code/);
    expect(() => wrapIn('2GROUP and GROUP2GROUP')).toThrow(/split/);
    expect(wrapIn('MEMBER2GROUP')).toContain(
      `the ${OPEN}\`MEMBER2GROUP\`${CLOSE} and`
    );
    expect(wrapIn('Uses the MEMBER2GROUP')).toContain(
      `${OPEN}Uses the \`MEMBER2GROUP\`${CLOSE} and`
    );
  });

  test('a selection ending at the end of a link takes the link in', () => {
    expect(wrap(sel(2, 1, 'predefined in client configurations (§2.3)'))).toContain(
      `${OPEN}predefined in client configurations [(§2.3)](#2.3-namespace-configuration)${CLOSE},`
    );
    expect(wrap(sel(2, 1, '(§2.3), 〈object id〉'))).toContain(
      `${OPEN}[(§2.3)](#2.3-namespace-configuration), 〈_object id_〉${CLOSE}`
    );
  });

  test('a selection shorter than 3 characters is refused', () => {
    expect(() => wrap(sel(2, 1, 'a'))).toThrow(EditRefusal);
  });

  test('refusals are EditRefusals', () => {
    expect(() => wrap(sel(1, 2, 'across applications'))).toThrow(EditRefusal);
  });
});

describe('highlightOrder', () => {
  test("lists a set's entry ids in source order", () => {
    const result = wrap(
      sel(1, 2, 'authorization poses unique challenges')
    ).replace('entryId="x">auth', 'entryId="y">auth');
    const again = wrapPassage(
      result,
      sel(1, 2, 'semantics and user'),
      'intro',
      'first'
    );
    expect(highlightOrder(again, 1, 2, 'intro')).toEqual([
      'first',
      'across-applications',
      'y',
    ]);
    expect(highlightOrder(again, 1, 1, 'intro')).toEqual([]);
    expect(highlightOrder(again, 1, 1, 'spicedb')).toEqual(['config-language']);
  });
});

// Highlights that can't be reproduced from their text alone, with the reason.
const NOT_REPRODUCIBLE: Record<string, string> = {};

describe('the paper', () => {
  const paper = fs.readFileSync(
    path.join(__dirname, '../../content/zanzibar.mdx'),
    'utf8'
  );

  // What a reader would select: the source without its markdown syntax.
  const rendered = (source: string) =>
    source
      .replace(/<[^>]+>/g, '')
      .replace(/\[((?:\[[^\]]*\]|[^\]])*)\]\([^)]*\)/g, '$1')
      // Code is shown as written; elsewhere emphasis markers aren't shown.
      .split('`')
      .map((part, index) =>
        index % 2
          ? part
          : part
              .replace(/(^|[^A-Za-z0-9])_|_(?![A-Za-z0-9])/g, '$1')
              .replace(/\*/g, '')
      )
      .join('');

  const highlight =
    /<Highlight setId="([^"]+)" entryId="([^"]+)">((?:(?!<\/?Highlight)[\s\S])*?)<\/Highlight>/g;

  const cases: [string, string, number, string][] = [];
  for (const match of paper.matchAll(highlight)) {
    const [element, setId, entryId, inner] = match;
    if (inner.includes('$')) continue;
    cases.push([setId, entryId, match.index, element]);
  }

  test('has highlights to check', () => {
    expect(cases.length).toBeGreaterThan(50);
  });

  test.each(cases)(
    're-creates the %s/%s highlight',
    (setId, entryId, index, element) => {
      const key = `${setId}/${entryId}`;
      if (key in NOT_REPRODUCIBLE) return;

      const inner = element.replace(/<\/?Highlight[^>]*>/g, '');
      const without =
        paper.slice(0, index) + inner + paper.slice(index + element.length);

      // Find the page and column the highlight is in.
      let location: [number, number] | undefined;
      for (let page = 1; page <= 14 && !location; page++) {
        for (let column = 1; column <= 2; column++) {
          const range = columnRange(without, page, column);
          if (range && range.start <= index && index < range.end) {
            location = [page, column];
          }
        }
      }
      expect(location).toBeDefined();

      const result = wrapPassage(
        without,
        {
          pageNumber: location![0],
          column: location![1],
          selectedText: rendered(inner),
          before: rendered(without.slice(Math.max(0, index - 80), index)),
          after: rendered(
            without.slice(index + inner.length, index + inner.length + 80)
          ),
        },
        setId,
        entryId
      );
      expect(result).toBe(paper);
    }
  );
});
