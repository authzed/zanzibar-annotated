import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./layout', () => ({ ANNOTATIONS_PORTAL_CONTAINER_ID: 'annotations-root' }));
vi.mock('./GTag', () => ({ gtag: vi.fn() }));
vi.mock('./SelectionShare', () => ({
  ShareButton: () => null,
}));

import { gtag } from './GTag';
import { AnnotationManagerProvider, useAnnotation } from './annotation';

function renderAnnotationHook() {
  return renderHook(() => useAnnotation(), { wrapper: AnnotationManagerProvider });
}

describe('AnnotationManagerProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    window.location.hash = '';
  });

  it('defaults to the intro set active when there is no URL fragment', () => {
    const { result } = renderAnnotationHook();
    expect(result.current.activeAnnotationSetIds).toEqual(['intro']);
    expect(result.current.activeAnnotationId).toBeUndefined();
  });

  it('activates the set and annotation from a #annotations/<set>/<entry> URL fragment, and fires annotation_active', () => {
    window.location.hash = '#annotations/intro/across-applications';

    const { result } = renderAnnotationHook();

    expect(result.current.activeAnnotationSetIds).toContain('intro');
    expect(
      result.current.activeAnnotationId?.equals('intro', 'across-applications')
    ).toBe(true);
    expect(gtag).toHaveBeenCalledWith('event', 'annotation_active', {
      set_id: 'intro',
      entry_id: 'across-applications',
    });
  });

  it('toggleAnnotationSet adds and removes a set from activeAnnotationSetIds', () => {
    const { result } = renderAnnotationHook();
    expect(result.current.activeAnnotationSetIds).toEqual(['intro']);

    act(() => {
      result.current.toggleAnnotationSet('spicedb');
    });
    expect(result.current.activeAnnotationSetIds).toEqual(
      expect.arrayContaining(['intro', 'spicedb'])
    );

    act(() => {
      result.current.toggleAnnotationSet('intro');
    });
    expect(result.current.activeAnnotationSetIds).not.toContain('intro');
    expect(result.current.activeAnnotationSetIds).toContain('spicedb');
  });

  it('setAnnotationInactive clears activeAnnotationId when it matches', () => {
    window.location.hash = '#annotations/intro/across-applications';
    const { result } = renderAnnotationHook();
    expect(result.current.activeAnnotationId).toBeDefined();

    act(() => {
      result.current.setAnnotationInactive(result.current.activeAnnotationId!);
    });
    expect(result.current.activeAnnotationId).toBeUndefined();
  });
});
