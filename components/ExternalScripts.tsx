import Script from 'next/script';
import { useEffect, useState } from 'react';
import { isEUVisitor, readConsentCookie, shouldOptOutCapturing } from '../util/consent';
import { isProd } from '../util/isProd';

declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const HUBSPOT_ID = process.env.NEXT_PUBLIC_HUBSPOT_ID;

// ISO-3166 country codes for Google Consent Mode's `region` field. This is a
// different list from util/consent/eu-detection.ts's EU_TIMEZONES (IANA
// timezone identifiers) and can't be merged with it, but if EU/EEA
// membership ever changes, check that list too.
const EU_REGION_CODES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU',
  'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES',
  'SE', 'IS', 'LI', 'NO', 'GB',
];

function ConsentModeDefaults() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            analytics_storage: 'granted',
            ad_storage: 'granted',
            ad_user_data: 'granted',
            ad_personalization: 'granted',
            functionality_storage: 'granted',
            personalization_storage: 'granted',
            security_storage: 'granted'
          });
          gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            functionality_storage: 'denied',
            personalization_storage: 'denied',
            wait_for_update: 1000,
            region: ${JSON.stringify(EU_REGION_CODES)}
          });
        `,
      }}
    />
  );
}

function GTMScript() {
  if (!GTM_ID) {
    if (isProd) {
      console.warn('NEXT_PUBLIC_GTM_ID is unset; Google Tag Manager will not load.');
    }
    return null;
  }
  return (
    <>
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `,
        }}
      />
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
          title="gtm-noscript"
        />
      </noscript>
    </>
  );
}

function HubSpotLoader() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // isEUVisitor()/shouldOptOutCapturing() read document.cookie and the
    // browser's IANA timezone, both unavailable during SSR; deferring to an
    // effect keeps the client's first render matching the server's (always
    // `null`) output, avoiding a hydration mismatch. The resulting extra
    // render is the intended tradeoff.
    //
    // Gating on the `statistics` field (via shouldOptOutCapturing), not
    // `marketing`, is intentional even though HubSpot is a marketing/CRM
    // tool: this matches the established, deliberate convention already used
    // by authzed/web (src/consent/vendorSync.ts's `syncHubSpot(prefs.statistics)`)
    // and authzed/docs (components/scripts.tsx's
    // `setLoadHs(!shouldOptOutCapturing(isEUVisitor()))`). Don't "fix" this
    // to `marketing` in isolation -- that would make this property
    // inconsistent with the other two on this exact point.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShouldLoad(!shouldOptOutCapturing(isEUVisitor()));
  }, []);

  if (!HUBSPOT_ID || !shouldLoad) return null;

  // `defer` only (no `async`): in real production, `next/script`'s default
  // `afterInteractive` strategy never renders a literal host <script>
  // element at all — it returns null and loads the script imperatively via
  // `document.createElement` plus its own dedup cache, so this doesn't
  // affect production behavior either way. The distinction only matters for
  // this test file's simplified mock (`vi.mock('next/script', ...)` above),
  // which does render a raw <script {...props} /> host element — and for
  // that mock, React 19 treats a rendered `<script async src=...>` as a
  // hoistable "resource" it inserts into <head> and deliberately never
  // removes on unmount (by design, since scripts can't be safely
  // interrupted once started). That permanent-until-navigation behavior
  // would let a script id leak across unrelated component instances within
  // the same document — including across tests in this file, which reuse
  // one jsdom document — so a later test could observe a script loaded by
  // an earlier one even though its own render decided not to load it.
  // `defer` alone still loads the script without blocking parsing and isn't
  // upgraded to that special resource handling under the mock.
  return <Script id="hs-script-loader" defer src={`//js.hs-scripts.com/${HUBSPOT_ID}.js`} />;
}

export function ExternalScripts() {
  useEffect(() => {
    if (!GTM_ID) return;

    const prefs = readConsentCookie();
    // No cookie means no real decision has been made yet. Don't synthesize
    // one from the isEUVisitor() timezone heuristic and push it as a global
    // `consent update` -- that would override ConsentModeDefaults' static,
    // region-scoped default, which is based on Google's own (more
    // authoritative) server-side IP geolocation. Leave that default standing
    // until a real cookie-based decision exists.
    if (!prefs) return;

    const granted = (allowed: boolean) => (allowed ? 'granted' : 'denied');

    window.dataLayer = window.dataLayer || [];
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    }

    gtag('consent', 'update', {
      analytics_storage: granted(prefs.statistics),
      ad_storage: granted(prefs.marketing),
      ad_user_data: granted(prefs.marketing),
      ad_personalization: granted(prefs.marketing),
      functionality_storage: granted(prefs.preferences),
      personalization_storage: granted(prefs.preferences),
      security_storage: 'granted',
    });
  }, []);

  if (!isProd) return null;

  return (
    <>
      <ConsentModeDefaults />
      <GTMScript />
      <HubSpotLoader />
    </>
  );
}
