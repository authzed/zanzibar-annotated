import { PropsWithChildren } from 'react';

/**
 * Page footer content.
 */
export default function PageFooter(
  props: PropsWithChildren<{ numberLabel: string }>
) {
  return (
    <>
      <div className="page-footer col-span-2 pt-10 relative">
        <div className="absolute right-0">{props.numberLabel}</div>
      </div>
    </>
  );
}
