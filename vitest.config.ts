import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: [
      { find: /\.module\.css$/, replacement: 'identity-obj-proxy' },
      { find: /\.svg$/, replacement: path.resolve(__dirname, 'test/svgStub.tsx') },
    ],
  },
});
