import { expect, describe, test } from 'vitest';
import { getPathSegments } from './pathsegments';

test('root path', () => {
  const path = '/';
  expect(getPathSegments(path)).toEqual({
    basePath: undefined,
    selectionId: undefined,
  });
});

describe('single segment', () => {
  test('/<selection id>', () => {
    const path = '/2LVzjkP90m:0:8';
    expect(getPathSegments(path)).toEqual({
      basePath: undefined,
        selectionId: '2LVzjkP90m:0:8',
    });
  });

  test('/<base path>', () => {
    const path = '/zanzibar';
    expect(getPathSegments(path)).toEqual({
      basePath: 'zanzibar',
        selectionId: undefined,
    });
  });
});

describe('2 segments', () => {
  test('/<base path>/<selection id>', () => {
    const path = '/zanzibar/2LVzjkP90m:0:8';
    expect(getPathSegments(path)).toEqual({
      basePath: 'zanzibar',
        selectionId: '2LVzjkP90m:0:8',
    });
  });

  test('/<base path>/<unknown>', () => {
    const path = '/zanzibar/unsupported/';
    expect(getPathSegments(path)).toEqual({
      basePath: 'zanzibar',
        selectionId: undefined,
    });
  });
});

describe('3 segments', () => {
  test('/<unknown>', () => {
    const path = '/zanzibar/is/neat';
    expect(getPathSegments(path)).toEqual({
      basePath: 'zanzibar',
        selectionId: undefined,
    });
  });
});
