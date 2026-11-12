/** @type {import('next').NextConfig} */

import nextMDX from '@next/mdx';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

const isProd = process.env.NODE_ENV === 'production'

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    // Plugins are referenced by package name so they can be passed to Turbopack.
    remarkPlugins: ['remark-gfm', 'remark-math'],
    rehypePlugins: ['rehype-katex'],
    // If you use `MDXProvider`, uncomment the following line.
    providerImportSource: '@mdx-js/react',
  },
});

// The configuration depends on whether it's for `next dev`.
const config = (phase) => withMDX({
  // Append the default value with md extensions
  // Files ending in .dev.mts are routes only under `next dev`: no other
  // extension here matches them, so a build leaves them out, whatever
  // NODE_ENV it's made with. The paper's edit mode, which writes to the files
  // under content/, relies on it.
  pageExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'md',
    'mdx',
    ...(phase === PHASE_DEVELOPMENT_SERVER ? ['dev.mts'] : []),
  ],
  reactStrictMode: true,
  // Don't generate AGENTS.md when `next dev` detects a coding agent.
  agentRules: false,
  // Serve assets from the deployment's own URL on Vercel, since the site is
  // also served under authzed.com/zanzibar.
  assetPrefix:
    isProd && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined,
  // The preview API reads its font, and the default preview image it falls
  // back to, from disk.
  outputFileTracingIncludes: {
    '/api/preview/[ranges]': [
      './public/LinLibertine_R.ttf',
      './public/preview.png',
    ],
    // The markdown edition is converted from the paper's source.
    '/api/markdown': ['./content/zanzibar.mdx'],
  },
  // The markdown edition of the paper and llms.txt are generated, but served
  // at the paths of files.
  async rewrites() {
    return [
      { source: '/paper.md', destination: '/api/markdown' },
      { source: '/llms.txt', destination: '/api/llms' },
    ];
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
      '*.{yaml,yml}': {
        loaders: ['js-yaml-loader'],
        as: '*.js',
      },
    },
  },
});

export default config;
