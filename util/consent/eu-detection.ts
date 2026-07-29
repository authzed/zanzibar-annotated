import { DEBUG_EU_COOKIE, getDebugCookie } from './debug';

// IANA timezone identifiers used for the timezone-based EU heuristic. This is
// a different list from components/ExternalScripts.tsx's EU_REGION_CODES
// (ISO-3166 country codes for Google Consent Mode's `region` field) and
// can't be merged with it, but if EU/EEA membership ever changes, check that
// list too.
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

export function isEUVisitor(): boolean {
  if (typeof window === 'undefined') return true;

  const debugOverride = getDebugCookie(DEBUG_EU_COOKIE);
  if (debugOverride !== null) {
    return debugOverride === 'true';
  }

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return EU_TIMEZONES.has(tz);
  } catch {
    return true;
  }
}
