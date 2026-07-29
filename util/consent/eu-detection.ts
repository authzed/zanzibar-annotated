import { DEBUG_EU_COOKIE, getDebugCookie } from './debug';

const EU_TIMEZONES = new Set([
  'Europe/Vienna', 'Europe/Brussels', 'Europe/Sofia', 'Europe/Zagreb',
  'Asia/Famagusta', 'Asia/Nicosia', 'Europe/Prague', 'Europe/Copenhagen',
  'Europe/Tallinn', 'Europe/Helsinki', 'Europe/Paris', 'Europe/Berlin',
  'Europe/Busingen', 'Europe/Athens', 'Europe/Budapest', 'Europe/Dublin',
  'Europe/Rome', 'Europe/Riga', 'Europe/Vilnius', 'Europe/Luxembourg',
  'Europe/Malta', 'Europe/Amsterdam', 'Europe/Warsaw', 'Europe/Lisbon',
  'Atlantic/Azores', 'Atlantic/Madeira', 'Europe/Bucharest', 'Europe/Bratislava',
  'Europe/Ljubljana', 'Europe/Madrid', 'Africa/Ceuta', 'Atlantic/Canary',
  'Europe/Stockholm', 'Europe/Oslo', 'Arctic/Longyearbyen', 'Atlantic/Reykjavik',
  'Europe/Vaduz', 'Europe/London', 'Europe/Belfast', 'Europe/Guernsey',
  'Europe/Isle_of_Man', 'Europe/Jersey',
]);

let cached: boolean | undefined;

export function isEUVisitor(): boolean {
  if (typeof window === 'undefined') return true;
  if (cached !== undefined) return cached;

  const debugOverride = getDebugCookie(DEBUG_EU_COOKIE);
  if (debugOverride !== null) {
    cached = debugOverride === 'true';
    return cached;
  }

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    cached = EU_TIMEZONES.has(tz);
  } catch {
    cached = true;
  }
  return cached;
}
