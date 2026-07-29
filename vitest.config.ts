import path from 'node:path';
import { defineConfig } from 'vitest/config';
import type { Plugin as VitePlugin } from 'vitest/config';
import { readFileSync } from 'fs';
import YAML from 'yaml';

const cssModulePlugin: VitePlugin = {
  name: 'css-modules-mock',
  resolveId(id: string) {
    if (id.endsWith('.css') || id.endsWith('.module.css')) {
      return { id: 'identity-obj-proxy', moduleSideEffects: false };
    }
  },
};

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

const svgPlugin: VitePlugin = {
  name: 'svg-loader',
  apply: 'serve',
  resolveId(id: string) {
    if (id.endsWith('.svg')) {
      return { id: 'virtual:svg-stub', moduleSideEffects: false };
    }
  },
  load(id: string) {
    if (id === 'virtual:svg-stub') {
      return 'export default () => null';
    }
  },
};

export default defineConfig({
  plugins: [cssModulePlugin, yamlPlugin, svgPlugin],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: [
      { find: /\.svg$/, replacement: 'virtual:svg-stub' },
    ],
  },
});
