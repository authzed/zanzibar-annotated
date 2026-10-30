/** @type {import('next').NextConfig} */

import nextMDX from '@next/mdx';

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

export default withMDX({
  // Append the default value with md extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
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
