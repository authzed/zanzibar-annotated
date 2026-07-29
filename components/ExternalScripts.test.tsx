import { cleanup, render, waitFor } from '@testing-library/react';
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
    expect(container.querySelector('iframe')?.getAttribute('src')).toContain(
      'GTM-TEST0000'
    );
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
