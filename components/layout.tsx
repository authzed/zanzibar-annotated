import Head from 'next/head';
import Script from 'next/script';
import { PropsWithChildren } from 'react';
import { GTag } from './GTag';
import SelectionShare from './SelectionShare';

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
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className="container mx-auto max-w-5xl font-serif">
        <SelectionShare />
        {props.children}
        <GTag />
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
    <div className="md:grid md:grid-cols-2 gap-x-10 p-20 mt-20 break-words bg-white shadow">
      {props.children}
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
