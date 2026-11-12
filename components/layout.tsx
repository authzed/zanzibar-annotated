import Head from 'next/head';
import { PropsWithChildren } from 'react';
import { Banner } from './Banner';
import { Container, ContentContainer } from './Container';
import { Footer } from './Footer';
import { GTagScript } from './GTag';
import { HighlightProvidedSelection } from './HighlightProvidedSelection';
import SelectionShare from './SelectionShare';
import {
  AnnotationGroup,
  AnnotationManagerProvider,
  getAnnotationAuthors,
} from './annotation';
import {SelectRangesOptions} from './lib/selectranges';
import {
  getStructuredData,
  PAPER_AUTHORS,
  PAPER_CONFERENCE,
  PAPER_TITLE,
  PAPER_YEAR,
  SITE_DESCRIPTION,
  SITE_TITLE,
} from '../util/papermetadata';
import { CANONICAL_URL_BASE, getAssetUrl } from '../util/siteconfig';

export const ANNOTATIONS_PORTAL_CONTAINER_ID = 'annotations-root';

/**
 * SelectionContext is the context associated with the current selection, if any.
 */
export type SelectionContext = {
  /**
   * previewImageUrl is the URL at which the preview image for this selection can be retrieved.
   */
  previewImageUrl: string | null;

  /**
   * previewText is the text of the selection, if any.
   */
  previewText: string | null;

  /**
   * previewSection is the section of the selection, if any.
   */
  previewSection: string | null;
};

/**
 * LayoutProps are props passed from the page to the layout.
 */
export type LayoutProps = {
  baseUrl: string;
  canonicalUrl: string;
  selectionContext?: SelectionContext | undefined | null;

  /**
   * noIndex is whether search engines are asked not to index the page. It's set
   * for selections, which each have a URL of their own but the same content.
   */
  noIndex?: boolean;
};

// Social crawlers require an absolute URL. The canonical site is used rather
// than the deployment's own URL, which changes with every deployment.
const DEFAULT_PREVIEW_IMAGE_URL = `${CANONICAL_URL_BASE}/preview.png`;

const defaultHighlightOptions = { block: 'center', behavior: 'smooth' } satisfies SelectRangesOptions

/**
 * Paper layout
 */
export function Layout(props: PropsWithChildren<LayoutProps>) {
  let previewText: string | undefined = undefined;
  if (props.selectionContext?.previewText) {
    previewText = props.selectionContext.previewText
      .split('\n')
      .map((l) => `> ${l}`)
      .join('\n')
      .substring(0, 200);
  }
  const previewImageUrl =
    props.selectionContext?.previewImageUrl ?? DEFAULT_PREVIEW_IMAGE_URL;
  // Escaped so the JSON can't close the script element it's embedded in.
  const structuredData = JSON.stringify(
    getStructuredData(DEFAULT_PREVIEW_IMAGE_URL, getAnnotationAuthors())
  ).replace(/</g, '\\u003c');
  return (
    <>
      <Head>
        <title>{SITE_TITLE}</title>
        <link rel="canonical" href={props.canonicalUrl} />
        {props.noIndex && <meta name="robots" content="noindex, follow" />}
        <link
          rel="icon"
          href={`${getAssetUrl()}/favicon.ico`}
          type="image/x-icon"
          sizes="48x48"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <meta name="description" content={SITE_DESCRIPTION} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="AuthZed" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:url" content={props.canonicalUrl} />
        <meta property="og:title" content={SITE_TITLE} />
        <meta property="og:description" content={SITE_DESCRIPTION} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@authzed" />
        <meta name="twitter:title" content={SITE_TITLE} />
        <meta name="twitter:description" content={SITE_DESCRIPTION} />
        <meta property="og:image" content={previewImageUrl} />
        <meta name="twitter:image" content={previewImageUrl} />
        {!!previewText && (
          <meta property="og:image:alt" content={previewText} />
        )}
        {!!previewText && (
          <meta name="twitter:image:alt" content={previewText} />
        )}
        {!!props.selectionContext?.previewSection && (
          <>
            <meta name="twitter:label1" content="Section" />
            <meta
              name="twitter:data1"
              content={props.selectionContext.previewSection}
            />
          </>
        )}
        {/* Bibliographic tags, as read by Google Scholar and reference
            managers. */}
        <meta name="citation_title" content={PAPER_TITLE} />
        {PAPER_AUTHORS.map((author) => (
          <meta key={author} name="citation_author" content={author} />
        ))}
        <meta name="citation_publication_date" content={PAPER_YEAR} />
        <meta name="citation_conference_title" content={PAPER_CONFERENCE} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: structuredData }}
        />
      </Head>
      <GTagScript />
      <AnnotationManagerProvider>
        <Container>
          <main className="container mx-auto max-w-5xl mt-0 mb-20 font-serif">
            <SelectionShare />
            <article>{props.children}</article>
          </main>
          <Footer />
        </Container>
        <Banner />
      </AnnotationManagerProvider>
      <div id={ANNOTATIONS_PORTAL_CONTAINER_ID} />
      <HighlightProvidedSelection
        options={defaultHighlightOptions}
      />
    </>
  );
}

/**
 * Single page layout
 */
export function Page(props: PropsWithChildren<{ pageNumber: number }>) {
  return (
    <div className="relative z-100">
      <aside
        aria-label="Annotations"
        className="hidden lg:block absolute h-full w-80 -left-[20rem] top-0 z-10"
      >
        <AnnotationGroup
          pageNumber={props.pageNumber}
          groupId="col-1"
          orientation="left"
        />
      </aside>
      <ContentContainer>
        <div className="md:grid md:grid-cols-2 gap-x-10 p-10 md:p-20 mt-20 break-words bg-white shadow z-10">
          {props.children}
        </div>
      </ContentContainer>
      <aside
        aria-label="Annotations"
        className="hidden lg:block absolute h-full w-80 -right-[20rem] top-0 z-10"
      >
        <AnnotationGroup
          pageNumber={props.pageNumber}
          groupId="col-2"
          orientation="right"
        />
      </aside>
    </div>
  );
}

/**
 * Paper header layout
 */
export function Header(props: PropsWithChildren) {
  return (
    <div className="header w-3/4 my-10 mx-auto md:col-span-2 text-center">
      {props.children}
    </div>
  );
}

/**
 * Page column layout
 */
export function Column(props: PropsWithChildren) {
  return <div className="page-column">{props.children}</div>;
}

/**
 * Section metadata.
 */
export function Section(
  props: PropsWithChildren<{
    titles: string[];
  }>
) {
  return (
    <div data-section-title={props.titles[props.titles.length - 1]}>
      {props.children}
    </div>
  );
}
