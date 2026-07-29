'use client';

import cookies from 'js-cookie';
import Script from 'next/script';
import config from '../config.mjs';

const {
  CONFIG_ENABLE_EXTERNAL_INTEGRATIONS,
  CONFIG_GA_MEASUREMENT_ID,
  CONFIG_HS_ID_URL,
  CONFIG_IS_PROD,
} = config;
console.log(config);

export function ExternalScripts() {
  return CONFIG_IS_PROD && CONFIG_ENABLE_EXTERNAL_INTEGRATIONS ? (
    <>
      {/* <Script
        src="/js/script.js"
        defer
        data-domain="authzed.com"
        data-api="/api/event"
      /> */}
      <HSScript />
      <GTagScript />
    </>
  ) : undefined;
}

function HSScript() {
  const prefs = cookies.get('tracking-preferences') ?? '{}';
  const prefsObj = JSON.parse(prefs);
  const hasConsent = prefsObj.custom?.marketing !== false;
  return hasConsent ? (
    <Script
      src={CONFIG_HS_ID_URL}
      id="hs-script-loader"
      async
      defer
      type="text/javascript"
    ></Script>
  ) : undefined;
}

function GTagScript() {
  return CONFIG_GA_MEASUREMENT_ID ? (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${CONFIG_GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function _gtag(){window.dataLayer.push(arguments);}
          window.gtag = _gtag;
          window.gtag('js', new Date());

          window.gtag('config', '${CONFIG_GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  ) : undefined;
}

// Wrapper for the global function defined after the script is loaded.
// args is constrained by the Gtag.Gtag function type
export const gtag: Gtag.Gtag = function (...args: any) {
  if (!window.gtag) {
    return;
  }
  (window.gtag as Gtag.Gtag).apply(window, args);
};
