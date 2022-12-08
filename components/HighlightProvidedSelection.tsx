import debounce from 'lodash.debounce';
import { useEffect } from 'react';
import useDeepCompareEffect from 'use-deep-compare-effect';
import { isUnderContentContainer } from './Container';
import { fragmentToRangeList, selectionToFragment } from './lib/deeplinks';
import { selectRanges, SelectRangesOptions } from './lib/selectranges';
import { useRenderState } from './renderstate';

type SelectionPathParts = {
  basePath?: string;
  pathPrefix?: string;
  selectionId?: string;
};

/**
 * Parses a pathname into parts used to highlight selections.
 * basePath: The base path for the siet. Only supports a single level base path.
 * pathPrefix: The prefix that identifies that type of selection. Must start with '_'
 * selectionId: The content selection id
 */
function getSelectionPathParts(pathname: string): SelectionPathParts {
  // Only handle deeplink paths (identified by the presence of ':')
  // to allow default behavior for all other fragments such as anchor links
  let basePath, pathPrefix, selectionId;
  const pathParts = pathname.split('/').filter((part) => part);
  const partCount = pathParts.length;
  let part = pathParts.pop();
  switch (partCount) {
    case 0:
      // No parts present
      break;
    case 1:
      // /<selection id>
      // /<base path>
      if (part?.includes(':')) {
        selectionId = part;
      } else {
        basePath = part;
      }
      break;
    case 2:
      // /<base path>/<selection id>
      // /<path prefix>/<selection id>
      if (part?.includes(':')) {
        selectionId = part;
        const baseOrPrefix = pathParts.pop();
        // path prefixes must start with an underscore
        if (baseOrPrefix?.startsWith('_')) {
          pathPrefix = baseOrPrefix;
        } else {
          basePath = baseOrPrefix;
        }
      } else {
        // <unknown format>
        // Preserve base path, ignore remainder of path
        basePath = pathParts.pop();
      }
      break;
    case 3:
      // /<base path>/<path prefix>/<selection id>
      if (part?.includes(':')) {
        selectionId = part;
        pathPrefix = pathParts.pop();
        basePath = pathParts.pop();
      }
      // <unknown format>
      break;
    default:
      console.log('Unsupported path format');
      break;
  }

  return {
    basePath,
    pathPrefix,
    selectionId,
  };
}

export function HighlightProvidedSelection(props: {
  options?: SelectRangesOptions | undefined;
  skipSelectionMonitoring?: boolean;
  pathPrefix: string;
  onSelectionChanged?: (fragement: string) => void;
}) {
  const renderState = useRenderState();
  const ranges = renderState.ranges;

  useDeepCompareEffect(() => {
    const pathParts = getSelectionPathParts(window.location.pathname);

    if (pathParts?.selectionId) {
      const selectionRanges = fragmentToRangeList(
        document,
        pathParts.selectionId
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

    const { basePath, pathPrefix, selectionId } = getSelectionPathParts(
      window.location.pathname
    );

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
