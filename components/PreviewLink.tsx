import { Placement } from '@popperjs/core';
import { PropsWithChildren, ReactNode, useState } from 'react';
import { usePopper } from 'react-popper';
import popperStyles from '../styles/Popper.module.css';

type PreviewLinkProps = {
  previewComponent: ReactNode;
  placement?: Placement;
};

export default function PreviewLink(
  props: PropsWithChildren<PreviewLinkProps>
) {
  const [showPreview, setShowPreview] = useState(false);
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(
    null
  );
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: props.placement || 'top',
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

  return (
    <>
      <span
        ref={setReferenceElement}
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
      >
        {props.children}
      </span>

      {showPreview && (
        <div
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
          className={`previewlink ${popperStyles.tooltip} bg-gray-50 p-4 rounded z-10`}
        >
          {props.previewComponent}
        </div>
      )}
    </>
  );
}
