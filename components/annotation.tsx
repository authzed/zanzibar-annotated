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
import annotationsIntro from '../content/annotations-intro.yaml';
import annotationsSpiceDb from '../content/annotations-spicedb.yaml';
import popperStyles from '../styles/Popper.module.css';
import { gtag } from './GTag';
import { ANNOTATIONS_PORTAL_CONTAINER_ID } from './layout';
import { Paragraph } from './markdown';
import { ShareButton } from './SelectionShare';

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
  subtitle: string;
  description: string;
  cta: string;
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
  for (const [groupId, group] of Object.entries(data['groups'])) {
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
    subtitle: data['subtitle'],
    description: data['description'],
    cta: data['cta'],
    highlightColor: data['highlightColor'] ?? 'sky',
    groups: annotationGroups,
    annotations: annotationMap,
  };
}

interface AnnotationManagerInterface {
  getAnnotation(id: AnnotationId): AnnotationData | undefined;
  getAnnotationGroup(setId: string, groupId: string): AnnotationData[];
  getAnnotationSet(setId: string): AnnotationSet | undefined;
  activeAnnotationId: AnnotationId | undefined;
  setAnnotationActive(id: AnnotationId): void;
  setAnnotationInactive(id: AnnotationId): void;
  focusedAnnotationId: AnnotationId | undefined;
  focusAnnotation(id: AnnotationId): void;
  unfocusAnnotation(): void;
  setAnnotationSetActive(setId: string): void;
  setAnnotationSetInactive(setId: string): void;
  toggleAnnotationSet(setId: string): void;
  activeAnnotationSetIds: string[];
  allAnnotationSetIds: string[];
}

