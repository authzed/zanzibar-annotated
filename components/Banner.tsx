import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import AnnotationSetSelect from './AnnotationSetSelect';
import { AuthZedLogo, AuthZedMark } from './AuthZedLogo';
import { getAvailableAnnotationSets } from './annotation';

/**
 * Banner displayed above the first page of the paper.
 * The annotation set nav bar assumes only one annotation set is active at a time.
 */
export function Banner(props: {
  isTopOfContent: boolean;
  onHeightChange: (height: number) => void;
}) {
  const { isTopOfContent, onHeightChange } = props;
  const availableAnnotationSets = getAvailableAnnotationSets();

  // The paper container is positioned below the banner, whose height depends
  // on the scroll state and the viewport width.
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(() =>
      onHeightChange(element.offsetHeight)
    );
    observer.observe(element, { box: 'border-box' });
    return () => observer.disconnect();
  }, [onHeightChange]);

  return (
    <div
      ref={ref}
      className={clsx(
        'w-full flex bg-white text-black font-sans border-b border-[#d9d6e3] z-100',
        {
          'flex-col md:flex-row': isTopOfContent,
          scrolled: !isTopOfContent,
        }
      )}
    >
      <a
        href="https://authzed.com?utm_source=za&utm_medium=toolbar"
        target="_blank"
        rel="noopener"
        aria-label="AuthZed"
        className={clsx(
          'flex shrink-0 bg-[#17141f] transition-all',
          isTopOfContent
            ? 'min-h-[52px] md:min-h-16 items-center justify-between gap-3 px-4 md:flex-col md:items-start md:justify-center md:gap-1 md:px-7'
            : 'min-h-[52px] md:min-h-16 w-14 md:w-auto items-center justify-center md:px-5'
        )}
      >
        <AuthZedLogo
          className={clsx('text-[#f3f1ff] transition-all', {
            'h-6 md:h-8': isTopOfContent,
            'hidden md:block h-7': !isTopOfContent,
          })}
        />
        {!isTopOfContent && <AuthZedMark className="h-6 md:hidden" />}
        {isTopOfContent && (
          <span className="block text-[10px] leading-4 font-semibold tracking-[.14em] uppercase text-[#cfc9e0]">
            Annotated edition
          </span>
        )}
      </a>
      <div className="flex flex-1 min-w-0 items-center gap-2.5 py-2.5 pl-4 pr-2.5 md:py-0 md:px-0">
        <div className="flex-1 min-w-0 md:px-6">
          <h2
            className={clsx(
              'm-0 font-serif font-bold leading-tight transition-all',
              isTopOfContent
                ? 'text-[17px] md:text-[19px] md:truncate'
                : 'text-[17px] md:text-base truncate'
            )}
          >
            Zanzibar: Google’s Consistent, Global Authorization System
          </h2>
          {isTopOfContent && (
            <p className="m-0 mt-0.5 text-xs md:text-[13px] text-gray-600 md:truncate">
              Originally presented at 2019 USENIX Annual Technical Conference
            </p>
          )}
        </div>
        <div className="shrink-0 md:py-1 md:pr-4">
          <AnnotationSetSelect
            items={availableAnnotationSets}
            default="intro"
          />
        </div>
      </div>
    </div>
  );
}
