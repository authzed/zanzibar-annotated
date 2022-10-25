import { Placement } from '@popperjs/core';
import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import ClickAwayListener from 'react-click-away-listener';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import { usePopper } from 'react-popper';
import remarkGfm from 'remark-gfm';
import annotations from '../content/annotations.yaml';
import popperStyles from '../styles/Popper.module.css';

type AnnotationData = {
  id: string;
  title?: string;
  content: string;
};

interface AnnotationManagerInterface {
  getAnnotation(id: string): AnnotationData | undefined;
  getAnnotationGroup(groupId: string): AnnotationData[];
  activeAnnotationId: string;
  setAnnotationActive(id: string): void;
  setAnnotationInactive(id: string): void;
  focusedAnnotationId: string;
  focusAnnotation(id: string): void;
  unfocusAnnotation(id: string): void;
}

const NoopAnnotationManagerProvider = {
  getAnnotation: (id: string) => {
    return {
      id: '',
      content: '',
    };
  },
  getAnnotationGroup: (groupId: string) => [],
  activeAnnotationId: '',
  setAnnotationActive: (id: string) => {},
  setAnnotationInactive: (id: string) => {},
  focusedAnnotationId: '',
  focusAnnotation: (id: string) => {},
  unfocusAnnotation: (id: string) => {},
};

const AnnotationManagerContext = createContext<AnnotationManagerInterface>(
  NoopAnnotationManagerProvider
);

/**
 * Provider that holds global annotation view state and annotation data.
 */
export const AnnotationManagerProvider: React.FC<PropsWithChildren> = (
  props: PropsWithChildren
) => {
  const [activeAnnotationId, setActiveAnnotationId] = useState('');
  const [focusedAnnotationId, setFocusedAnnotationId] = useState('');
  const annotationMap: Map<string, AnnotationData> = useMemo(() => {
    const map = new Map<string, AnnotationData>();
    for (const [_, group] of Object.entries(annotations)) {
      for (const [key, annotationData] of Object.entries(group as object)) {
        map.set(key, { id: key, ...annotationData });
      }
    }
    return map;
  }, []);

  const getAnnotationGroup = (groupId: string): AnnotationData[] => {
    const data: { [key: string]: Omit<AnnotationData, 'id'> } | undefined =
      annotations[groupId];
    if (!data) return [];

    return Object.entries(data).map(([id, annotation]) => {
      return { ...annotation, id };
    });
  };

  return (
    <AnnotationManagerContext.Provider
      value={{
        getAnnotation: (id: string) => {
          return annotationMap.get(id);
        },
        getAnnotationGroup,
        activeAnnotationId,
        setAnnotationActive: (id: string) => setActiveAnnotationId(id),
        setAnnotationInactive: (id: string) => setActiveAnnotationId(''),
        focusedAnnotationId,
        focusAnnotation: (id: string) => setFocusedAnnotationId(id),
        unfocusAnnotation: (id: string) => setFocusedAnnotationId(''),
      }}
    >
      {props.children}
    </AnnotationManagerContext.Provider>
  );
};

function useAnnotation() {
  const {
    getAnnotation,
    getAnnotationGroup,
    activeAnnotationId,
    setAnnotationActive,
    setAnnotationInactive,
    focusedAnnotationId,
    focusAnnotation,
    unfocusAnnotation,
  } = useContext(AnnotationManagerContext);
  return {
    getAnnotation,
    getAnnotationGroup,
    activeAnnotationId,
    setAnnotationActive,
    setAnnotationInactive,
    focusedAnnotationId,
    focusAnnotation,
    unfocusAnnotation,
  };
}

type HighlightProps = {
  annotationId: string;
  bgColorClass?: string;
  popperPlacement?: Placement;
  showAnnotation?: boolean;
};

/**
 * Component that visually highlights child components and provides annotation content based on the annotation id.
 */
export function Highlight(props: PropsWithChildren<HighlightProps>) {
  const {
    annotationId,
    bgColorClass = 'bg-sky-100', // TODO: Take in a color class only and handle the relative weights in the component
    popperPlacement = 'left',
    showAnnotation = false,
  } = props;
  const [popperVisible, setPopperVisible] = useState(showAnnotation);
  const [highlightRef, setHighlightRef] = useState<HTMLElement | null>(null);
  const [portal, setPortal] = useState<HTMLElement | null>(null);
  const {
    activeAnnotationId,
    setAnnotationActive,
    focusedAnnotationId,
    focusAnnotation,
  } = useAnnotation();

  useEffect(() => {
    const annotationsRoot = document.getElementById(
      'annotations-root'
    ) as HTMLElement;
    const portalId = `portal-${annotationId}`;
    let el = document.getElementById(portalId);
    if (!el) {
      el = document.createElement('div');
      el.setAttribute('id', portalId);
      annotationsRoot.appendChild(el);
    }
    setPortal(el);

    return () => {
      if (portal) {
        annotationsRoot.removeChild(portal);
      }
    };
  }, [annotationId, portal, highlightRef]);

  return (
    <>
      <span
        ref={setHighlightRef}
        className={`${bgColorClass} p-px cursor-pointer
        ${popperVisible ? 'bg-sky-400' : ''}
        ${activeAnnotationId === props.annotationId ? 'bg-sky-400' : ''}
        ${focusedAnnotationId === props.annotationId ? 'bg-sky-300' : ''}
        `}
        onClick={() => {
          setPopperVisible(true);
          activeAnnotationId === props.annotationId
            ? setAnnotationActive('')
            : setAnnotationActive(props.annotationId);
        }}
        onMouseOver={() => {
          focusAnnotation(props.annotationId);
        }}
        onMouseOut={() => {
          focusAnnotation('');
        }}
      >
        {props.children}
      </span>

      {popperVisible &&
        portal &&
        createPortal(
          <AnnotationPopper
            annotationId={annotationId}
            referenceRef={highlightRef}
            placement={popperPlacement}
            setVisible={setPopperVisible}
          />,
          portal
        )}
    </>
  );
}

