import { useEffect } from 'react';
import { fragmentToRangeList, selectionToFragment } from './lib/deeplinks';
import { selectRanges, SelectRangesOptions } from './lib/selectranges';
import { useRenderState } from './renderstate';

export function HighlightProvidedSelection(props: {
  options?: SelectRangesOptions | undefined;
  skipSelectionMonitoring?: boolean;
}) {
  const renderState = useRenderState();
  const ranges = renderState.ranges;

  useEffect(() => {
    // Only handle deeplink fragments (identified by the presence of ':')
    // to allow default behavior for all other fragments such as anchor links
    if (window.location.hash && window.location.hash.includes(':')) {
      const selectionRanges = fragmentToRangeList(
        window.location.hash.substring(1)
      );
      selectRanges(selectionRanges, props.options);
      return;
    }

    if (ranges !== undefined && ranges.length > 0) {
      try {
        const selectionRanges = fragmentToRangeList(ranges[0]);
        selectRanges(selectionRanges, props.options);
      } catch (e) {
        // Ignore.
      }
      return;
    }
  }, [ranges, props.options]);

  useEffect(() => {
    if (props.skipSelectionMonitoring) {
      return;
    }

    // Based on the fragment in the original deeplinks.ts library.
    const timeoutHandle = setTimeout(() => {
      document.addEventListener('selectionchange', () => {
        const fragment = selectionToFragment(
          document.getSelection() as Selection
        );

        // Only replace selection fragments so all other fragments persist in the URL
        if (fragment && fragment.includes(':')) {
          // replaceState is used instead of setting location.hash to avoid scrolling.
          history.replaceState(null, '', location.pathname + fragment);
        }
      });

      return () => {
        clearTimeout(timeoutHandle);
      };
    }, 0);
  }, [props.skipSelectionMonitoring]);

  return <></>;
}
