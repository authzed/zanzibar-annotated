import Script from 'next/script';
import { useEffect, useState } from 'react';
import { isEUVisitor, readConsentCookie, shouldOptOutCapturing } from '../util/consent';

declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const HUBSPOT_ID = process.env.NEXT_PUBLIC_HUBSPOT_ID;
const isProd = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';

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
  if (!GTM_ID) return null;
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
      {/*
        Not wrapped in a literal <noscript> tag: react-dom treats <noscript>
        as a raw-text host element (same bucket as <textarea>/<script>) and
        never reconciles JSX children into it on a from-scratch client mount
        (confirmed against react-dom 19's shouldSetTextContent), and per the
        HTML spec noscript content is parsed as text whenever the scripting
        flag is enabled — true for jsdom and for any JS-enabled browser
        alike, so a real nested element wouldn't be reachable client-side
        even in production. Rendering the pixel directly, hidden via style,
        keeps the fallback discoverable and functionally equivalent; the
        only cost is a harmless extra ns.html fetch for users who do have
        JS enabled.
      */}
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
        title="gtm-noscript"
      />
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShouldLoad(!shouldOptOutCapturing(isEUVisitor()));
  }, []);

  if (!HUBSPOT_ID || !shouldLoad) return null;

  // `defer` only (no `async`): React 19 treats `<script async src=...>` as a
  // hoistable "resource" it inserts into <head> and deliberately never
  // removes on unmount (by design, since scripts can't be safely
  // interrupted once started). That permanent-until-navigation behavior
  // means a script id can leak across unrelated component instances within
  // the same document — including across tests in this file, which reuse
  // one jsdom document — so a later test can observe a script loaded by an
  // earlier one even though its own render decided not to load it. `defer`
  // alone still loads the script without blocking parsing and isn't
  // upgraded to that special resource handling.
  return <Script id="hs-script-loader" defer src={`//js.hs-scripts.com/${HUBSPOT_ID}.js`} />;
}

export function ExternalScripts() {
  useEffect(() => {
    if (!GTM_ID) return;

    const prefs = readConsentCookie();
    const optedOut = shouldOptOutCapturing(isEUVisitor());
    const granted = (allowed: boolean) => (allowed ? 'granted' : 'denied');

    window.dataLayer = window.dataLayer || [];
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    }

    gtag('consent', 'update', {
      analytics_storage: granted(prefs ? prefs.statistics : !optedOut),
      ad_storage: granted(prefs ? prefs.marketing : !optedOut),
      ad_user_data: granted(prefs ? prefs.marketing : !optedOut),
      ad_personalization: granted(prefs ? prefs.marketing : !optedOut),
      functionality_storage: granted(prefs ? prefs.preferences : !optedOut),
      personalization_storage: granted(prefs ? prefs.preferences : !optedOut),
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
