import { useEffect } from 'react';
import { isUnderContentContainer } from './Container';
import { fragmentToRangeList, selectionToFragment } from './lib/deeplinks';
import { selectRanges, SelectRangesOptions } from './lib/selectranges';
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
    // Only handle deeplink paths (identified by the presence of ':')
    // to allow default behavior for all other fragments such as anchor links
    if (
      window.location.pathname &&
      window.location.pathname.includes(':') &&
      window.location.pathname.startsWith(props.pathPrefix)
    ) {
      const selectionRanges = fragmentToRangeList(
        document,
        window.location.pathname.substring(props.pathPrefix.length)
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

    // Based on the fragment in the original deeplinks.ts library.
    const timeoutHandle = setTimeout(() => {
      document.addEventListener('selectionchange', () => {
        const selection = document.getSelection() as Selection;
        if (!selection || selection.rangeCount === 0) {
          history.replaceState(null, '', location.pathname);
          return;
        }

        const range = selection.getRangeAt(0);
        if (!isUnderContentContainer(range.startContainer)) {
          history.replaceState(null, '', location.pathname);
          return;
        }

        const fragment = selectionToFragment(document, selection);

        // Only replace selection fragments so all other fragments persist in the URL
        if (fragment && fragment.includes(':') && fragment.startsWith('#')) {
          // replaceState is used instead of setting location.hash to avoid scrolling.
          history.replaceState(
            null,
            '',
            `${location.origin}/${fragment.substring(1)}`
          );
          if (props.onSelectionChanged) {
            props.onSelectionChanged(fragment.substring(1));
          }
        }
      });

      return () => {
        clearTimeout(timeoutHandle);
      };
    }, 0);
  }, [props.skipSelectionMonitoring, props.onSelectionChanged, props]);

  return <></>;
}
