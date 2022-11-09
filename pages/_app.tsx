import { MDXProvider } from '@mdx-js/react';
import 'katex/dist/katex.min.css';
import type { AppProps } from 'next/app';
import { Layout, LayoutProps } from '../components/layout';
import {
  H2,
  H3,
  H4,
  ListItem,
  OrderedList,
  Paragraph,
  UnorderedList,
} from '../components/markdown';
import '../styles/globals.css';

function ZanzibarPaper({ Component, pageProps }: AppProps<LayoutProps>) {
  return (
    <MDXProvider
      components={{
        // p: (props) => <p {...props} style={{ color: 'rebeccapurple' }} />,
        p: Paragraph,
        ol: OrderedList,
        ul: UnorderedList,
        li: ListItem,
        h2: H2,
        h3: H3,
        h4: H4,
      }}
    >
      <Layout {...pageProps}>
        <Component {...pageProps} />
      </Layout>
    </MDXProvider>
  );
}

export default ZanzibarPaper;
