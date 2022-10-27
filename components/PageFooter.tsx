import { PropsWithChildren } from 'react';
import { useRenderState } from './renderstate';

/**
 * Page footer content.
 */
export default function PageFooter(
  props: PropsWithChildren<{ numberLabel: string }>
) {
  const renderState = useRenderState();
  if (renderState.isForSocialCardRendering) {
    return <></>;
  }

  return (
    <>
      <div className="page-footer col-span-2 pt-10 relative">
        <div className="absolute right-0">{props.numberLabel}</div>
      </div>
    </>
  );
}
