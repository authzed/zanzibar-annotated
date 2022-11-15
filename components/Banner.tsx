import clsx from 'clsx';
import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getAvailableAnnotationSets, useAnnotation } from './annotation';
import AnnotationSetSelect from './AnnotationSetSelect';

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
            src="/favicon.ico"
            className={clsx('transition-all', {
              'h-10': props.isTopOfContent,
              'h-5': !props.isTopOfContent,
            })}
          />
        </div>
        <div className="text-left pl-2">
          <h2
            className={clsx('transition-all m-0', {
              'text-lg': props.isTopOfContent,
              'text-sm': !props.isTopOfContent,
            })}
          >
            Zanzibar: Google’s Consistent, Global Authorization System
            {!props.isTopOfContent && (
              <div className="annotation-markdown">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: (props) => (
                      <a
                        href={props.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-white hover:text-indigo-200 underline"
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
            className={clsx('mb-0 transition-all overflow-hidden', {
              'h-[20px]': props.isTopOfContent,
              'h-[0px]': !props.isTopOfContent,
            })}
          >
            Annotated by Authzed, originally presented at 2019 USENIX Annual
            Technical Conference (USENIX ATC ’19)
          </h4>
        </div>
        <div className="text-right">
          Choose annotations:&nbsp;&nbsp;
          <AnnotationSetSelect
            items={availableAnnotationSets}
            default="intro"
          />
        </div>
      </div>
    </>
  );
}
