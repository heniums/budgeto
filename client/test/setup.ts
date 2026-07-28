process.env.TZ = 'UTC';

import '@testing-library/jest-dom/vitest';

// Suppress React Router v6→v7 future-flag warnings in test output.
// These are informational opt-in notices; filtering here keeps the test log focused on real issues.
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const first = typeof args[0] === 'string' ? args[0] : '';
  if (first.includes('React Router Future Flag Warning')) return;
  originalWarn(...args);
};

// jsdom does not implement ResizeObserver (used by Radix ScrollArea)
global.ResizeObserver = class ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
};

// jsdom does not implement matchMedia (used by useGridColumns)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock react-chartjs-2 so jsdom doesn't need a real canvas implementation.
vi.mock('react-chartjs-2', () => ({
  Line: () => null,
  Bar: () => null,
  Doughnut: () => null,
}));
