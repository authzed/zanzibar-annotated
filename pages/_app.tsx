import { MDXProvider } from '@mdx-js/react';
import 'katex/dist/katex.min.css';
import type { AppProps } from 'next/app';
import { Layout } from '../components/layout';
import {
  H2,
  H3,
  ListItem,
  Paragraph,
  UnorderedList,
} from '../components/markdown';
import '../styles/globals.css';
import '../styles/popper.css';

function ZanzibarPaper({ Component, pageProps }: AppProps) {
  return (
    <MDXProvider
      components={{
        // p: (props) => <p {...props} style={{ color: 'rebeccapurple' }} />,
        p: Paragraph,
        ul: UnorderedList,
        li: ListItem,
        h2: H2,
        h3: H3,
      }}
    >
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </MDXProvider>
  );
}

export default ZanzibarPaper;
