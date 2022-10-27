import { useRouter } from 'next/router';
import { useMemo } from 'react';

const RANGES_QUERY_PARAM = 'ranges';

export function useRenderState() {
  const router = useRouter();
  const query = router.query;

  const ranges = useMemo(() => {
    if (RANGES_QUERY_PARAM in query) {
      if (Array.isArray(query[RANGES_QUERY_PARAM])) {
        return query[RANGES_QUERY_PARAM];
      }

      if (query[RANGES_QUERY_PARAM] !== undefined) {
        return [query[RANGES_QUERY_PARAM]];
      }
    }

    return undefined;
  }, [query]);

  return {
    isForSocialCardRendering: RANGES_QUERY_PARAM in router.query,
    ranges: ranges,
  };
}