const NoopAnnotationManagerProvider = {
  getAnnotation: (id: AnnotationId) => {
    return undefined;
  },
  getAnnotationGroup: (setId: string, groupId: string) => [],
  getAnnotationSet: (setId: string) => undefined,
  activeAnnotationId: undefined,
  setAnnotationActive: (id: AnnotationId) => {},
  setAnnotationInactive: (id: AnnotationId) => {},
  focusedAnnotationId: undefined,
  focusAnnotation: (id: AnnotationId) => {},
  unfocusAnnotation: () => {},
  setAnnotationSetActive: (setId: string) => {},
  setAnnotationSetInactive: (setId: string) => {},
  toggleAnnotationSet: (setId: string) => {},
  activeAnnotationSetIds: [],
  allAnnotationSetIds: [],
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

const _availableAnnotationSets = [annotationsIntro, annotationsSpiceDb].map(
  (set) => {
    return {
      value: set.id,
      label: set.label,
      color: set.highlightColor,
    };
  }
);

export function getAvailableAnnotationSets() {
  return _availableAnnotationSets;
}

const allAnnotationSetIds = getAvailableAnnotationSets().map(
  (item) => item.value
);

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

  // Annotation sets are defined using imported objects.
  // TODO: Load and manage sets dynamically.
  const [activeAnnotationSets, setActiveAnnotationSets] = useState<string[]>(
    []
  );

  // Note: This is populated from an imported object so it should not be modified.
  const annotationSets = useMemo(() => {
    const map = new Map<string, AnnotationSet>();
    const intro = loadAnnotationData(annotationsIntro);
    const spicedb = loadAnnotationData(annotationsSpiceDb);
    map.set(intro.id, intro);
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

  const setAnnotationSetActive = useCallback((setId: string) => {
    const updated = activeAnnotationSets.concat(setId);
    setActiveAnnotationSets(updated);
  }, []);

  const setAnnotationSetInactive = (setId: string) => {
    const updated = activeAnnotationSets.filter((id) => id !== setId);
    setActiveAnnotationSets(updated);
  };

  const setAnnotationActive = useCallback((id: AnnotationId) => {
    setActiveAnnotationId(id);

    gtag('event', 'annotation_active', {
      set_id: id.setId,
      entry_id: id.entryId,
    });
  }, []);

  // Parse URL fragment on page load to set default set and annotation entry
  // Format: #annotations/<set-id>/<entry-id>
  useEffect(() => {
    if (window.location.hash && window.location.hash.includes('/')) {
      const parts = window.location.hash.split('/');
      const [prefix, setId, entryId] = parts;
      if (prefix !== '#annotations') return;
      console.log(prefix, setId, entryId);

      if (setId) setAnnotationSetActive(setId);
      if (entryId) setAnnotationActive(new AnnotationId(setId, entryId));

      return;
    }

    // Default annotation set
    setAnnotationSetActive('intro');
  }, [setAnnotationSetActive, setAnnotationActive]);

  return (
    <AnnotationManagerContext.Provider
      value={{
        getAnnotation,
        getAnnotationGroup,
        getAnnotationSet: (setId: string) => annotationSets.get(setId),
        activeAnnotationId,
        setAnnotationActive,
        setAnnotationInactive: (id: AnnotationId) => {
          if (activeAnnotationId?.equalsId(id)) {
            setActiveAnnotationId(undefined);
          }
        },
        focusedAnnotationId,
        focusAnnotation: (id: AnnotationId) => setFocusedAnnotationId(id),
        unfocusAnnotation: () => setFocusedAnnotationId(undefined),
        setAnnotationSetActive,
        setAnnotationSetInactive,
        toggleAnnotationSet: (setId: string) => {
          activeAnnotationSets.includes(setId)
            ? setAnnotationSetInactive(setId)
            : setAnnotationSetActive(setId);
        },
        activeAnnotationSetIds: activeAnnotationSets,
        allAnnotationSetIds,
      }}
    >
      {props.children}
    </AnnotationManagerContext.Provider>
  );
};

/**
 * Hook for using annotation data and state.
 */
export function useAnnotation() {
  const {
    getAnnotation,
    getAnnotationGroup,
    getAnnotationSet,
    activeAnnotationId,
    setAnnotationActive,
    setAnnotationInactive,
    focusedAnnotationId,
    focusAnnotation,
    unfocusAnnotation,
    setAnnotationSetActive,
    setAnnotationSetInactive,
    toggleAnnotationSet,
    activeAnnotationSetIds,
    allAnnotationSetIds,
  } = useContext(AnnotationManagerContext);
  return {
    getAnnotation,
    getAnnotationGroup,
    getAnnotationSet,
    activeAnnotationId,
    setAnnotationActive,
    setAnnotationInactive,
    focusedAnnotationId,
    focusAnnotation,
    unfocusAnnotation,
    setAnnotationSetActive,
    setAnnotationSetInactive,
    toggleAnnotationSet,
    activeAnnotationSetIds,
    allAnnotationSetIds,
  };
}

type HighlightProps = {
  setId: string;
  entryId: string;
  bgColorClass?: string;
  popperPlacement?: Placement;
  showAnnotation?: boolean;
  type?: 'inline' | 'paragraph';
};

/**
 * Component that visually highlights child components and provides annotation content based on the annotation id.
 */
export function Highlight(props: PropsWithChildren<HighlightProps>) {
  const {
    setId,
    entryId,
    popperPlacement = 'left',
    showAnnotation = false,
    type = 'inline',
  } = props;
  const [popperVisible, setPopperVisible] = useState(showAnnotation);
  const [highlightRef, setHighlightRef] = useState<HTMLElement | null>(null);
  const [portal, setPortal] = useState<HTMLElement | null>(null);
  const {
    activeAnnotationId,
    getAnnotationSet,
    setAnnotationActive,
    setAnnotationInactive,
    focusedAnnotationId,
    focusAnnotation,
    unfocusAnnotation,
    activeAnnotationSetIds,
  } = useAnnotation();
  const HighlightType = type === 'paragraph' ? Paragraph : React.Fragment;
  const annotationId = useMemo(() => {
    return new AnnotationId(setId, entryId);
  }, [setId, entryId]);
  const bgColorClass = useMemo(() => {
    if (activeAnnotationSetIds.includes(setId)) {
      const set = getAnnotationSet(setId);
      return set?.highlightColor ?? 'sky';
    }

    return 'clear';
  }, [getAnnotationSet, setId, activeAnnotationSetIds]);

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
      if (portal && annotationsRoot.contains(portal)) {
        annotationsRoot.removeChild(portal);
      }
    };
  }, [setId, entryId, portal, highlightRef]);

  return (
    <>
      <HighlightType>
        <span
          ref={setHighlightRef}
          className={`bg-${bgColorClass}-100 p-px cursor-pointer
        ${popperVisible ? `bg-${bgColorClass}-400` : ''}
        ${
          activeAnnotationId?.equals(setId, entryId)
            ? `bg-${bgColorClass}-400`
            : ''
        }
        ${
          focusedAnnotationId?.equals(setId, entryId)
            ? `bg-${bgColorClass}-300`
            : ''
        }
        `}
          onClick={() => {
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
      </HighlightType>

      {popperVisible &&
        portal &&
        createPortal(
          <AnnotationPopper
            annotationId={annotationId}
            referenceRef={highlightRef}
            placement={popperPlacement}
            setVisible={setPopperVisible}
            colorClass={bgColorClass}
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
  colorClass: string;
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
            className={`annotation ${popperStyles.tooltip} max-w-xs min-w-lg bg-gray-50 p-0 block z-10 outline outline-1 outline-slate-400 border-t-4 border-${props.colorClass}-400 lg:hidden`}
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
    getAnnotationSet,
    activeAnnotationId,
    focusedAnnotationId,
    getAnnotation,
    setAnnotationActive,
    focusAnnotation,
    unfocusAnnotation,
    activeAnnotationSetIds,
  } = useAnnotation();
  const [visible, setVisible] = useState(true);
  const [collapsed, setCollapsed] = useState(true);
  const [content, setContent] = useState('');
  const [shareUrl, setShareUrl] = useState('');

  const bgColorClass = useMemo(() => {
    const setId = props.annotationId.setId;
    if (activeAnnotationSetIds.includes(setId)) {
      const set = getAnnotationSet(setId);
      return set?.highlightColor ?? 'sky';
    }

    return 'clear';
  }, [getAnnotationSet, props.annotationId, activeAnnotationSetIds]);

  useEffect(() => {
    const annotation = getAnnotation(props.annotationId);
    if (annotation) {
      setContent(annotation.content);
    }
  }, [props.annotationId, getAnnotation, content]);

  useEffect(() => {
    const urlFragment = `#annotations/${encodeURIComponent(
      props.annotationId.setId
    )}/${encodeURIComponent(props.annotationId.entryId)}`;
    // Handle existing URL fragments present
    const origin = new URL(document.URL).origin;
    const url = new URL(`${origin}${urlFragment}`);
    setShareUrl(url.toString());
  }, [props.annotationId]);

  useEffect(() => {
    // Auto expand/collapse
    setCollapsed(!activeAnnotationId?.equalsId(props.annotationId));
  }, [props.annotationId, activeAnnotationId]);

  const activeStyle =
    props.orientation === 'left'
      ? 'lg:translate-x-72 2xl:translate-x-16 -translate-y-1 shadow-lg'
      : 'lg:-translate-x-72 2xl:-translate-x-16 -translate-y-1 shadow-lg';
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
          bg-white border-t-4 border-${bgColorClass}-400 outline outline-slate-400
          transition transition-transform ease-in-out duration-[250ms]
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
          <div className="relative text-xs mt-4">
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
            <span className="ml-2 absolute bottom-0 right-0">
              <ShareButton
                type="link"
                shareUrl={shareUrl}
                title="Copy share URL to clipboard"
                className="text-sm p-1 pb-0"
                iconClassName="w-4 hover:fill-black fill-gray-300"
                callback={() => (window.location.href = shareUrl)}
              />
              <ShareButton
                title="Tweet this annotation"
                type="twitter"
                shareUrl={shareUrl}
                className="text-sm p-1 pb-0"
                iconClassName="w-4 hover:fill-black fill-gray-300"
              />
              <ShareButton
                type="hn"
                title="Post annotation to Hacker News"
                shareUrl={shareUrl}
                className="text-sm p-1 pb-0"
                iconClassName="w-4 hover:fill-black fill-gray-300"
              />
              <ShareButton
                type="reddit"
                title="Submit on Reddit"
                shareUrl={shareUrl}
                className="text-sm p-1 pb-0"
                iconClassName="w-4 hover:fill-black fill-gray-300"
              />
            </span>
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
    <div className="sticky top-10 annotation">
      {groupData.map((data) => {
        const annotationId = new AnnotationId(data.setId, data.entryId);
        return (
          <Annotation
            key={annotationId.key()}
            annotationId={annotationId}
            orientation={props.orientation}
          />
        );
      })}
    </div>
  );
}
