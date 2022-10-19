import { Placement } from '@popperjs/core';
import { PropsWithChildren, ReactNode, useState } from 'react';
import { usePopper } from 'react-popper';
import popperStyles from '../styles/Popper.module.css';

type PreviewLinkProps = {
  previewComponent: ReactNode;
  placement?: Placement;
};

const PREVIEW_TOOLTIP_OFFSET: [number, number] = [0, 10];

/**
 * Display the preview component as a tooltip when wrapped components are moused over.
 * @param props previewComponent The component to show as a preview.
 */
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
      { name: 'offset', options: { offset: PREVIEW_TOOLTIP_OFFSET } },
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
