import { PropsWithChildren } from 'react';
import slugify from 'slugify';

/**
 * Markdown component for p
 */
export function Paragraph(props: PropsWithChildren) {
  return <p className="text-justify leading-tight">{props.children}</p>;
}

/**
 * Markdown component for ul
 */
export function UnorderedList(props: PropsWithChildren) {
  return <ol className="my-2">{props.children}</ol>;
}

/**
 * Markdown component for li
 */
export function ListItem(props: PropsWithChildren) {
  return <li className="ml-8 list-disc leading-tight">{props.children}</li>;
}

/**
 * Markdown component for h2
 */
export function H2(props: PropsWithChildren) {
  return (
    <>
      <a id={slugify(props.children as string, { lower: true })} />
      <h2>{props.children}</h2>
    </>
  );
}

/**
 * Markdown component for h3
 */
export function H3(props: PropsWithChildren) {
  return (
    <>
      <a id={slugify(props.children as string, { lower: true })} />
      <h3>{props.children}</h3>
    </>
  );
}
