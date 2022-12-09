import { expect } from '@jest/globals';
import { getPathSegments } from './pathsegments';

test('root path', () => {
  const path = '/';
  expect(getPathSegments(path)).toEqual({
    basePath: undefined,
    pathPrefix: undefined,
    selectionId: undefined,
  });
});

describe('single segment', () => {
  test('/<selection id>', () => {
    const path = '/2LVzjkP90m:0:8';
    expect(getPathSegments(path)).toEqual({
      basePath: undefined,
      pathPrefix: undefined,
      selectionId: '2LVzjkP90m:0:8',
    });
  });

  test('/<base path>', () => {
    const path = '/zanzibar';
    expect(getPathSegments(path)).toEqual({
      basePath: 'zanzibar',
      pathPrefix: undefined,
      selectionId: undefined,
    });
  });
});

describe('2 segments', () => {
  test('/<base path>/<selection id>', () => {
    const path = '/zanzibar/2LVzjkP90m:0:8';
    expect(getPathSegments(path)).toEqual({
      basePath: 'zanzibar',
      pathPrefix: undefined,
      selectionId: '2LVzjkP90m:0:8',
    });
  });

  test('/<path prefix>/<selection id>', () => {
    const path = '/_render/2LVzjkP90m:0:8';
    expect(getPathSegments(path)).toEqual({
      basePath: undefined,
      pathPrefix: '_render',
      selectionId: '2LVzjkP90m:0:8',
    });
  });

  test('/<base path>/<unknown>', () => {
    const path = '/zanzibar/unsupported/';
    expect(getPathSegments(path)).toEqual({
      basePath: 'zanzibar',
      pathPrefix: undefined,
      selectionId: undefined,
    });
  });
});

describe('3 segments', () => {
  test('/<base path>/<path prefix>/<selection id>', () => {
    const path = '/zanzibar/_render/2LVzjkP90m:0:8';
    expect(getPathSegments(path)).toEqual({
      basePath: 'zanzibar',
      pathPrefix: '_render',
      selectionId: '2LVzjkP90m:0:8',
    });
  });

  test('/<unknown>', () => {
    const path = '/zanzibar/is/neat';
    expect(getPathSegments(path)).toEqual({
      basePath: 'zanzibar',
      pathPrefix: undefined,
      selectionId: undefined,
    });
  });
});
