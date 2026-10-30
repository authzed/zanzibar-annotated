import { PropsWithChildren } from 'react';

export const CONTAINER_ELEMENT_ID = 'paper-container';
const CONTENT_CONTAINER_CLASS_NAME = 'paper-content-container';

// How far, in pixels, the paper scrolls before it no longer counts as the top
// of the content and the banner collapses.
export const TOP_OF_CONTENT_THRESHOLD = 80;

/**
 * Container is the scrollable container element for the content of the paper.
 * The banner overlays it, and sets its padding to keep the paper below the
 * expanded banner.
 */
export function Container(props: PropsWithChildren) {
  return (
    <div
      id={CONTAINER_ELEMENT_ID}
      // Until the banner measures itself, estimate its expanded height.
      className="pt-[150px] md:pt-[65px]"
      style={{
        position: 'absolute',
        top: '0px',
        left: '0px',
        right: '0px',
        bottom: '0px',
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: '-1',
      }}
    >
      {props.children}
    </div>
  );
}

export function ContentContainer(props: PropsWithChildren) {
  return <div className={CONTENT_CONTAINER_CLASS_NAME}>{props.children}</div>;
}

/**
 * isUnderContentContainer returns true if the given node is found in the DOM tree under the ContentContainer
 * element.
 */
export function isUnderContentContainer(node: Node): boolean {
  return (
    Array.from(
      document.getElementsByClassName(CONTENT_CONTAINER_CLASS_NAME)
    ).filter((cc) => cc.contains(node)).length > 0
  );
}
