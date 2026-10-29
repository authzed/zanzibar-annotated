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
  assetPrefix: isProd ? `https://${process.env.VERCEL_URL}` : undefined,
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
