import { Placement } from '@popperjs/core';
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
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
import annotationsSpiceDb from '../content/annotations-spicedb.yaml';
import annotations from '../content/annotations.yaml';
import popperStyles from '../styles/Popper.module.css';
import { ANNOTATIONS_PORTAL_CONTAINER_ID } from './layout';

class AnnotationId {
  setId: string;
  entryId: string;

  constructor(setId: string, entryId: string) {
    this.setId = setId;
    this.entryId = entryId;
  }

  key() {
    return `${this.setId}-${this.entryId}`;
  }

  equals(setId: string | undefined, entryId: string | undefined) {
    return this.setId === setId && this.entryId === entryId;
  }

  equalsId(id: AnnotationId) {
    return this.equals(id.setId, id.entryId);
  }
}

type AnnotationData = {
  setId: string;
  entryId: string;
  title?: string;
  content: string;
};

type AnnotationSet = {
  id: string;
  title: string;
  highlightColor?: string;
  groups: Map<string, AnnotationData[]>;
  annotations: Map<string, AnnotationData>;
};

/**
 * Parse annotation set data into groups and annotations.
 */
function loadAnnotationData(data: any): AnnotationSet {
  const setId = data.id;
  const annotationMap = new Map<string, AnnotationData>();
  const annotationGroups = new Map<string, AnnotationData[]>();
  for (const [groupId, group] of Object.entries(annotations['groups'])) {
    const groupList = [];
    for (const [key, annotationData] of Object.entries(group as object)) {
      const obj = { setId, entryId: key, ...annotationData };
      annotationMap.set(key, obj);
      groupList.push(obj);
    }
    annotationGroups.set(groupId, groupList as AnnotationData[]);
  }

  return {
    id: data['id'],
    title: data['title'],
    groups: annotationGroups,
    annotations: annotationMap,
  };
}

interface AnnotationManagerInterface {
  getAnnotation(id: AnnotationId): AnnotationData | undefined;
  getAnnotationGroup(setId: string, groupId: string): AnnotationData[]; // TODO maybe just a group id?
  activeAnnotationId: AnnotationId | undefined;
  setAnnotationActive(id: AnnotationId): void;
  setAnnotationInactive(id: AnnotationId): void;
  focusedAnnotationId: AnnotationId | undefined;
  focusAnnotation(id: AnnotationId): void;
  unfocusAnnotation(): void;
  setAnnotationSetActive(setId: string): void;
  setAnnotationSetInactive(setId: string): void;
  activeAnnotationSetIds: string[];
}

const NoopAnnotationManagerProvider = {
  getAnnotation: (id: AnnotationId) => {
    return undefined;
  },
  getAnnotationGroup: (setId: string, groupId: string) => [],
  activeAnnotationId: undefined,
  setAnnotationActive: (id: AnnotationId) => {},
  setAnnotationInactive: (id: AnnotationId) => {},
  focusedAnnotationId: undefined,
  focusAnnotation: (id: AnnotationId) => {},
  unfocusAnnotation: () => {},
  setAnnotationSetActive: (setId: string) => {},
  setAnnotationSetInactive: (setId: string) => {},
  activeAnnotationSetIds: [],
};

const AnnotationManagerContext = createContext<AnnotationManagerInterface>(
  NoopAnnotationManagerProvider
);

/**
 * Provider that holds global annotation view state and annotation data.
 */
export const NoAnnotationManagerProvider: React.FC<PropsWithChildren> = (
  props: PropsWithChildren
) => {
  return (
    <AnnotationManagerContext.Provider value={NoopAnnotationManagerProvider}>
      {props.children}
    </AnnotationManagerContext.Provider>
  );
};

/**
 * Provider that holds global annotation view state and annotation data.
 */
