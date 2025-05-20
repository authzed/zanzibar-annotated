import { JSDOM } from 'jsdom';
import { GlobalRef } from './globalref';

const parsedDOM = new GlobalRef<JSDOM | undefined>('paper.parseddom');

/**
 * getParsedPaperDOM returns a JSDOM containing the parsed contents of the paper's DOM.
 */
export const getParsedPaperDOM = async (endpoint: string) => {
  if (parsedDOM.value) {
    return parsedDOM.value;
  }

  const previewEndpointHTML = await (await fetch(endpoint)).text();

  const dom = new JSDOM(previewEndpointHTML);
  parsedDOM.value = dom;
  return dom;
};
