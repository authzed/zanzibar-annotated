import { GetServerSideProps } from 'next';
import { LayoutProps } from '../components/layout';
import { fragmentToRangeList } from '../components/lib/deeplinks';
import Zanzibar from '../content/zanzibar.mdx';
import { CANONICAL_URL_BASE, getPreviewEndpoint } from '../util/siteconfig';
import { getParsedPaperDOM } from '../util/parseddom';

export default function Default(props: LayoutProps) {
  return (
    <Zanzibar
      selectionContext={props.selectionContext}
      canonicalUrl={props.canonicalUrl}
      baseUrl={props.baseUrl}
    />
  );
}

export const getServerSideProps: GetServerSideProps<LayoutProps> = async ({
  res,
  req,
}) => {
  let fragment = undefined;
  if (req.url?.length !== undefined && req.url.length > 1) {
    fragment = req.url.substring(1);
  }

  // NOTE: This can happen during debugging.
  if (fragment?.startsWith('_next')) {
    return {
      props: {
        baseUrl: CANONICAL_URL_BASE,
        canonicalUrl: CANONICAL_URL_BASE,
        selectionContext: null,
      },
    };
  }

  // Create the preview text for the selection by rendering the paper's DOM and then
  // grabbing the ranges and their text.
  // Make sure to not raise errors if the paper can't be rendered or there is a
  // selection parse error.
  let selectionRanges: Range[] | undefined = undefined;
  let paperRendered = false;
  try {
    const dom = getParsedPaperDOM();
    paperRendered = true;
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

  // Cache range response for a week, allow stale for a day. If the paper
  // couldn't be rendered, the page is missing its selection preview, so don't
  // cache it.
  res.setHeader(
    'Cache-Control',
    paperRendered ? 's-maxage=604800, stale-while-revalidate=86400' : 'no-store'
  );

  return {
    props: {
      baseUrl: CANONICAL_URL_BASE,
      canonicalUrl: fragment
        ? `${CANONICAL_URL_BASE}/${fragment}`
        : CANONICAL_URL_BASE,
      selectionContext: selectionRanges
        ? {
            previewImageUrl: fragment
              ? `${getPreviewEndpoint()}/api/preview/${fragment}`
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
