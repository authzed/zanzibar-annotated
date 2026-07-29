import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { posthogJsMockFactory } from '../test/mockPosthog';

vi.mock('posthog-js', () => posthogJsMockFactory());

import posthog from 'posthog-js';
import SelectionShare, { ShareButton } from './SelectionShare';

describe('ShareButton', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('copies the URL and fires selection_share_clipboard on link click', async () => {
    const writeText = vi.fn();
    // jsdom doesn't implement the Clipboard API by default, so
    // `navigator.clipboard` has no own or prototype property to begin with
    // (verified: `Object.getOwnPropertyDescriptor(navigator, 'clipboard')` is
    // `undefined` before this runs). Save whatever *is* there (nothing, in
    // practice) and restore it in this test's own try/finally -- the shared
    // `afterEach(() => { vi.restoreAllMocks(); vi.clearAllMocks(); })` above
    // only undoes `vi.spyOn`/`vi.fn` mocks, not this direct property
    // mutation, so without this the stub would otherwise leak into every
    // later test in this file.
    const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
      writable: true,
    });

    try {
      render(<ShareButton type="link" shareUrl="https://zanzibar.tech/x" title="Copy" />);
      await userEvent.click(screen.getByTitle('Copy'));

      expect(writeText).toHaveBeenCalledWith('https://zanzibar.tech/x');
      expect(posthog.capture).toHaveBeenCalledWith('zanzibar_selection_share_clipboard', {
        share_url: 'https://zanzibar.tech/x',
      });
    } finally {
      if (originalClipboard) {
        Object.defineProperty(navigator, 'clipboard', originalClipboard);
      } else {
        delete (navigator as { clipboard?: unknown }).clipboard;
      }
    }
  });

  it('opens a Twitter intent and fires selection_share_twitter on twitter click', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<ShareButton type="twitter" shareUrl="https://zanzibar.tech/x" title="Tweet" />);
    await userEvent.click(screen.getByTitle('Tweet'));

    expect(openSpy).toHaveBeenCalled();
    expect(posthog.capture).toHaveBeenCalledWith('zanzibar_selection_share_twitter', {
      share_url: 'https://zanzibar.tech/x',
    });
  });

  it('opens a Reddit submit link and fires selection_share_reddit on reddit click', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<ShareButton type="reddit" shareUrl="https://zanzibar.tech/x" title="Reddit" />);
    await userEvent.click(screen.getByTitle('Reddit'));

    expect(openSpy).toHaveBeenCalled();
    expect(posthog.capture).toHaveBeenCalledWith('zanzibar_selection_share_reddit', {
      share_url: 'https://zanzibar.tech/x',
    });
  });

  it('opens an HN submit link and fires selection_share_hn on hn click', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<ShareButton type="hn" shareUrl="https://zanzibar.tech/x" title="HN" />);
    await userEvent.click(screen.getByTitle('HN'));

    expect(openSpy).toHaveBeenCalled();
    expect(posthog.capture).toHaveBeenCalledWith('zanzibar_selection_share_hn', {
      share_url: 'https://zanzibar.tech/x',
    });
  });
});

describe('SelectionShare', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('fires selection_share_viewed when a non-collapsed selection is made under the content container', () => {
    const { container } = render(
      <div className="paper-content-container">
        <SelectionShare />
      </div>
    );
    const contentContainer = container.querySelector('.paper-content-container')!;

    const fakeRange = {
      toString: () => 'a selected passage',
      startContainer: contentContainer,
    };
    vi.spyOn(document, 'getSelection').mockReturnValue({
      rangeCount: 1,
      isCollapsed: false,
      getRangeAt: () => fakeRange,
    } as unknown as Selection);

    act(() => {
      document.dispatchEvent(new Event('selectionchange'));
      vi.advanceTimersByTime(250);
    });

    expect(posthog.capture).toHaveBeenCalledWith('zanzibar_selection_share_viewed', {
      share_url: document.URL,
      selection_length: 'a selected passage'.length,
    });
  });
});
