import Script from 'next/script';

export function GTagScript() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.GAMeasurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function _gtag(){window.dataLayer.push(arguments);}
          window.gtag = _gtag;
          window.gtag('js', new Date());

          window.gtag('config', '${process.env.GAMeasurementId}');
        `}
      </Script>
    </>
  );
}

// Wrapper for the global function defined after the script is loaded.
// args is constrained by the Gtag.Gtag function type
export const gtag: Gtag.Gtag = function (...args: any) {
  if (!window.gtag) {
    return;
  }
  (window.gtag as Gtag.Gtag).apply(window, args);
};
