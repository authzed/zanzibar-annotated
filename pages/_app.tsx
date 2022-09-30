import { MDXProvider } from '@mdx-js/react';
import type { AppProps } from 'next/app';
import { Layout } from '../components/layout';
import { ListItem, Paragraph, UnorderedList } from '../components/markdown';
import '../styles/globals.css';

function ZanzibarPaper({ Component, pageProps }: AppProps) {
  return (
    <MDXProvider
      components={{
        // p: (props) => <p {...props} style={{ color: 'rebeccapurple' }} />,
        p: Paragraph,
        ul: UnorderedList,
        li: ListItem,
      }}
    >
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </MDXProvider>
  );
}

export default ZanzibarPaper;
