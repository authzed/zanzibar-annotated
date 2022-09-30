import { PropsWithChildren } from 'react';

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
