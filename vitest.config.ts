import path from 'node:path';
import { defineConfig } from 'vitest/config';
import type { Plugin as VitePlugin } from 'vitest/config';
import { readFileSync } from 'fs';
import YAML from 'yaml';

const yamlPlugin: VitePlugin = {
  name: 'yaml-loader',
  resolveId(id: string) {
    if (id.endsWith('.yaml') || id.endsWith('.yml')) {
      return id;
    }
  },
  load(id: string) {
    if (id.endsWith('.yaml') || id.endsWith('.yml')) {
      const fileContent = readFileSync(id, 'utf-8');
      const data = YAML.parse(fileContent);
      return `export default ${JSON.stringify(data)}`;
    }
  },
};

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  plugins: [yamlPlugin],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    // NOTE: `find` must anchor the *entire* specifier (`^.*`), not just the
    // suffix. Vite's alias resolution does `importee.replace(find, replacement)`
    // (see @rollup/plugin-alias) — with a suffix-only pattern like /\.svg$/,
    // only the matched suffix is replaced, mangling the id into something like
    // "../content/HNIcon" + "<replacement>" concatenated, which then fails to
    // resolve. Anchoring the match to the full string makes the replacement
    // apply to the whole id, as intended.
    alias: [
      { find: /^.*\.module\.css$/, replacement: 'identity-obj-proxy' },
      { find: /^.*\.svg$/, replacement: path.resolve(__dirname, 'test/svgStub.tsx') },
    ],
  },
});
