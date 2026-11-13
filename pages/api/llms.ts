import type { NextApiRequest, NextApiResponse } from 'next';
import { getLlmsTxt } from '../../util/papermarkdown';
import { getAnnotationSetSources } from '../../util/papersource';

// Serves the site's llms.txt.
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader(
    'Cache-Control',
    's-maxage=3600, stale-while-revalidate=86400'
  );
  res.status(200).send(getLlmsTxt(getAnnotationSetSources()));
}
