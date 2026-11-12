import fs from 'fs';
import { load } from 'js-yaml';
import path from 'path';
import { describe, expect, test } from 'vitest';
import { EditRefusal } from './mdx';
import {
  HIGHLIGHT_COLORS,
  newAnnotationSetYaml,
  registerAnnotationSet,
} from './sets';
import { insertAnnotation } from './yaml';

const REGISTRY = `// A comment.
import intro from './annotations-intro.yaml';
import spicedb from './annotations-spicedb.yaml';

// prettier-ignore
export const ANNOTATION_SETS: any[] = [
  intro,
  spicedb,
];
`;

describe('registerAnnotationSet', () => {
  test('adds the import and the entry, last', () => {
    expect(registerAnnotationSet(REGISTRY, 'my-set')).toBe(`// A comment.
import intro from './annotations-intro.yaml';
import spicedb from './annotations-spicedb.yaml';
import mySet from './annotations-my-set.yaml';

// prettier-ignore
export const ANNOTATION_SETS: any[] = [
  intro,
  spicedb,
  mySet,
];
`);
  });

  test('can be repeated for further sets', () => {
    const result = registerAnnotationSet(
      registerAnnotationSet(REGISTRY, 'one'),
      'two'
    );
    expect(result).toContain("import two from './annotations-two.yaml';\n\n");
    expect(result).toContain('  one,\n  two,\n];');
  });

  test.each([
    ['2024-notes', 'set2024Notes'],
    ['new', 'setNew'],
    ['default', 'setDefault'],
    ['a-b-c', 'aBC'],
  ])('names the import of %s %s', (setId, name) => {
    expect(registerAnnotationSet(REGISTRY, setId)).toContain(
      `import ${name} from './annotations-${setId}.yaml';`
    );
  });

  test('a set that is already listed is refused', () => {
    expect(() => registerAnnotationSet(REGISTRY, 'intro')).toThrow(
      /already/
    );
  });

  test('a registry it cannot follow is refused', () => {
    expect(() =>
      registerAnnotationSet('export const ANNOTATION_SETS = [a, b];', 'c')
    ).toThrow(EditRefusal);
  });
});

describe('newAnnotationSetYaml', () => {
  const fields = {
    id: 'my-set',
    label: "Joey's notes: part #1",
    title: 'A "quoted" title',
    subtitle: 'Lines\nare joined.',
    cta: 'See [the site](https://example.com?a=1&b=2)',
    description: '  Padded  ',
    highlightColor: 'emerald',
    author: {
      name: "Pat O'Brien",
      url: 'https://example.com/pat',
      avatar: '/authors/pat.jpg',
    },
  };

  test('round-trips its fields', () => {
    expect(load(newAnnotationSetYaml(fields))).toEqual({
      ...fields,
      subtitle: 'Lines are joined.',
      description: 'Padded',
      groups: null,
    });
  });

  test('leaves out an author that was not given, and its missing parts', () => {
    const { author, ...rest } = fields;
    expect(load(newAnnotationSetYaml(rest))).not.toHaveProperty('author');
    expect(
      load(newAnnotationSetYaml({ ...rest, author: { name: 'Pat', url: '' } }))
    ).toMatchObject({ author: { name: 'Pat' } });
  });

  test('takes a first annotation', () => {
    const result = insertAnnotation(newAnnotationSetYaml(fields), {
      groupId: 'page-3-col-1',
      entryId: 'first',
      content: 'A note.',
    });
    expect(load(result)).toMatchObject({
      id: 'my-set',
      groups: { 'page-3-col-1': { first: { content: 'A note.\n' } } },
    });
    const again = insertAnnotation(result, {
      groupId: 'page-1-col-2',
      entryId: 'second',
      content: 'Another.',
    });
    expect(Object.keys((load(again) as any).groups)).toEqual([
      'page-1-col-2',
      'page-3-col-1',
    ]);
  });
});

describe('HIGHLIGHT_COLORS', () => {
  test('are all kept by tailwind', () => {
    const config = fs.readFileSync(
      path.join(__dirname, '../../tailwind.config.js'),
      'utf8'
    );
    const pattern = new RegExp(/pattern:\s*\/(.+)\/,/.exec(config)![1]);
    for (const color of HIGHLIGHT_COLORS) {
      for (const shade of [100, 300, 400]) {
        expect(`bg-${color}-${shade}`).toMatch(pattern);
      }
      expect(`border-${color}-400`).toMatch(pattern);
    }
    expect(HIGHLIGHT_COLORS).toContain('amber');
    expect(HIGHLIGHT_COLORS).toContain('sky');
  });
});
