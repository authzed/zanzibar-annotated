import { PropsWithChildren, UIEvent, useState } from 'react';
import { BannerHeights } from './Banner';

const CONTAINER_ELEMENT_ID = 'paper-container';
const CONTENT_CONTAINER_CLASS_NAME = 'paper-content-container';

/**
 * Container is the scrollable container element for the content of the paper.
 */
export function Container(
  props: PropsWithChildren<{
    onScrolled: (isTopOfContent: boolean) => void;
  }>
) {
  const [isTopOfContent, setIsTopOfContent] = useState(false);

  const handleScrolled = (e: UIEvent<HTMLDivElement>) => {
    props.onScrolled(e.currentTarget.scrollTop === 0);
    setIsTopOfContent(e.currentTarget.scrollTop === 0);
  };

  return (
    <div
      onScroll={handleScrolled}
      id={CONTAINER_ELEMENT_ID}
      className="transition-all"
      style={{
        position: 'absolute',
        height: isTopOfContent
          ? `calc(100vh - ${BannerHeights.Large})`
          : `calc(100vh - ${BannerHeights.Small})`,
        top: isTopOfContent ? BannerHeights.Large : BannerHeights.Small,
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
