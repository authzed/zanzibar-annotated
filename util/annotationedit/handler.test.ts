import fs from 'fs';
import { load } from 'js-yaml';
import type { NextApiRequest, NextApiResponse } from 'next';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { EditResponse, handleAnnotationEdit } from './handler';

type Result = { status: number; body: EditResponse | undefined };

function fakeRequest(
  overrides: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
    remoteAddress?: string;
  } = {}
): NextApiRequest {
  return {
    method: overrides.method ?? 'POST',
    headers: {
      host: 'localhost:3000',
      'content-type': 'application/json',
      ...overrides.headers,
    },
    body: overrides.body ?? {},
    socket: { remoteAddress: overrides.remoteAddress ?? '127.0.0.1' },
  } as unknown as NextApiRequest;
}

async function call(
  req: NextApiRequest,
  options?: Parameters<typeof handleAnnotationEdit>[2]
): Promise<Result> {
  const result: Result = { status: 200, body: undefined };
  const res = {
    status(code: number) {
      result.status = code;
      return res;
    },
    json(body: EditResponse) {
      result.body = body;
      return res;
    },
  } as unknown as NextApiResponse<EditResponse>;
  await handleAnnotationEdit(req, res, options);
  return result;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('guards', () => {
  test.each(['production', 'test'])('404 when NODE_ENV is %s', async (env) => {
    vi.stubEnv('NODE_ENV', env);
    const result = await call(fakeRequest({ body: { action: 'nope' } }));
    expect(result.status).toBe(404);
    expect(result.body).toEqual({ ok: false, error: 'Not found' });
  });

  test('405 for non-POST', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect((await call(fakeRequest({ method: 'GET' }))).status).toBe(405);
  });

  test.each(['example.com', '192.168.1.5:3000', 'localhost.evil.example'])(
    '403 for non-loopback host %s',
    async (host) => {
      vi.stubEnv('NODE_ENV', 'development');
      const result = await call(fakeRequest({ headers: { host } }));
      expect(result.status).toBe(403);
    }
  );

  test('403 for cross-origin', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const result = await call(
      fakeRequest({ headers: { origin: 'https://evil.example' } })
    );
    expect(result.status).toBe(403);
  });

  test.each(['192.168.1.20', '::ffff:192.168.1.20', '10.0.0.3', undefined])(
    '403 for a request from another machine (%s), whatever host it names',
    async (remoteAddress) => {
      vi.stubEnv('NODE_ENV', 'development');
      const request = fakeRequest({ body: { action: 'nope' } });
      (request.socket as any).remoteAddress = remoteAddress;
      expect((await call(request)).status).toBe(403);
    }
  );

  test.each(['127.0.0.1', '::1', '::ffff:127.0.0.1'])(
    'accepts a request from this machine (%s)',
    async (remoteAddress) => {
      vi.stubEnv('NODE_ENV', 'development');
      const result = await call(
        fakeRequest({ remoteAddress, body: { action: 'nope' } })
      );
      expect(result.status).toBe(400);
    }
  );

  test('415 for non-JSON content type', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const result = await call(
      fakeRequest({ headers: { 'content-type': 'text/plain' } })
    );
    expect(result.status).toBe(415);
  });

  test('400 for unknown action', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const result = await call(fakeRequest({ body: { action: 'nope' } }));
    expect(result.status).toBe(400);
    expect(result.body).toEqual({ ok: false, error: 'Unknown action' });
  });

  test.each(['localhost:3000', '127.0.0.1:3000', '[::1]:3000', 'localhost'])(
    'accepts loopback host %s',
    async (host) => {
      vi.stubEnv('NODE_ENV', 'development');
      const result = await call(
        fakeRequest({
          headers: { host, origin: `http://${host}` },
          body: { action: 'nope' },
        })
      );
      expect(result.status).toBe(400);
    }
  );
});

const MDX = `<Page pageNumber={1}>
<Column>

First column of the paper.

</Column>
<Column>

semantics and user experience <Highlight setId="intro" entryId="across-applications">across applications</Highlight>.
Finally, as we show below, authorization poses unique challenges involving data consistency and scalability.
It saves engineering resources to tackle them once across applications.

</Column>
</Page>
`;

