import Head from 'next/head';
import Script from 'next/script';
import { PropsWithChildren } from 'react';

/**
 * Paper layout
 */
export function Layout(props: PropsWithChildren) {
  return (
    <>
      <Head>
        <title>The Annotated Zanzibar Paper</title>
        <meta
          name="description"
          content="Zanzibar: Google’s Consistent, Global Authorization System. This is an annotated copy of the original paper submitted to USENIX 2019."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="container mx-auto max-w-4xl font-serif">
        {props.children}
      </div>
      <Script
        src="/scripts/deeplinks/deeplinks.js"
        type="module"
        strategy="afterInteractive"
      />
    </>
  );
}

/**
 * Single page layout
 */
export function Page(props: PropsWithChildren) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 px-10 py-5 break-words">
      {props.children}
    </div>
  );
}

/**
 * Paper header layout
 */
export function Header(props: PropsWithChildren) {
  return (
    <div className="w-3/4 my-10 mx-auto text-center">{props.children}</div>
  );
}

/**
 * Page column layout
 */
export function Column(props: PropsWithChildren) {
  return <div className="page-column">{props.children}</div>;
}
