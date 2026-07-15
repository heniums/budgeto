import '@testing-library/jest-dom/vitest';

// jsdom does not implement ResizeObserver (used by Radix ScrollArea)
global.ResizeObserver = class ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
};
