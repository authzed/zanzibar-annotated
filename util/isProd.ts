// Shared across components/ExternalScripts.tsx and instrumentation-client.ts
// so the "are we in a real production deploy" check isn't defined twice.
//
// Named `isVercelProduction` (not `isProd`) to avoid confusion with the
// differently-scoped, locally-defined `isProd` constants elsewhere in this
// repo (next.config.mjs, pages/api/preview/[ranges].ts), which check
// `NODE_ENV === 'production'` instead -- a materially different condition,
// since `NODE_ENV` is `'production'` on preview deploys and local
// `next start` too, not just real production deploys.
export const isVercelProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';
