import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Mock CSS modules that are imported in components
vi.mock('../styles/Popper.module.css', () => ({}));

// Mock YAML files
vi.mock('../content/annotations-intro.yaml', () => ({
  default: {
    id: 'intro',
    label: 'Introduction to Zanzibar',
    highlightColor: 'amber',
    title: 'Intro',
    subtitle: 'Intro Subtitle',
    description: 'Intro Description',
    cta: 'Intro CTA',
    groups: {
      'page-1-col-2': {
        'across-applications': {
          title: 'Across Applications',
          content: 'Test content',
        },
      },
    },
  },
}));

vi.mock('../content/annotations-spicedb.yaml', () => ({
  default: {
    id: 'spicedb',
    label: 'SpiceDB vs Zanzibar',
    highlightColor: 'blue',
    title: 'SpiceDB',
    subtitle: 'SpiceDB Subtitle',
    description: 'SpiceDB Description',
    cta: 'SpiceDB CTA',
    groups: {},
  },
}));

// Mock SVG files
vi.mock('../content/HNIcon.svg', () => ({
  default: () => null,
}));
vi.mock('../content/RedditIcon.svg', () => ({
  default: () => null,
}));
vi.mock('../content/TwitterIcon.svg', () => ({
  default: () => null,
}));
vi.mock('../content/LinkedinIcon.svg', () => ({
  default: () => null,
}));

afterEach(() => {
  cleanup();
});
