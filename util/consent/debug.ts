export const DEBUG_EU_COOKIE = '__consent_debug_eu';

export function getDebugCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  if (typeof process !== 'undefined') {
    const env =
      (process.env as Record<string, string | undefined>).NEXT_PUBLIC_VERCEL_ENV;
    if (env === 'production') return null;
  }
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return match ? match.split('=').slice(1).join('=') : null;
}
