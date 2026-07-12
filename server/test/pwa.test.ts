import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import viteConfig from '../../client/vite.config';

const clientDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../client',
);

function findPwaPlugin(): unknown {
  const plugins = (viteConfig.plugins ?? []) as unknown[];
  const flat = plugins.flat(Infinity) as Array<{ name?: string }>;
  return flat.find((plugin) => plugin?.name === 'vite-plugin-pwa');
}

describe('PWA foundation', () => {
  it('configures vite-plugin-pwa for auto-generated SW + manifest', () => {
    expect(findPwaPlugin()).toBeDefined();
  });

  it('ships a PWA icon', () => {
    expect(existsSync(resolve(clientDir, 'public/icon.svg'))).toBe(true);
  });

  it('no longer ships a hand-rolled service worker', () => {
    expect(existsSync(resolve(clientDir, 'public/sw.js'))).toBe(false);
  });
});
