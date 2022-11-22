import { defineConfig } from 'cypress';

export default defineConfig({
  retries: 1,
  defaultCommandTimeout: 20000,
  requestTimeout: 20000,
  env: {
    PREVIEW_ENDPOINT: 'http://localhost:3000',
  },
  e2e: {
    baseUrl: 'http://localhost:3000',
  },
});
