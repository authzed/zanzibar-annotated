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
} from './annotation';
import {SelectRangesOptions} from './lib/selectranges';
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
};

// Social crawlers require an absolute URL, so fall back to the canonical site
// when the deployment URL isn't known.
function getDefaultPreviewImageUrl() {
  return `${getAssetUrl() || CANONICAL_URL_BASE}/preview.png`;
}

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
    props.selectionContext?.previewImageUrl ?? getDefaultPreviewImageUrl();
  return (
    <>
      <Head>
        <title>The Google Zanzibar Paper, annotated by AuthZed</title>
        <link rel="canonical" href={props.canonicalUrl} />
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
        <meta
          name="description"
          content="Zanzibar: Google’s Consistent, Global Authorization System. An annotated copy of the original paper submitted to USENIX 2019."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="The Google Zanzibar Paper, annotated by AuthZed"
        />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:site" content="@authzed" />
        <meta
          property="twitter:description"
          content="Zanzibar: Google’s Consistent, Global Authorization System. An annotated copy of the original paper submitted to USENIX 2019."
        />
        <meta
          property="og:description"
          content="Zanzibar: Google’s Consistent, Global Authorization System. An annotated copy of the original paper submitted to USENIX 2019."
        />
        <meta
          property="twitter:title"
          content="The Google Zanzibar Paper, annotated by AuthZed"
        />
        <meta property="og:image" content={previewImageUrl} />
        <meta property="twitter:image" content={previewImageUrl} />
        {!!previewText && (
          <meta property="og:image:alt" content={previewText} />
        )}
        {!!previewText && (
          <meta property="twitter:image:alt" content={previewText} />
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
      </Head>
      <GTagScript />
      <AnnotationManagerProvider>
        <Container>
          <div className="container mx-auto max-w-5xl mt-0 mb-20 font-serif">
            <SelectionShare />
            {props.children}
          </div>
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
      <div className="hidden lg:block absolute h-full w-80 -left-[20rem] top-0 z-10">
        <AnnotationGroup
          pageNumber={props.pageNumber}
          groupId="col-1"
          orientation="left"
        />
      </div>
      <ContentContainer>
        <div className="md:grid md:grid-cols-2 gap-x-10 p-10 md:p-20 mt-20 break-words bg-white shadow z-10">
          {props.children}
        </div>
      </ContentContainer>
      <div className="hidden lg:block absolute h-full w-80 -right-[20rem] top-0 z-10">
        <AnnotationGroup
          pageNumber={props.pageNumber}
          groupId="col-2"
          orientation="right"
        />
      </div>
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
