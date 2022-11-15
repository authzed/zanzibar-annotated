import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid';
import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAnnotation } from './annotation';

/**
 * Sticky menu for the paper reader.
 * Assumes that only one annotation set is active at a time.
 * Adapted from https://tailwindcomponents.com/component/nestable-dropdown-menu
 */
export function PaperInfoMenu() {
  const [collapsed, setCollapsed] = useState(true);
  const { activeAnnotationSetIds, getAnnotationSet } = useAnnotation();

  const annotationSet = useMemo(() => {
    if (activeAnnotationSetIds.length === 1) {
      return getAnnotationSet(activeAnnotationSetIds[0]);
    }

    return undefined;
  }, [getAnnotationSet, activeAnnotationSetIds]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className="inline-block fixed bottom-10 right-10 z-50">
      <button
        onClick={() => {
          setCollapsed(!collapsed);
        }}
        className="outline-none focus:outline-none flex items-center"
      >
        <span>
          <QuestionMarkCircleIcon
            className={`${
              collapsed ? 'fill-current' : 'fill-gray-300'
            } h-12 w-12 transform transition duration-150 ease-in-out`}
          />
        </span>
      </button>
      <div
        className={`bg-white border transform scale-0 absolute
  transition duration-150 ease-in-out origin-bottom-right min-w-[16rem] bottom-12 right-1 text-sm shadow-md rounded
  ${collapsed ? 'scale-0' : 'scale-100'}`}
      >
        <div className="p-3 bg-black text-white rounded-t">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: (props) => <p className="indent-0 mb-2">{props.children}</p>,
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
            {annotationSet?.description ?? ''}
          </ReactMarkdown>
        </div>
        <ul className="text-black text-right">
          <li className="rounded px-3 py-2 hover:bg-gray-100 border-b border-gray-200">
            <a
              href="http://github.com/authzed/spicedb"
              className="block text-black hover:text-indigo-500"
            >
              SpiceDB on GitHub &#8599;
            </a>
          </li>
          <li className="rounded px-3 py-2 hover:bg-gray-100">
            <a
              href="http://authzed.com/discord"
              className="block text-black hover:text-indigo-500"
            >
              Discuss on Discord &#8599;
            </a>
          </li>
          <li className="rounded px-3 py-2 hover:bg-gray-100 border-t border-gray-200 cursor-pointer">
            <span
              onClick={scrollToTop}
              className="block text-black hover:text-gray-500"
            >
              Scroll to top &#8593;
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
