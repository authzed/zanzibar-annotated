import 'katex/dist/katex.min.css';
import type { AppProps } from 'next/app';
import { LayoutProps } from '../components/layout';
import { PaperApp } from '../components/paper';
import '../styles/globals.css';

function ZanzibarPaper({ Component, pageProps }: AppProps<LayoutProps>) {
  // Error pages, such as the 404 page, have no paper props and aren't laid
  // out as the paper.
  if (!pageProps.canonicalUrl) {
    return <Component {...pageProps} />;
  }

  return (
    <PaperApp {...pageProps}>
      <Component {...pageProps} />
    </PaperApp>
  );
}

export default ZanzibarPaper;
