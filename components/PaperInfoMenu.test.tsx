import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));

import posthog from 'posthog-js';
import { PaperInfoMenu } from './PaperInfoMenu';

describe('PaperInfoMenu', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fires zanzibar_paper_info_menu_opened when opened, and not again when just closed', async () => {
    render(<PaperInfoMenu />);
    const toggle = screen.getByRole('button');

    await userEvent.click(toggle); // open
    expect(posthog.capture).toHaveBeenCalledWith('zanzibar_paper_info_menu_opened');
    expect(posthog.capture).toHaveBeenCalledTimes(1);

    await userEvent.click(toggle); // close
    expect(posthog.capture).toHaveBeenCalledTimes(1);

    await userEvent.click(toggle); // open again
    expect(posthog.capture).toHaveBeenCalledTimes(2);
  });
});
