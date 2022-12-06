import { GetServerSideProps } from 'next';
import { LayoutProps } from '../components/layout';
import { fragmentToRangeList } from '../components/lib/deeplinks';
import Zanzibar from '../content/zanzibar.mdx';
import { getParsedPaperDOM } from '../util/parseddom';

export default function Default(props: LayoutProps) {
  return (
    <>
      <Zanzibar selectionContext={props.selectionContext} />
    </>
  );
}

export const getServerSideProps: GetServerSideProps<LayoutProps> = async ({
  req,
}) => {
  let endpoint = process.env.PREVIEW_ENDPOINT;
  if (!endpoint) {
    endpoint = `https://${process.env.VERCEL_URL}`;
  }

  let fragment = undefined;
  if (req.url?.length !== undefined && req.url.length > 1) {
    fragment = req.url.substring(1);
  }

  // NOTE: This can happen during debugging.
  if (fragment?.startsWith('_next')) {
    return {
      props: {
        selectionContext: null,
      },
    };
  }

  // Create the preview text for the selection by retrieving the rendered selection DOM and then
  // grabbing the ranges and their text.
  const dom = await getParsedPaperDOM(endpoint);

  // Make sure to not raise errors if there is a selection parse error.
  let selectionRanges: Range[] | undefined = undefined;
  try {
    selectionRanges = fragmentToRangeList(dom.window.document, fragment!);
  } catch (e) {
    console.log(e);
  }

  const selectionText = selectionRanges
    ?.map((range) => range.toString())
    ?.join('\n');

  const sections = selectionRanges?.map((sr) => {
    return findSection(sr.startContainer);
  });

  return {
    props: {
      selectionContext: selectionRanges
        ? {
            previewImageUrl: fragment
              ? `${endpoint}/api/preview/${fragment}`
              : null,
            previewText: selectionText ?? null,
            previewSection: sections?.length ? sections[0] : null,
          }
        : null,
    },
  };
};

function findSection(node: Node | null): string {
  if (node === null) {
    return '';
  }

  if (node.nodeType === 1 /* element */) {
    const found = (node as Element).getAttribute('data-section-title');
    if (found) {
      return found;
    }
  }

  const parentElement = node.parentElement;
  if (!parentElement) {
    return '';
  }

  return findSection(parentElement);
}
