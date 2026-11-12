import { CANONICAL_URL_BASE } from './siteconfig';

// Bibliographic details of the paper, as published by USENIX at
// PAPER_SOURCE_URL.
export const SITE_TITLE = 'The Google Zanzibar Paper, annotated by AuthZed';
export const SITE_DESCRIPTION =
  'Zanzibar: Google’s Consistent, Global Authorization System. An annotated copy of the original paper submitted to USENIX 2019.';
export const PAPER_TITLE =
  'Zanzibar: Google’s Consistent, Global Authorization System';
export const PAPER_AUTHORS = [
  'Ruoming Pang',
  'Ramón Cáceres',
  'Mike Burrows',
  'Zhifeng Chen',
  'Pratik Dave',
  'Nathan Germer',
  'Alexander Golynski',
  'Kevin Graney',
  'Nina Kang',
  'Lea Kissner',
  'Jeffrey L. Korn',
  'Abhishek Parmar',
  'Christina D. Richards',
  'Mengzhi Wang',
];
export const PAPER_YEAR = '2019';
export const PAPER_CONFERENCE =
  '2019 USENIX Annual Technical Conference (USENIX ATC 19)';
export const PAPER_SOURCE_URL =
  'https://www.usenix.org/conference/atc19/presentation/pang';

const AUTHZED = {
  '@type': 'Organization',
  name: 'AuthZed',
  url: 'https://authzed.com',
};

/**
 * getStructuredData returns the schema.org description of the site: a web page
 * published by AuthZed, written by the authors of its annotations, whose main
 * subject is the paper.
 */
export function getStructuredData(
  imageUrl: string,
  annotationAuthors: { name: string; url: string }[]
) {
  const paperId = `${CANONICAL_URL_BASE}#paper`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${CANONICAL_URL_BASE}#webpage`,
        url: CANONICAL_URL_BASE,
        name: SITE_TITLE,
        description: SITE_DESCRIPTION,
        inLanguage: 'en',
        primaryImageOfPage: imageUrl,
        publisher: AUTHZED,
        author: annotationAuthors.map((author) => ({
          '@type': 'Person',
          name: author.name,
          sameAs: author.url,
          worksFor: AUTHZED,
        })),
        mainEntity: { '@id': paperId },
      },
      {
        '@type': 'ScholarlyArticle',
        '@id': paperId,
        url: CANONICAL_URL_BASE,
        sameAs: PAPER_SOURCE_URL,
        headline: PAPER_TITLE,
        name: PAPER_TITLE,
        inLanguage: 'en',
        datePublished: PAPER_YEAR,
        author: PAPER_AUTHORS.map((name) => ({ '@type': 'Person', name })),
        publisher: { '@type': 'Organization', name: 'USENIX Association' },
        publication: { '@type': 'PublicationEvent', name: PAPER_CONFERENCE },
      },
    ],
  };
}
