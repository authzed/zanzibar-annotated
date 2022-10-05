import getConfig from 'next/config';
import Script from 'next/script';

export function GTag() {
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
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${publicRuntimeConfig.GAMeasurementId}');
        `}
      </Script>
    </>
  );
}
