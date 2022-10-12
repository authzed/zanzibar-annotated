import { Placement } from '@popperjs/core';
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';
import ClickAwayListener from 'react-click-away-listener';
import ReactMarkdown from 'react-markdown';
import { usePopper } from 'react-popper';
import remarkGfm from 'remark-gfm';
import annotations from '../content/annotations.yaml';
import popperStyles from '../styles/Popper.module.css';

type AnnotationData = {
  title: string;
  content: string;
};

/**
 * Annotation provider context
 */
export interface AnnotationsContextType {
  getAnnotation(id: string): AnnotationData;
}

const NoopAnnotationsProvider = {
  getAnnotation: (id: string) => {
    return {
      title: '',
      content: '',
    };
  },
};

const AnnotationsContext = createContext<AnnotationsContextType>(
  NoopAnnotationsProvider
);

/**
 * Yaml file backed annotation provider
 */
export const AnnotationsProvider: React.FC = (props: PropsWithChildren) => {
  function getAnnotation(id: string): AnnotationData {
    return annotations[id];
  }

  return (
    <AnnotationsContext.Provider value={{ getAnnotation }}>
      {props.children}
    </AnnotationsContext.Provider>
  );
};

type HighlightProps = {
  annotationId: string;
  bgColorClass?: string;
  annotationPlacement?: Placement;
  showAnnotation?: boolean;
};

/**
 * Component that visually highlights child components and provides annotation content based on the annotation id.
 */
export function Highlight(props: PropsWithChildren<HighlightProps>) {
  const {
    annotationId,
    bgColorClass = 'bg-lime-200',
    annotationPlacement = 'left',
    showAnnotation = false,
  } = props;
  const [annotationVisible, setAnnotationVisible] = useState(showAnnotation);
  const [highlightRef, setHighlightRef] = useState<HTMLElement | null>(null);

  return (
    <>
      <span
        ref={setHighlightRef}
        className={`${bgColorClass} p-px rounded cursor-pointer ${
          annotationVisible ? 'border border-gray-400' : ''
        }`}
        onClick={() => setAnnotationVisible(true)}
      >
        {props.children}
      </span>

      {annotationVisible && (
        <Annotation
          annotationId={annotationId}
          referenceRef={highlightRef}
          placement={annotationPlacement}
          setVisible={setAnnotationVisible}
        />
      )}
    </>
  );
}

function Annotation(props: {
  annotationId: string;
  referenceRef: HTMLElement | null;
  placement: Placement;
  setVisible: (val: boolean) => void;
}) {
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);
  const { getAnnotation } = useContext(AnnotationsContext);
  const { styles, attributes } = usePopper(props.referenceRef, popperElement, {
    placement: props.placement,
    modifiers: [
      { name: 'offset', options: { offset: [0, 10] } },
      {
        name: 'flip',
        options: {
          fallbackPlacements: ['top', 'bottom', 'right', 'left'],
        },
      },
    ],
  });

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  useEffect(() => {
    const { title, content } = getAnnotation(props.annotationId);
    setTitle(title);
    setContent(content);
  }, [props.annotationId, getAnnotation]);

  return (
    <>
      {title && content && (
        <ClickAwayListener onClickAway={() => props.setVisible(false)}>
          <div
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
            className={`annotation ${popperStyles.tooltip} max-w-xs min-w-lg bg-gray-50 p-0 rounded block z-10`}
          >
            <div className="title bg-gray-600 text-white indent-0 p-3 rounded-t block">
              {title}
            </div>
            <div className="content px-3 pb-3 mt-2 block">
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
