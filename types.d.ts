declare module '*.yaml' {
  const data: any;
  export default data;
}

declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
  export default content;
}
