import { JSDOM } from 'jsdom';
import { renderToString } from 'react-dom/server';
import { PaperApp } from '../components/paper';
import Zanzibar from '../content/zanzibar.mdx';
import { GlobalRef } from './globalref';
import { CANONICAL_URL_BASE } from './siteconfig';

const parsedDOM = new GlobalRef<JSDOM | undefined>('paper.parseddom');

/**
 * getParsedPaperDOM returns a JSDOM containing the paper as rendered on the
 * home page, which selections are resolved against. It's rendered in-process
 * rather than fetched from the site, and cached for the life of the server.
 */
export function getParsedPaperDOM(): JSDOM {
  if (!parsedDOM.value) {
    const props = { baseUrl: CANONICAL_URL_BASE, canonicalUrl: CANONICAL_URL_BASE };
    const html = renderToString(
      <PaperApp {...props}>
        <Zanzibar {...props} />
      </PaperApp>
    );
    parsedDOM.value = new JSDOM(`<!DOCTYPE html><body>${html}</body>`);
  }
  return parsedDOM.value;
}
