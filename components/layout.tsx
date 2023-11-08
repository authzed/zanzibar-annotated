import Head from "next/head";
import { PropsWithChildren, useState } from "react";
import { Banner } from "./Banner";
import { Container, ContentContainer } from "./Container";
import { Footer } from "./Footer";
import { GTagScript } from "./GTag";
import { HighlightProvidedSelection } from "./HighlightProvidedSelection";
import SelectionShare from "./SelectionShare";
import {
  AnnotationGroup,
  AnnotationManagerProvider,
  NoAnnotationManagerProvider,
} from "./annotation";
import { RenderingState, useRenderState } from "./renderstate";

export const ANNOTATIONS_PORTAL_CONTAINER_ID = "annotations-root";

const SOCIAL_CARD_COLUMN_WIDTH = 412; // pixels
const SOCIAL_CARD_COLUMN_PADDING = 8; // pixels

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

function getDefaultPreviewImageUrl() {
  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}/preview.png`
    : "/preview.png";
}

/**
 * Paper layout
 */
export function Layout(props: PropsWithChildren<LayoutProps>) {
  const [isTopOfContent, setIsTopOfContent] = useState(true);
  const assetUrl = `https://${process.env.VERCEL_URL}` ?? "";
  const renderState = useRenderState();
  switch (renderState.state) {
    case RenderingState.FOR_SELECTION:
      return (
        <div className="font-serif">
          <NoAnnotationManagerProvider>
            {props.children}
          </NoAnnotationManagerProvider>
        </div>
      );

    case RenderingState.FOR_RENDERING:
      return (
        <>
          <div
            className="font-serif"
            style={{
              width: `${
                SOCIAL_CARD_COLUMN_WIDTH + SOCIAL_CARD_COLUMN_PADDING * 2
              }px`,
              padding: `${SOCIAL_CARD_COLUMN_PADDING}px`,
              backgroundColor: "white",
            }}
          >
            <NoAnnotationManagerProvider>
              {props.children}
            </NoAnnotationManagerProvider>
            <HighlightProvidedSelection
              options={{ block: "center", behavior: "auto" }}
              skipSelectionMonitoring
              pathPrefix="_render/"
            />
          </div>
        </>
      );

    default:
      let previewText: string | undefined = undefined;
      if (props.selectionContext?.previewText) {
        previewText = props.selectionContext.previewText
          .split("\n")
          .map((l) => `> ${l}`)
          .join("\n")
          .substring(0, 200);
      }
      const previewImageUrl =
        props.selectionContext?.previewImageUrl ?? getDefaultPreviewImageUrl();
      return (
        <>
          <Head>
            <title>The Google Zanzibar Paper, annotated by AuthZed</title>
            <link rel="icon" href={`${assetUrl}/favicon.ico`} />
            <link rel="canonical" href={props.canonicalUrl} />
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
            <Container onScrolled={setIsTopOfContent}>
              <div className="container mx-auto max-w-5xl mt-0 mb-20 font-serif">
                <SelectionShare />
                {props.children}
              </div>
              <Footer />
            </Container>
            <Banner isTopOfContent={isTopOfContent} />
          </AnnotationManagerProvider>
          <div id={ANNOTATIONS_PORTAL_CONTAINER_ID} />
          <HighlightProvidedSelection
            options={{ block: "center", behavior: "smooth" }}
            pathPrefix="/"
          />
        </>
      );
  }
}

/**
 * Single page layout
 */
export function Page(props: PropsWithChildren<{ pageNumber: number }>) {
  const renderState = useRenderState();
  if (renderState.isForSocialCardRendering) {
    return <div>{props.children}</div>;
  }

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