const YAML = `id: 'intro'
groups:
  page-1-col-2:
    across-applications:
      content: |
        This can also come into play with micro-services.
`;

describe('actions', () => {
  let rootDir: string;
  const mdxPath = () => path.join(rootDir, 'content/zanzibar.mdx');
  const yamlPath = () => path.join(rootDir, 'content/annotations-intro.yaml');
  const readMdx = () => fs.readFileSync(mdxPath(), 'utf8');
  const readYaml = () => fs.readFileSync(yamlPath(), 'utf8');
  const parsedYaml = () => load(readYaml()) as any;

  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'annedit-'));
    fs.mkdirSync(path.join(rootDir, 'content'));
    fs.writeFileSync(mdxPath(), MDX);
    fs.writeFileSync(yamlPath(), YAML);
  });

  afterEach(() => {
    fs.chmodSync(yamlPath(), 0o644);
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  const addAnnotation = (overrides: Record<string, unknown> = {}) =>
    call(
      fakeRequest({
        body: {
          action: 'add-annotation',
          setId: 'intro',
          entryId: 'unique-challenges',
          content: 'A new note.',
          pageNumber: 1,
          column: 2,
          selectedText: 'authorization poses unique challenges',
          before: '',
          after: '',
          ...overrides,
        },
      }),
      { rootDir }
    );

  const addAddendum = (overrides: Record<string, unknown> = {}) =>
    call(
      fakeRequest({
        body: {
          action: 'add-addendum',
          setId: 'intro',
          entryId: 'across-applications',
          content: 'Later note',
          ...overrides,
        },
      }),
      { rootDir, now: new Date(2026, 10, 12, 23, 30) }
    );

  const expectUnchanged = () => {
    expect(readMdx()).toBe(MDX);
    expect(readYaml()).toBe(YAML);
  };

  test('add-annotation updates both files', async () => {
    const result = await addAnnotation();
    expect(result).toEqual({ status: 200, body: { ok: true } });
    expect(readMdx()).toContain(
      '<Highlight setId="intro" entryId="unique-challenges">authorization poses unique challenges</Highlight>'
    );
    expect(parsedYaml().groups['page-1-col-2']).toEqual({
      'across-applications': {
        content: 'This can also come into play with micro-services.\n',
      },
      'unique-challenges': { content: 'A new note.\n' },
    });
  });

  test('a new annotation is ordered by its place in the paper', async () => {
    const result = await addAnnotation({
      entryId: 'semantics',
      selectedText: 'semantics and user experience',
    });
    expect(result.status).toBe(200);
    expect(Object.keys(parsedYaml().groups['page-1-col-2'])).toEqual([
      'semantics',
      'across-applications',
    ]);
  });

  test('a new annotation goes before the next one of its group, even past others', async () => {
    // The next highlight in the column is listed under another group, as
    // happens where a passage runs over the end of a column.
    fs.writeFileSync(
      mdxPath(),
      MDX.replace(
        'as we show below',
        'as <Highlight setId="intro" entryId="later">we show</Highlight> below'
      )
    );
    fs.writeFileSync(
      yamlPath(),
      `id: 'intro'
groups:
  page-1-col-2:
    later:
      content: |
        Later.

  page-2-col-1:
    across-applications:
      content: |
        Listed elsewhere.
`
    );
    const result = await addAnnotation({
      entryId: 'semantics',
      selectedText: 'user experience',
    });
    expect(result.status).toBe(200);
    expect(Object.keys(parsedYaml().groups['page-1-col-2'])).toEqual([
      'semantics',
      'later',
    ]);
  });

  test('a highlight that would stop the paper compiling is refused', async () => {
    // The paper is already broken here; the same check stops a highlight
    // from breaking it.
    const broken = MDX.replace('First column of the paper.', 'First <b>column.');
    fs.writeFileSync(mdxPath(), broken);
    const result = await addAnnotation();
    expect(result.status).toBe(400);
    expect(result.body).toEqual({
      ok: false,
      error: expect.stringContaining('would no longer compile'),
    });
    expect(readMdx()).toBe(broken);
    expect(readYaml()).toBe(YAML);
  });

  test('a new annotation can start a group', async () => {
    const result = await addAnnotation({
      column: 1,
      selectedText: 'First column of the paper.',
    });
    expect(result.status).toBe(200);
    expect(Object.keys(parsedYaml().groups)).toEqual([
      'page-1-col-1',
      'page-1-col-2',
    ]);
  });

  test('a refusal changes neither file', async () => {
    const result = await addAnnotation({ selectedText: 'across applications' });
    expect(result.status).toBe(400);
    expect(result.body).toEqual({
      ok: false,
      error: expect.stringContaining('matches 2 places'),
    });
    expectUnchanged();
  });

  test('a duplicate entry id changes neither file', async () => {
    const result = await addAnnotation({ entryId: 'across-applications' });
    expect(result.status).toBe(400);
    expect(result.body).toEqual({
      ok: false,
      error: 'Entry id "across-applications" already exists in this set',
    });
    expectUnchanged();
  });

  test('empty content changes neither file', async () => {
    expect((await addAnnotation({ content: '  ' })).status).toBe(400);
    expectUnchanged();
  });

  test.each([
    ['setId', 'nope'],
    ['setId', '../../etc/passwd'],
    ['setId', 'intro.yaml'],
    ['setId', 42],
    ['entryId', 'Not A Slug'],
    ['entryId', ''],
    ['entryId', 'trailing-'],
    ['pageNumber', '1'],
    ['pageNumber', 0],
    ['column', 1.5],
    ['selectedText', undefined],
    ['content', undefined],
  ])('an invalid %s (%j) is a 400', async (field, value) => {
    const result = await addAnnotation({ [field]: value });
    expect(result.status).toBe(400);
    expectUnchanged();
  });

  test.skipIf(process.platform === 'win32')(
    'the paper is restored if the annotation set cannot be written',
    async () => {
      fs.chmodSync(yamlPath(), 0o444);
      const result = await addAnnotation();
      expect(result.status).toBe(500);
      expectUnchanged();
    }
  );

  test('add-addendum appends with the date and author', async () => {
    const result = await addAddendum({ author: ' Joey Schorr ' });
    expect(result).toEqual({ status: 200, body: { ok: true } });
    expect(
      parsedYaml().groups['page-1-col-2']['across-applications'].addenda
    ).toEqual([
      { date: '2026-11-12', author: 'Joey Schorr', content: 'Later note\n' },
    ]);
    expect(readMdx()).toBe(MDX);
  });

  test('add-addendum without an author leaves it out', async () => {
    await addAddendum({ author: '' });
    await addAddendum();
    expect(
      parsedYaml().groups['page-1-col-2']['across-applications'].addenda
    ).toEqual([
      { date: '2026-11-12', content: 'Later note\n' },
      { date: '2026-11-12', content: 'Later note\n' },
    ]);
  });

  test('add-addendum for an unknown entry is a 400', async () => {
    const result = await addAddendum({ entryId: 'nope' });
    expect(result.status).toBe(400);
    expect(result.body).toEqual({
      ok: false,
      error: 'No annotation "nope" in this set',
    });
    expectUnchanged();
  });

  test('add-addendum with a non-string author is a 400', async () => {
    expect((await addAddendum({ author: { name: 'x' } })).status).toBe(400);
    expectUnchanged();
  });
  describe('add-set', () => {
    const REGISTRY = `import intro from './annotations-intro.yaml';

// prettier-ignore
export const ANNOTATION_SETS: any[] = [
  intro,
];
`;
    const registryPath = () => path.join(rootDir, 'content/annotation-sets.ts');
    const newSetPath = () =>
      path.join(rootDir, 'content/annotations-my-set.yaml');

    beforeEach(() => {
      fs.writeFileSync(registryPath(), REGISTRY);
    });

    const addSet = (overrides: Record<string, unknown> = {}) =>
      call(
        fakeRequest({
          body: {
            action: 'add-set',
            id: 'my-set',
            label: 'My set',
            highlightColor: 'emerald',
            ...overrides,
          },
        }),
        { rootDir }
      );

    const expectNoSet = () => {
      expect(fs.existsSync(newSetPath())).toBe(false);
      expect(fs.readFileSync(registryPath(), 'utf8')).toBe(REGISTRY);
    };

    test('creates the set and lists it', async () => {
      const result = await addSet({
        title: 'My title',
        subtitle: 'My subtitle',
        cta: 'My cta',
        description: 'My description',
        authorName: 'Pat',
        authorUrl: 'https://example.com/pat',
        authorAvatar: '/authors/pat.jpg',
      });
      expect(result).toEqual({ status: 200, body: { ok: true } });
      expect(load(fs.readFileSync(newSetPath(), 'utf8'))).toEqual({
        id: 'my-set',
        label: 'My set',
        title: 'My title',
        subtitle: 'My subtitle',
        cta: 'My cta',
        description: 'My description',
        highlightColor: 'emerald',
        author: {
          name: 'Pat',
          url: 'https://example.com/pat',
          avatar: '/authors/pat.jpg',
        },
        groups: null,
      });
      expect(fs.readFileSync(registryPath(), 'utf8')).toContain(
        "import mySet from './annotations-my-set.yaml';"
      );
    });

    test('fills in what was left out', async () => {
      await addSet();
      expect(load(fs.readFileSync(newSetPath(), 'utf8'))).toEqual({
        id: 'my-set',
        label: 'My set',
        title: 'My set',
        subtitle: '',
        cta: 'My set',
        description: 'My set',
        highlightColor: 'emerald',
        groups: null,
      });
    });

    test('the new set takes an annotation', async () => {
      await addSet();
      const result = await addAnnotation({ setId: 'my-set' });
      expect(result.status).toBe(200);
      expect(load(fs.readFileSync(newSetPath(), 'utf8'))).toMatchObject({
        groups: {
          'page-1-col-2': { 'unique-challenges': { content: 'A new note.\n' } },
        },
      });
    });

    test('an existing set is refused', async () => {
      const result = await addSet({ id: 'intro' });
      expect(result.status).toBe(400);
      expect(result.body).toEqual({
        ok: false,
        error: 'Annotation set "intro" already exists',
      });
      expect(readYaml()).toBe(YAML);
      expect(fs.readFileSync(registryPath(), 'utf8')).toBe(REGISTRY);
    });

    test.each([
      ['id', '../evil'],
      ['id', 'Has Spaces'],
      ['id', ''],
      ['label', ''],
      ['label', '   '],
      ['label', 7],
      ['highlightColor', 'chartreuse'],
      ['highlightColor', undefined],
      ['authorUrl', 'javascript:alert(1)'],
      ['authorUrl', 'not a url'],
      ['authorUrl', ''],
      ['authorUrl', undefined],
      ['authorAvatar', 'https://example.com/a.jpg'],
      ['title', { a: 1 }],
    ])('an invalid %s (%j) is a 400', async (field, value) => {
      const result = await addSet({
        authorName: 'Pat',
        authorUrl: 'https://example.com/pat',
        [field]: value,
      });
      expect(result.status).toBe(400);
      expectNoSet();
    });

    test('nothing is created if the set cannot be listed', async () => {
      fs.writeFileSync(registryPath(), 'export const ANNOTATION_SETS = [];');
      const result = await addSet();
      expect(result.status).toBe(400);
      expect(fs.existsSync(newSetPath())).toBe(false);
    });

    test.skipIf(process.platform === 'win32')(
      'the set is removed again if the list cannot be written',
      async () => {
        fs.chmodSync(registryPath(), 0o444);
        const result = await addSet();
        fs.chmodSync(registryPath(), 0o644);
        expect(result.status).toBe(500);
        expectNoSet();
      }
    );
  });
});
