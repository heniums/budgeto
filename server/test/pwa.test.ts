import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const clientDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../client',
);

describe('PWA foundation', () => {
  it('ships a valid web manifest', () => {
    const manifestPath = resolve(clientDir, 'public/manifest.webmanifest');
    expect(existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    expect(manifest.name).toBe('Budgeto');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
  });

  it('ships a service worker', () => {
    const swPath = resolve(clientDir, 'public/sw.js');
    expect(existsSync(swPath)).toBe(true);
  });
});
