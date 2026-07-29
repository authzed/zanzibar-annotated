import { vi } from 'vitest';

// Shared factory for the `vi.mock('posthog-js', ...)` call repeated across
// test files. Each test file must still call `vi.mock` itself (required for
// Vitest's hoisting) -- this only dedupes the mock object literal.
export const posthogJsMockFactory = () => ({ default: { capture: vi.fn() } });
