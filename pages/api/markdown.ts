import type { NextApiRequest, NextApiResponse } from 'next';
import { getPaperMarkdown } from '../../util/papersource';
import { CANONICAL_URL_BASE } from '../../util/siteconfig';

// Serves the markdown edition of the paper, at /paper.md.
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader(
    'Cache-Control',
    's-maxage=3600, stale-while-revalidate=86400'
  );
  // The web page is the version of the paper that search engines index.
  res.setHeader('Link', `<${CANONICAL_URL_BASE}>; rel="canonical"`);
  res.status(200).send(getPaperMarkdown());
}
