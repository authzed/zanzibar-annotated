import { useState } from 'react';
import { useAnnotation } from './annotation';

// Adapted from https://tailwindcomponents.com/component/nestable-dropdown-menu
export function PaperInfoMenu() {
  const [collapsed, setCollapsed] = useState(true);
  const {
    allAnnotationSetIds,
    activeAnnotationSetIds,
    setAnnotationSetActive,
    setAnnotationSetInactive,
  } = useAnnotation();

  return (
    <div className="inline-block fixed bottom-10 right-10 z-50">
      <button
        onClick={() => {
          setCollapsed(!collapsed);
        }}
        className="outline-none focus:outline-none border hover:shadow-lg px-4 py-2 bg-white rounded-sm flex items-center"
      >
        <span>
          <svg
            className={`fill-current h-4 w-4 transform transition duration-150 ease-in-out
          ${collapsed ? 'rotate-180' : 'rotate-0'}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </span>
      </button>
      <div
        className={`bg-white border transform scale-0 absolute
  transition duration-150 ease-in-out origin-bottom-right min-w-[10rem] bottom-8 right-0 text-sm
  ${collapsed ? 'scale-0' : 'scale-100'}`}
      >
        <div className="bg-black text-white p-2">
          The Annotated Zanzibar Paper is hosted by{' '}
          <a
            href="https://authzed.com"
            className="text-white underline hover:text-gray-200"
          >
            Authzed
          </a>
          .
        </div>
        <ul className="text-black">
          {allAnnotationSetIds.map((setId: string) => {
            return (
              <li
                className="rounded px-3 py-2 hover:bg-gray-100 border-b border-gray-200"
                key={setId}
              >
                <a
                  onClick={() => {
                    activeAnnotationSetIds.includes(setId)
                      ? setAnnotationSetInactive(setId)
                      : setAnnotationSetActive(setId);
                    return false;
                  }}
                  className="block text-black hover:text-gray-500"
                >
                  Toggle {setId} annotations
                </a>
              </li>
            );
          })}
          <li className="rounded px-3 py-2 hover:bg-gray-100 border-b border-gray-200">
            <a
              href="http://github.com/authzed/spicedb"
              className="block text-black hover:text-gray-500"
            >
              SpiceDB on GitHub
            </a>
          </li>
          <li className="rounded px-3 py-2 hover:bg-gray-100">
            <a
              href="http://authzed.com/discord"
              className="block text-black hover:text-gray-500"
            >
              Discuss on Discord
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
