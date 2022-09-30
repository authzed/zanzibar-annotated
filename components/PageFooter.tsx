import { PropsWithChildren } from 'react';

/**
 * Page footer content.
 */
export default function PageFooter(
  props: PropsWithChildren<{ numberLabel: string }>
) {
  return (
    <>
      <div className="page-footer width-screen relative">
        <div className="absolute right-10">{props.numberLabel}</div>
      </div>
      <hr className="my-10" />
    </>
  );
}
