import { MDXProvider } from '@mdx-js/react';
import { PropsWithChildren } from 'react';
import { Layout, LayoutProps } from './layout';
import {
  H2,
  H3,
  H4,
  ListItem,
  OrderedList,
  Paragraph,
  UnorderedList,
} from './markdown';

const MDX_COMPONENTS = {
  p: Paragraph,
  ol: OrderedList,
  ul: UnorderedList,
  li: ListItem,
  h2: H2,
  h3: H3,
  h4: H4,
};

/**
 * PaperApp is the app shell around every page of the paper. It's shared by the
 * Next.js app and the server-side render used to resolve selections, so both
 * produce the same document.
 */
export function PaperApp(props: PropsWithChildren<LayoutProps>) {
  const { children, ...layoutProps } = props;
  return (
    <MDXProvider components={MDX_COMPONENTS}>
      <Layout {...layoutProps}>{children}</Layout>
    </MDXProvider>
  );
}
