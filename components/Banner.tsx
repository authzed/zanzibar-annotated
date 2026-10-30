import clsx from 'clsx';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import AnnotationSetSelect from './AnnotationSetSelect';
import { AuthZedLogo, AuthZedMark } from './AuthZedLogo';
import { getAvailableAnnotationSets } from './annotation';
import { CONTAINER_ELEMENT_ID, TOP_OF_CONTENT_THRESHOLD } from './Container';

const AUTHZED_URL = 'https://authzed.com?utm_source=za&utm_medium=toolbar';

// A long ease-out so the banner moves quickly at first and settles gently.
const TRANSITION =
  'transition-all duration-500 ease-[cubic-bezier(0.33,1,0.68,1)]';

// How long the banner's height must stay unchanged before it's reported.
const HEIGHT_SETTLE_MS = 100;

// Collapses an element's height by animating a single grid row between its
// content height and zero. The child must have `min-h-0` and `overflow-hidden`.
function collapsible(open: boolean) {
  return clsx('grid', TRANSITION, open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]');
}

/**
 * Banner displayed above the first page of the paper. It overlays the paper
 * and collapses when the paper is scrolled. Everything is always rendered and
 * transitioned between the two states, so the change animates smoothly.
 * The annotation set nav bar assumes only one annotation set is active at a time.
 */
export function Banner() {
  const availableAnnotationSets = getAvailableAnnotationSets();

  // The scroll state lives here rather than in the layout so that collapsing
  // the banner only re-renders the banner, not the whole paper.
  const [isTopOfContent, setIsTopOfContent] = useState(true);
  const isTopOfContentRef = useRef(true);
  useEffect(() => {
    const container = document.getElementById(CONTAINER_ELEMENT_ID);
    if (!container) {
      return;
    }
    const onScroll = () => {
      const isTop = container.scrollTop < TOP_OF_CONTENT_THRESHOLD;
      isTopOfContentRef.current = isTop;
      setIsTopOfContent(isTop);
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  // The paper is padded by the banner's expanded height and scrolls targets
  // below its current height; both are set on the paper's container once the
  // height settles. They're set directly, rather than through React state or
  // inherited CSS variables, so the paper isn't re-rendered or restyled. The expanded height is only updated while the banner is
  // expanded, and only when it grows or the viewport width changes, so the
  // paper doesn't move as the banner animates. The first measurement is taken
  // before the page paints, so scrolling to a linked selection on load uses
  // the real height rather than the estimate.
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const container = document.getElementById(CONTAINER_ELEMENT_ID);
    if (!container) {
      return;
    }
    let expanded: { height: number; width: number } | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      const height = element.offsetHeight;
      const width = window.innerWidth;
      container.style.scrollPaddingTop = `${height}px`;
      if (
        isTopOfContentRef.current &&
        (!expanded || expanded.width !== width || height > expanded.height)
      ) {
        expanded = { height, width };
        container.style.paddingTop = `${height}px`;
      }
    };
    update();
    const observer = new ResizeObserver(() => {
      clearTimeout(timeout);
      timeout = setTimeout(update, HEIGHT_SETTLE_MS);
    });
    observer.observe(element, { box: 'border-box' });
    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={clsx(
        'w-full flex flex-col md:flex-row bg-white text-black font-sans border-b border-[#d9d6e3] z-100',
        TRANSITION,
        { scrolled: !isTopOfContent }
      )}
    >
      {/* On phones the brand is a row above the title that collapses on
          scroll. On larger screens it's a block on the left. */}
      {/* Once collapsed on phones it's hidden, which also removes the link from
          the tab order; visibility only switches after the transition ends. */}
      <div
        className={clsx(
          collapsible(isTopOfContent),
          'md:grid-rows-[1fr]',
          !isTopOfContent && 'max-md:invisible'
        )}
      >
        {/* On phones the row's contents are pinned to its bottom edge, so they
            slide up out of view as the row closes rather than being cut off. */}
        <a
          href={AUTHZED_URL}
          target="_blank"
          rel="noopener"
          aria-label="AuthZed"
          className={clsx(
            'min-h-0 overflow-hidden flex flex-col justify-end bg-[#17141f] md:h-full md:justify-center',
            TRANSITION,
            isTopOfContent ? 'md:px-7' : 'md:px-5'
          )}
        >
          <div className="shrink-0 h-[52px] flex items-center justify-between gap-3 px-4 md:h-auto md:flex-col md:items-start md:gap-0 md:px-0">
            <AuthZedLogo
              className={clsx(
                'shrink-0 h-6 text-[#f3f1ff]',
                TRANSITION,
                isTopOfContent ? 'md:h-8' : 'md:h-7'
              )}
            />
            <span
              className={clsx(
                collapsible(isTopOfContent),
                'max-md:grid-rows-[1fr]'
              )}
            >
              <span className="min-h-0 overflow-hidden block text-[10px] leading-4 font-semibold tracking-[.14em] uppercase whitespace-nowrap text-[#cfc9e0] md:mt-1">
                Annotated edition
              </span>
            </span>
          </div>
        </a>
      </div>
      <div className="relative flex flex-1 min-w-0 items-center min-h-[52px] md:min-h-16">
        {/* Phones slide the AuthZed mark in over the left edge in place of the
            collapsed brand row. It overlays the title rather than taking up
            space, so the title doesn't rewrap while the bar animates. */}
        <a
          href={AUTHZED_URL}
          target="_blank"
          rel="noopener"
          aria-label="AuthZed"
          inert={isTopOfContent}
          className={clsx(
            'md:hidden absolute z-10 inset-y-0 left-0 w-14 flex items-center justify-center bg-[#17141f]',
            TRANSITION,
            isTopOfContent ? '-translate-x-full' : 'translate-x-0'
          )}
        >
          <AuthZedMark className="h-6 shrink-0" />
        </a>
        {/* When collapsed on phones, the title moves right of the mark and is
            clipped to one line that fades out at the right edge. */}
        <div
          className={clsx(
            'flex-1 min-w-0 overflow-hidden pl-4 md:py-0 md:px-6',
            TRANSITION,
            // The collapsed padding brings the row to exactly its 52px minimum
            // height at the end of the animation, so it shrinks in step with
            // the rest of the banner rather than stopping early.
            isTopOfContent
              ? 'py-2.5'
              : 'py-[15px] max-md:[mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)]'
          )}
        >
          <div
            className={clsx(
              TRANSITION,
              isTopOfContent ? 'translate-x-0' : 'max-md:translate-x-14'
            )}
          >
            <h2
              className={clsx(
                'm-0 overflow-hidden font-serif font-bold text-[17px] leading-[22px] md:truncate',
                TRANSITION,
                isTopOfContent
                  ? 'max-h-11 md:text-[19px] md:leading-6'
                  : 'max-h-[22px] md:text-base'
              )}
            >
              Zanzibar: Google’s Consistent, Global Authorization System
            </h2>
            <div className={collapsible(isTopOfContent)}>
              <p className="min-h-0 overflow-hidden m-0 indent-0 text-xs leading-4 md:text-[13px] text-gray-600">
                <span className="block pt-0.5 md:truncate">
                  Originally presented at 2019 USENIX Annual Technical
                  Conference
                </span>
              </p>
            </div>
          </div>
        </div>
        <div className="shrink-0 px-2.5 md:pl-0 md:py-1 md:pr-4">
          <AnnotationSetSelect
            items={availableAnnotationSets}
            default="intro"
          />
        </div>
      </div>
    </div>
  );
}
