import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const css = readFileSync(join(process.cwd(), 'client/src/styles.css'), 'utf8');

describe('theme palette tokens', () => {
  it('defines the calm green primary color from the brand', () => {
    expect(css).toMatch(/--color-primary:\s*#1f8a4c/i);
  });

  it('defines a blue accent color', () => {
    expect(css).toMatch(/--color-accent:\s*#[0-9a-f]{6}/i);
  });

  it('provides a visible focus ring for keyboard users', () => {
    expect(css).toMatch(/--focus-ring:/);
    expect(css).toMatch(/:focus-visible\s*\{/);
  });

  it('respects reduced-motion preferences', () => {
    expect(css).toMatch(/prefers-reduced-motion/);
  });
});
