import debounce from 'lodash.debounce';
import { useEffect } from 'react';
import { isUnderContentContainer } from './Container';
import { fragmentToRangeList, selectionToFragment } from './lib/deeplinks';
import { selectRanges, SelectRangesOptions } from './lib/selectranges';
import { getPathSegments } from './pathsegments';

export function HighlightProvidedSelection(props: {
  options?: SelectRangesOptions | undefined;
  pathPrefix: string;
  onSelectionChanged?: (fragement: string) => void;
}) {
  useEffect(() => {
    const pathSegments = getPathSegments(window.location.pathname);

    if (pathSegments?.selectionId) {
      const selectionRanges = fragmentToRangeList(
        document,
        pathSegments.selectionId
      );
      selectRanges(selectionRanges, props.options);
    }
  }, [props.pathPrefix, props.options]);

  useEffect(() => {
    const { basePath, pathPrefix } = getPathSegments(window.location.pathname);

    // Based on the fragment in the original deeplinks.ts library.
    const timeoutHandle = setTimeout(() => {
      document.addEventListener(
        'selectionchange',
        debounce(() => {
          const selection = document.getSelection() as Selection;
          if (!selection || selection.rangeCount === 0) {
            history.replaceState(null, '', basePath ? `/${basePath}` : '/');
            return;
          }

          const range = selection.getRangeAt(0);
          if (
            range.collapsed ||
            !isUnderContentContainer(range.startContainer)
          ) {
            history.replaceState(null, '', basePath ? `/${basePath}` : '/');
            return;
          }

          const fragment = selectionToFragment(document, selection);

          // Only replace selection fragments so all other fragments persist in the URL
          if (fragment && fragment.includes(':') && fragment.startsWith('#')) {
            const newPath = `${location.origin}${
              basePath ? `/${basePath}` : ''
            }${pathPrefix ? `/${pathPrefix}` : ''}/${fragment.substring(1)}`;

            // replaceState is used instead of setting location.hash to avoid scrolling.
            history.replaceState(null, '', newPath);
            if (props.onSelectionChanged) {
              props.onSelectionChanged(fragment.substring(1));
            }
          }
        }, 50)
      );

      return () => {
        clearTimeout(timeoutHandle);
      };
    }, 0);
  }, [props.onSelectionChanged, props]);

  return <></>;
}
