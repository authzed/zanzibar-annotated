import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { posthogJsMockFactory } from '../test/mockPosthog';

vi.mock('posthog-js', () => posthogJsMockFactory());

import posthog from 'posthog-js';
import { AnnotationManagerProvider, getAvailableAnnotationSets } from './annotation';
import AnnotationSetSelect from './AnnotationSetSelect';

describe('AnnotationSetSelect', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('switching the selected set toggles both sets and fires annotation_set_selected', async () => {
    render(
      <AnnotationManagerProvider>
        <AnnotationSetSelect items={getAvailableAnnotationSets()} default="intro" />
      </AnnotationManagerProvider>
    );

    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(await screen.findByText('SpiceDB vs Zanzibar'));

    expect(posthog.capture).toHaveBeenCalledWith('zanzibar_annotation_set_selected', {
      set_id: 'spicedb',
    });
    expect(await screen.findByText('SpiceDB vs Zanzibar')).toBeInTheDocument();
  });
});
