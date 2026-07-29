import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./GTag', () => ({ gtag: vi.fn() }));

import { gtag } from './GTag';
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

    expect(gtag).toHaveBeenCalledWith('event', 'annotation_set_selected', {
      set_id: 'spicedb',
    });
    expect(await screen.findByText('SpiceDB vs Zanzibar')).toBeInTheDocument();
  });
});
