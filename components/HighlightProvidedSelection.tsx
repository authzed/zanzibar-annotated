import debounce from 'lodash.debounce';
import { useEffect } from 'react';
import { isUnderContentContainer } from './Container';
import { fragmentToRangeList, selectionToFragment } from './lib/deeplinks';
import { selectRanges, SelectRangesOptions } from './lib/selectranges';
import { getPathSegments } from './pathsegments';
import { useRenderState } from './renderstate';

export function HighlightProvidedSelection(props: {
  options?: SelectRangesOptions | undefined;
  skipSelectionMonitoring?: boolean;
  pathPrefix: string;
  onSelectionChanged?: (fragement: string) => void;
}) {
  const renderState = useRenderState();
  const ranges = renderState.ranges;

  useEffect(() => {
    const pathSegments = getPathSegments(window.location.pathname);

    if (pathSegments?.selectionId) {
      const selectionRanges = fragmentToRangeList(
        document,
        pathSegments.selectionId
      );
      selectRanges(selectionRanges, props.options);
      return;
    }

    if (ranges !== undefined && ranges.length > 0) {
      try {
        const selectionRanges = fragmentToRangeList(document, ranges[0]);
        selectRanges(selectionRanges, props.options);
        (window as any)._scrolled = true;
      } catch (e) {
        // Ignore.
      }
      return;
    }
  }, [ranges, props.pathPrefix, props.options]);

  useEffect(() => {
    if (props.skipSelectionMonitoring) {
      return;
    }

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
  }, [props.skipSelectionMonitoring, props.onSelectionChanged, props]);

  return <></>;
}
