import { useRouter } from 'next/router';
import { useMemo } from 'react';

const SELECTION_RANGES_QUERY_PARAM = 'selectionranges';

export enum RenderingState {
  NORMAL,
  FOR_SELECTION,
}

export function useRenderState() {
  const router = useRouter();

  let state = RenderingState.NORMAL;
  if (SELECTION_RANGES_QUERY_PARAM in router.query) {
    state = RenderingState.FOR_SELECTION;
  }

  return useMemo(() => ({
    isForSelectionRendering: state == RenderingState.FOR_SELECTION,
    state: state,
  }), [state]);
}
