import 'katex/dist/katex.min.css';
import type { AppProps } from 'next/app';
import { LayoutProps } from '../components/layout';
import { PaperApp } from '../components/paper';
import '../styles/globals.css';

function ZanzibarPaper({ Component, pageProps }: AppProps<LayoutProps>) {
  return (
    <PaperApp {...pageProps}>
      <Component {...pageProps} />
    </PaperApp>
  );
}

export default ZanzibarPaper;
