import { cleanup, render, waitFor } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/script', () => ({
  default: (props: Record<string, unknown>) => <script {...props} />,
}));
vi.mock('../util/consent', () => ({
  isEUVisitor: vi.fn(),
  readConsentCookie: vi.fn(),
  shouldOptOutCapturing: vi.fn(),
}));

describe('ExternalScripts', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('renders nothing outside of production', async () => {
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview');
    vi.stubEnv('NEXT_PUBLIC_GTM_ID', 'GTM-TEST0000');
    const { ExternalScripts } = await import('./ExternalScripts.js');
    const { container } = render(<ExternalScripts />);
    expect(container.querySelector('#gtm-script')).toBeNull();
  });

  it('renders the GTM bootstrap and noscript fallback in production when NEXT_PUBLIC_GTM_ID is set', async () => {
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_GTM_ID', 'GTM-TEST0000');

    const { ExternalScripts } = await import('./ExternalScripts.js');
    const { container } = render(<ExternalScripts />);

    expect(container.querySelector('#gtm-script')).not.toBeNull();

    // The noscript-wrapped fallback iframe can't be observed through
    // @testing-library/react's render(): it's a from-scratch client mount
    // with no SSR/hydration step, and react-dom never reconciles JSX
    // children into a <noscript> host element on such a mount (browsers do
    // the same whenever the scripting flag is enabled). Next.js actually
    // serves this component through SSR, so render it the same way here —
    // via renderToStaticMarkup — to verify the real, shipped markup.
    const staticMarkup = renderToStaticMarkup(<ExternalScripts />);
    expect(staticMarkup).toContain(
      '<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TEST0000"'
    );
    expect(staticMarkup).toMatch(/<noscript><iframe[^>]*><\/iframe><\/noscript>/);
  });

  it('renders no GTM markup in production when NEXT_PUBLIC_GTM_ID is unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'production');
    const { ExternalScripts } = await import('./ExternalScripts.js');
    const { container } = render(<ExternalScripts />);
    expect(container.querySelector('#gtm-script')).toBeNull();
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('never loads the HubSpot script when NEXT_PUBLIC_HUBSPOT_ID is unset, regardless of consent', async () => {
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'production');
    const consent = await import('../util/consent/index.js');
    vi.mocked(consent.shouldOptOutCapturing).mockReturnValue(false);
    vi.mocked(consent.isEUVisitor).mockReturnValue(false);
    vi.mocked(consent.readConsentCookie).mockReturnValue(null);

    const { ExternalScripts } = await import('./ExternalScripts.js');
    render(<ExternalScripts />);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.getElementById('hs-script-loader')).toBeNull();
  });

  it('loads the HubSpot script once consent resolves to opted-in', async () => {
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_HUBSPOT_ID', 'hs-test-id');
    const consent = await import('../util/consent/index.js');
    vi.mocked(consent.shouldOptOutCapturing).mockReturnValue(false);
    vi.mocked(consent.isEUVisitor).mockReturnValue(false);
    vi.mocked(consent.readConsentCookie).mockReturnValue(null);

    const { ExternalScripts } = await import('./ExternalScripts.js');
    render(<ExternalScripts />);

    await waitFor(() =>
      expect(document.getElementById('hs-script-loader')).not.toBeNull()
    );
  });

  it('does not load the HubSpot script when consent resolves to opted-out', async () => {
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_HUBSPOT_ID', 'hs-test-id');
    const consent = await import('../util/consent/index.js');
    vi.mocked(consent.shouldOptOutCapturing).mockReturnValue(true);
    vi.mocked(consent.isEUVisitor).mockReturnValue(true);
    vi.mocked(consent.readConsentCookie).mockReturnValue(null);

    const { ExternalScripts } = await import('./ExternalScripts.js');
    render(<ExternalScripts />);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.getElementById('hs-script-loader')).toBeNull();
  });
});
