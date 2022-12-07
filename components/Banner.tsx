import clsx from 'clsx';
import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getAvailableAnnotationSets, useAnnotation } from './annotation';
import AnnotationSetSelect from './AnnotationSetSelect';

export enum BannerHeights {
  Large = '55px',
  Small = '44px',
}

/**
 * Banner displayed above the first page of the paper.
 * The annotation set nav bar assumes only one annotation set is active at a time.
 */
export function Banner(props: { isTopOfContent: boolean }) {
  const { activeAnnotationSetIds, getAnnotationSet } = useAnnotation();

  const availableAnnotationSets = getAvailableAnnotationSets();

  const annotationSet = useMemo(() => {
    if (activeAnnotationSetIds.length === 1) {
      return getAnnotationSet(activeAnnotationSetIds[0]);
    }

    return undefined;
  }, [getAnnotationSet, activeAnnotationSetIds]);

  return (
    <>
      <div
        className={clsx(
          'w-full transition-shadow p-1 pl-2 pr-2 bg-white text-black font-sans text-sm grid grid-cols-[auto,1fr,auto] gap-0 border-solid items-center border-b-2 border-[#cccccc] z-100',
          {
            scrolled: !props.isTopOfContent,
          }
        )}
      >
        <div>
          <img
            src="/favicon.svg"
            className={clsx('transition-all', {
              'h-10': props.isTopOfContent,
              'h-5': !props.isTopOfContent,
            })}
          />
        </div>
        <div className="text-left pl-2 truncate text-ellipsis">
          <h2
            className={clsx('transition-all m-0', {
              'text-lg': props.isTopOfContent,
              'text-sm': !props.isTopOfContent,
            })}
          >
            Zanzibar
            <span
              className={clsx('hidden xl:inline-block', {
                'lg:inline-block': props.isTopOfContent,
              })}
            >
              : Google’s Consistent, Global Authorization System
            </span>
            {!props.isTopOfContent && (
              <div className="annotation-markdown hidden md:inline-block">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: (props) => (
                      <a
                        href={props.href}
                        target="_blank"
                        rel="noopener"
                        className="text-black hover:text-indigo-200 underline"
                      >
                        {props.children}
                      </a>
                    ),
                  }}
                >
                  {annotationSet?.cta ?? ''}
                </ReactMarkdown>
              </div>
            )}
          </h2>
          <h4
            className={clsx(
              'mb-0 transition-all overflow-hidden hidden lg:block',
              {
                'h-[20px]': props.isTopOfContent,
                'h-[0px]': !props.isTopOfContent,
              }
            )}
          >
            Annotated by{' '}
            <a
              href="https://authzed.com"
              target="_blank"
              rel="noopener"
              className="text-black hover:text-indigo-200 underline"
            >
              AuthZed
            </a>
            &nbsp;| Originally presented at 2019 USENIX Annual Technical
            Conference
          </h4>
        </div>
        <div className="text-right">
          {props.isTopOfContent && (
            <span className="hidden lg:inline-block">
              Choose annotations:&nbsp;&nbsp;
            </span>
          )}
          <AnnotationSetSelect
            items={availableAnnotationSets}
            default="intro"
          />
        </div>
      </div>
    </>
  );
}