export const AnnotationManagerProvider: React.FC<PropsWithChildren> = (
  props: PropsWithChildren
) => {
  const [activeAnnotationId, setActiveAnnotationId] = useState<
    AnnotationId | undefined
  >(undefined);
  const [focusedAnnotationId, setFocusedAnnotationId] = useState<
    AnnotationId | undefined
  >(undefined);
  const [activeAnnotationSets, setActiveAnnotationSets] = useState<string[]>([
    'general',
  ]);

  // Note: This is populated from an imported object so it should not be modified.
  const annotationSets = useMemo(() => {
    const map = new Map<string, AnnotationSet>();
    const general = loadAnnotationData(annotations);
    const spicedb = loadAnnotationData(annotationsSpiceDb);
    map.set(general.id, general);
    map.set(spicedb.id, spicedb);
    return map;
  }, []);

  const getAnnotationGroup = (
    setId: string,
    groupId: string
  ): AnnotationData[] => {
    return annotationSets.get(setId)?.groups.get(groupId) ?? [];
  };

  const getAnnotation = useCallback(
    (id: AnnotationId) => {
      return annotationSets.get(id.setId)?.annotations.get(id.entryId);
    },
    [annotationSets]
  );

  const setAnnotationSetActive = (setId: string) => {
    const updated = activeAnnotationSets.concat(setId);
    setActiveAnnotationSets(updated);
  };

  const setAnnotationSetInactive = (setId: string) => {
    const updated = activeAnnotationSets.filter((id) => id !== setId);
    setActiveAnnotationSets(updated);
  };

  return (
    <AnnotationManagerContext.Provider
      value={{
        getAnnotation,
        getAnnotationGroup,
        activeAnnotationId,
        setAnnotationActive: (id: AnnotationId) => {
          console.log('active', id);
          setActiveAnnotationId(id);
        },
        setAnnotationInactive: (id: AnnotationId) => {
          console.log('inactive', id);
          if (activeAnnotationId?.equalsId(id)) {
            setActiveAnnotationId(undefined);
          }
        },
        focusedAnnotationId,
        focusAnnotation: (id: AnnotationId) => setFocusedAnnotationId(id),
        unfocusAnnotation: () => setFocusedAnnotationId(undefined),
        setAnnotationSetActive,
        setAnnotationSetInactive,
        activeAnnotationSetIds: activeAnnotationSets,
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
    setAnnotationSetActive,
    setAnnotationSetInactive,
    activeAnnotationSetIds,
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
    setAnnotationSetActive,
    setAnnotationSetInactive,
    activeAnnotationSetIds,
  };
}

type HighlightProps = {
  setId: string;
  entryId: string;
  bgColorClass?: string;
  popperPlacement?: Placement;
  showAnnotation?: boolean;
};

/**
 * Component that visually highlights child components and provides annotation content based on the annotation id.
 */
export function Highlight(props: PropsWithChildren<HighlightProps>) {
  const {
    setId,
    entryId,
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
    setAnnotationInactive,
    focusedAnnotationId,
    focusAnnotation,
    unfocusAnnotation,
  } = useAnnotation();
  const annotationId = useMemo(() => {
    return new AnnotationId(setId, entryId);
  }, [setId, entryId]);

  useEffect(() => {
    const annotationsRoot = document.getElementById(
      ANNOTATIONS_PORTAL_CONTAINER_ID
    ) as HTMLElement;
    if (annotationsRoot === null) {
      return;
    }

    const portalId = `portal-${setId}-${entryId}`;
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
  }, [setId, entryId, portal, highlightRef]);

  return (
    <>
      <span
        ref={setHighlightRef}
        className={`${bgColorClass} p-px cursor-pointer
        ${popperVisible ? 'bg-sky-400' : ''}
        ${activeAnnotationId?.equals(setId, entryId) ? 'bg-sky-400' : ''}
        ${focusedAnnotationId?.equals(setId, entryId) ? 'bg-sky-300' : ''}
        `}
        onClick={() => {
          console.log(activeAnnotationId, setId, entryId);
          setPopperVisible(true);
          activeAnnotationId?.equals(setId, entryId)
            ? setAnnotationInactive(annotationId)
            : setAnnotationActive(annotationId);
        }}
        onMouseOver={() => {
          focusAnnotation(annotationId);
        }}
        onMouseOut={() => {
          unfocusAnnotation();
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
  annotationId: AnnotationId;
  referenceRef: HTMLElement | null;
  placement: Placement;
  setVisible: (val: boolean) => void;
}) {
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);
  const { getAnnotation, setAnnotationInactive } = useAnnotation();
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
  }, [props.annotationId, getAnnotation, setTitle, setContent]);

  return (
    <>
      {content && (
        <ClickAwayListener
          onClickAway={() => {
            setAnnotationInactive(props.annotationId);
            props.setVisible(false);
          }}
        >
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
  annotationId: AnnotationId;
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

  // useEffect(() => {
  //   if (activeAnnotationId?.equalsId(props.annotationId) && collapsed) {
  //     setCollapsed(false);
  //   }
  // }, [props.annotationId, activeAnnotationId, collapsed]);

  const activeStyle =
    props.orientation === 'left'
      ? 'translate-x-10 -translate-y-1 shadow-lg'
      : '-translate-x-10 -translate-y-1 shadow-lg';
  const opacityStyle =
    activeAnnotationId?.equalsId(props.annotationId) ||
    focusedAnnotationId?.equalsId(props.annotationId)
      ? ''
      : 'opacity-60';
  const cursorStyle =
    focusedAnnotationId?.equalsId(props.annotationId) &&
    !activeAnnotationId?.equalsId(props.annotationId)
      ? 'cursor-pointer'
      : 'cursor-auto';

  return (
    <>
      {visible && (
        <div
          className={`annotation mt-4 p-4 z-50
          bg-white border-t-4 border-sky-400 outline outline-slate-400
          transition transition-all
          text-sm
          ${activeAnnotationId?.equalsId(props.annotationId) ? activeStyle : ''}
          ${
            focusedAnnotationId?.equalsId(props.annotationId)
              ? 'shadow-lg outline-2'
              : 'outline-1'
          }
          ${cursorStyle}
          ${opacityStyle}
          `}
          onClick={() => {
            setAnnotationActive(props.annotationId);
            setCollapsed(false);
          }}
          onMouseOver={() => focusAnnotation(props.annotationId)}
          onMouseOut={() => unfocusAnnotation()}
        >
          <a id={`annotation-${props.annotationId.key()}`} />
          <div className={`content ${collapsed ? 'collapsed' : ''}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml={true}>
              {content}
            </ReactMarkdown>
          </div>
          <div className="relative text-xs">
            {collapsed ? (
              <span
                className="inline-block mt-2 cursor-pointer text-blue-600"
                onClick={(e) => {
                  setCollapsed(false);
                  return false;
                }}
              >
                Show more
              </span>
            ) : (
              <span
                className="inline-block mt-2 cursor-pointer text-blue-600"
                onClick={(e) => {
                  setCollapsed(true);
                  e.stopPropagation();
                  return false;
                }}
              >
                Show less
              </span>
            )}
            <a
              href={`#annotation-${encodeURIComponent(
                props.annotationId.key()
              )}`}
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
  const { getAnnotationGroup, activeAnnotationSetIds } = useAnnotation();
  const [groupData, setGroupData] = useState<AnnotationData[]>([]);
  useEffect(() => {
    const annotations: AnnotationData[] = [];
    const groupId = _groupId(props.pageNumber, props.groupId);
    activeAnnotationSetIds.forEach((setId) => {
      const group = getAnnotationGroup(setId, groupId);
      annotations.push(...group);
    });

    setGroupData(annotations);
  }, [
    props.groupId,
    props.pageNumber,
    getAnnotationGroup,
    activeAnnotationSetIds,
  ]);

  return (
    <div className="sticky top-10">
      {groupData.map((data) => {
        const annotationId = new AnnotationId(data.setId, data.entryId);
        return (
          <Annotation
            key={data.entryId}
            annotationId={annotationId}
            orientation={props.orientation}
          />
        );
      })}
    </div>
  );
}
