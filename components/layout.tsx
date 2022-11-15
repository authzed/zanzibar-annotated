import Head from 'next/head';
import { PropsWithChildren, useState } from 'react';
import {
  AnnotationGroup,
  AnnotationManagerProvider,
  NoAnnotationManagerProvider,
} from './annotation';
import { Banner } from './Banner';
import { Container, ContentContainer } from './Container';
import { Footer } from './Footer';
import { GTagScript } from './GTag';
import { HighlightProvidedSelection } from './HighlightProvidedSelection';
import { useRenderState } from './renderstate';
import SelectionShare from './SelectionShare';

export const ANNOTATIONS_PORTAL_CONTAINER_ID = 'annotations-root';

const SOCIAL_CARD_COLUMN_WIDTH = 412; // pixels
const SOCIAL_CARD_COLUMN_PADDING = 8; // pixels

/**
 * Paper layout
 */
export function Layout(props: PropsWithChildren) {
  const [isTopOfContent, setIsTopOfContent] = useState(true);

  const renderState = useRenderState();
  if (renderState.isForSocialCardRendering) {
    return (
      <>
        <div
          className="font-serif"
          style={{
            width: `${
              SOCIAL_CARD_COLUMN_WIDTH + SOCIAL_CARD_COLUMN_PADDING * 2
            }px`,
            padding: `${SOCIAL_CARD_COLUMN_PADDING}px`,
            backgroundColor: 'white',
          }}
        >
          <NoAnnotationManagerProvider>
            {props.children}
          </NoAnnotationManagerProvider>
          <HighlightProvidedSelection
            options={{ block: 'center' }}
            skipSelectionMonitoring
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>The Zanzibar Paper, annotated by Authzed</title>
        <meta
          name="description"
          content="Zanzibar: Google’s Consistent, Global Authorization System. This is an annotated copy of the original paper submitted to USENIX 2019."
        />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
      <HighlightProvidedSelection />
    </>
  );
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
    <div className="w-3/4 my-10 mx-auto md:col-span-2 text-center">
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
