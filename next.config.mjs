/** @type {import('next').NextConfig} */

import nextMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import withYaml from 'next-plugin-yaml';

const isProd = process.env.NODE_ENV === 'production'

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [rehypeKatex],
    // If you use `MDXProvider`, uncomment the following line.
    providerImportSource: '@mdx-js/react',
  },
});

export default withYaml(
  withMDX({
    // Append the default value with md extensions
    pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
    reactStrictMode: true,
    assetPrefix: isProd ? `https://${process.env.VERCEL_URL}` : undefined,
    webpack(config) {
      config.module.rules.push({
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      });

      return config;
    },
    publicRuntimeConfig: {
      GAMeasurementId: 'G-SPCEM7FV1Z',
      CanonicalUrlBase: 'https://authzed.com/zanzibar',
    },
  })
);