// From https://heroicons.dev/?query=x
function XIcon(props: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={props.className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

/**
 * Annotation
 */
function AnnotationPopper(props: {
  annotationId: string;
  referenceRef: HTMLElement | null;
  placement: Placement;
  setVisible: (val: boolean) => void;
}) {
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);
  const { getAnnotation } = useAnnotation();
  const { styles, attributes } = usePopper(props.referenceRef, popperElement, {
    placement: props.placement,
    modifiers: [
      { name: 'offset', options: { offset: [0, 10] } },
      {
        name: 'flip',
        options: {
          fallbackPlacements: ['right', 'left', 'top', 'bottom'],
        },
      },
    ],
  });

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  useEffect(() => {
    const annotation = getAnnotation(props.annotationId);
    if (annotation) {
      setTitle(annotation.title ?? '');
      setContent(annotation.content);
    }
  }, [props.annotationId, getAnnotation, content, title]);

  return (
    <>
      {content && (
        <ClickAwayListener onClickAway={() => props.setVisible(false)}>
          <div
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
            className={`annotation ${popperStyles.tooltip} max-w-xs min-w-lg bg-gray-50 p-0 block z-10 outline outline-1 outline-slate-400 border-t-4 border-sky-400 lg:hidden`}
          >
            <div className="content px-3 pb-3 block text-sm">
              <span className="inline-block">{title}</span>
              <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml={true}>
                {content}
              </ReactMarkdown>
            </div>
          </div>
        </ClickAwayListener>
      )}
    </>
  );
}

/**
 * An individual annotation that is displayed inside of an AnnotationGroup.
 */
function Annotation(props: {
  annotationId: string;
  orientation: 'left' | 'right';
}) {
  const {
    activeAnnotationId,
    focusedAnnotationId,
    getAnnotation,
    setAnnotationActive,
    focusAnnotation,
    unfocusAnnotation,
  } = useAnnotation();
  const [visible, setVisible] = useState(true);
  const [collapsed, setCollapsed] = useState(true);
  const [content, setContent] = useState('');

  useEffect(() => {
    const annotation = getAnnotation(props.annotationId);
    if (annotation) {
      setContent(annotation.content);
    }
  }, [props.annotationId, getAnnotation, content]);

  useEffect(() => {
    if (activeAnnotationId === props.annotationId) {
      setCollapsed(false);
    }
  }, [props.annotationId, activeAnnotationId]);

  const activeStyle =
    props.orientation === 'left'
      ? 'translate-x-10 -translate-y-1 shadow-lg'
      : '-translate-x-10 -translate-y-1 shadow-lg';
  const opacityStyle = [activeAnnotationId, focusedAnnotationId].includes(
    props.annotationId
  )
    ? ''
    : 'opacity-60';

  return (
    <>
      {visible && (
        <div
          className={`annotation mt-4 p-4 z-50
          bg-white border-t-4 border-sky-400 outline outline-slate-400
          transition transition-all
          text-sm cursor-pointer

          ${activeAnnotationId === props.annotationId ? activeStyle : ''}
          ${
            focusedAnnotationId === props.annotationId
              ? 'shadow-lg outline-2'
              : 'outline-1'
          }
          ${opacityStyle}
          `}
          onClick={() => setAnnotationActive(props.annotationId)}
          onMouseOver={() => focusAnnotation(props.annotationId)}
          onMouseOut={() => unfocusAnnotation('')}
        >
          <div className={`content ${collapsed ? 'collapsed' : ''}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml={true}>
              {content}
            </ReactMarkdown>
          </div>
          <div className="relative text-xs">
            {collapsed ? (
              <span
                className="inline-block mt-2 cursor-pointer text-blue-600"
                onClick={() => {
                  setCollapsed(false);
                  return false;
                }}
              >
                Show more
              </span>
            ) : (
              <span
                className="inline-block mt-2 cursor-pointer text-blue-600"
                onClick={() => {
                  setCollapsed(true);
                }}
              >
                Show less
              </span>
            )}
            <a
              id={props.annotationId}
              href={`#${encodeURIComponent(props.annotationId)}`}
              className="ml-2 font-bold absolute bottom-0 right-0"
            >
              #
            </a>
          </div>
        </div>
      )}
    </>
  );
}

// Helper function that maps page attributes to yaml file format
function _groupId(pageNumber: number, groupId: string) {
  return `page-${pageNumber}-${groupId}`;
}

/**
 * Group of annotations to be displayed together. Orientation determines direction of translations.
 */
export function AnnotationGroup(props: {
  pageNumber: number;
  groupId: string;
  orientation: 'left' | 'right';
}) {
  const { getAnnotationGroup } = useAnnotation();
  const [groupData, setGroupData] = useState<AnnotationData[]>([]);
  useEffect(() => {
    const group = getAnnotationGroup(_groupId(props.pageNumber, props.groupId));
    if (group.length > 0) {
      setGroupData(group);
    }
  }, [props.groupId, props.pageNumber, getAnnotationGroup]);

  return (
    <div className="sticky top-10">
      {groupData.map((data) => (
        <Annotation
          key={data.id}
          annotationId={data.id}
          orientation={props.orientation}
        />
      ))}
    </div>
  );
}
