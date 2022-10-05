import { Placement } from '@popperjs/core';
import { createContext, PropsWithChildren, useContext, useState } from 'react';
import ClickAwayListener from 'react-click-away-listener';
import { usePopper } from 'react-popper';
import popperStyles from '../styles/Popper.module.css';

const dummyData: { [index: string]: AnnotationData } = {
  example1: {
    title: 'Hello World',
    content:
      '<strong>Lorem</strong> ipsum dolor sit amet, consectetur adipiscing elit. Donec at elit fringilla, luctus felis id, elementum quam. Aliquam viverra ligula id ultricies commodo. Mauris ut.',
  },
  example2: {
    title: 'Hello Again',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. <a href="#">Donec at elit fringilla</a>, luctus felis id, elementum quam. Aliquam viverra ligula id ultricies commodo. Mauris ut.',
  },
};

type AnnotationData = {
  title: string;
  content: string;
};

export interface AnnotationsContextType {
  getAnnotation(id: string): AnnotationData;
}

const AnnotationsContext = createContext<AnnotationsContextType>(
  {} as AnnotationsContextType
);

export const AnnotationsProvider: React.FC = (props: PropsWithChildren) => {
  // TODO: Actually implement annotation data source
  function getAnnotation(id: string): AnnotationData {
    return dummyData[id];
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

  const { title, content } = getAnnotation(props.annotationId);

  return (
    <ClickAwayListener onClickAway={() => props.setVisible(false)}>
      <span
        ref={setPopperElement}
        style={styles.popper}
        {...attributes.popper}
        className={`annotation ${popperStyles.tooltip} max-w-xs min-w-lg bg-gray-50 p-0 rounded block`}
      >
        <span className="bg-gray-600 text-white p-3 rounded-t block">
          {title}
        </span>
        <span className="px-3 pb-3 mt-2 block">
          <span dangerouslySetInnerHTML={{ __html: content }} />
        </span>
      </span>
    </ClickAwayListener>
  );
}
