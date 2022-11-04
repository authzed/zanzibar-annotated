import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getAvailableAnnotationSets, useAnnotation } from './annotation';
import AnnotationSetSelect from './AnnotationSetSelect';

/**
 * Banner displayed above the first page of the paper.
 * The annotation set nav bar assumes only one annotation set is active at a time.
 */
export function Banner() {
  const { activeAnnotationSetIds, getAnnotationSet, toggleAnnotationSet } =
    useAnnotation();

  const availableAnnotationSets = getAvailableAnnotationSets();

  const annotationSet = useMemo(() => {
    if (activeAnnotationSetIds.length === 1) {
      return getAnnotationSet(activeAnnotationSetIds[0]);
    }

    return undefined;
  }, [getAnnotationSet, activeAnnotationSetIds]);

  return (
    <>
      <div className="w-full mt-0 lg:mt-10 -mb-20 p-3 bg-black text-white font-sans text-center">
        Zanzibar: Google’s Consistent, Global Authorization System
        <p className="text-xs">
          Originally presented at 2019 USENIX Annual Technical Conference
          (USENIX ATC ’19)
        </p>
      </div>
      <div className="w-full sticky top-0 p-3 mt-20 -mb-20 z-10 bg-[#494B6A] text-white font-sans text-sm grid grid-cols-6 gap-0 grid-flow-col">
        <div className="md:col-span-1 col-span-1 my-auto">
          <AnnotationSetSelect
            items={availableAnnotationSets}
            default="intro"
          />
        </div>
        <div className="md:col-span-4 col-span-6 text-center px-4">
          <h2 className="m-0 align-middle">{annotationSet?.title}</h2>
          <h4>{annotationSet?.subtitle}</h4>
        </div>

        <div className="md:col-span-1 col-span-3 text-right my-auto">
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
      </div>
    </>
  );
}
