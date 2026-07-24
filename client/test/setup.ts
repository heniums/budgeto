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
