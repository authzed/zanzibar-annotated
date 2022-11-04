import getConfig from 'next/config';
import Script from 'next/script';

export function GTagScript() {
  const { publicRuntimeConfig } = getConfig();

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${publicRuntimeConfig.GAMeasurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function _gtag(){window.dataLayer.push(arguments);}
          window.gtag = _gtag;
          window.gtag('js', new Date());

          window.gtag('config', '${publicRuntimeConfig.GAMeasurementId}');
        `}
      </Script>
    </>
  );
}

export function gtagWrapper(func: () => void) {
  if (!!window.gtag) {
    return func();
  }
}
