import { useRouter } from 'next/router';
import { useMemo } from 'react';

const RENDER_RANGES_QUERY_PARAM = 'renderranges';
const SELECTION_RANGES_QUERY_PARAM = 'selectionranges';

export enum RenderingState {
  NORMAL,
  FOR_RENDERING,
  FOR_SELECTION,
}

export function useRenderState() {
  const router = useRouter();
  const query = router.query;

  const ranges = useMemo(() => {
    if (RENDER_RANGES_QUERY_PARAM in query) {
      if (Array.isArray(query[RENDER_RANGES_QUERY_PARAM])) {
        return query[RENDER_RANGES_QUERY_PARAM];
      }

      if (query[RENDER_RANGES_QUERY_PARAM] !== undefined) {
        return [query[RENDER_RANGES_QUERY_PARAM]];
      }
    }

    return undefined;
  }, [query]);

  let state = RenderingState.NORMAL;
  if (RENDER_RANGES_QUERY_PARAM in router.query) {
    state = RenderingState.FOR_RENDERING;
  }
  if (SELECTION_RANGES_QUERY_PARAM in router.query) {
    state = RenderingState.FOR_SELECTION;
  }

  return {
    isForSocialCardRendering: state == RenderingState.FOR_RENDERING,
    isForSelectionRendering: state == RenderingState.FOR_SELECTION,
    ranges: ranges,
    state: state,
  };
}
