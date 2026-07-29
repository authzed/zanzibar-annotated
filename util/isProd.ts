// Shared across components/ExternalScripts.tsx and instrumentation-client.ts
// so the "are we in a real production deploy" check isn't defined twice.
export const isProd = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';
