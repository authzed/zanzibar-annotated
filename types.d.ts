declare module '*.yaml' {
  const data: any;
  export default data;
}

// @svgr/webpack (configured in next.config.mjs) transforms SVG imports into
// React components. This does not depend on next-env.d.ts's `any`-typed SVG
// declaration, which is only present once Next.js tooling has generated that
// gitignored file -- not guaranteed before `tsc` runs in a fresh checkout.
declare module '*.svg' {
  import { FC, SVGProps } from 'react';
  const content: FC<SVGProps<SVGSVGElement>>;
  export default content;
}
