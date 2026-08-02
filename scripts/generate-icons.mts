/**
 * Generate favicon and PWA icon set from SVG source.
 *
 * Usage:  tsx scripts/generate-icons.mts
 *
 * Outputs (all in client/public/):
 *   - favicon-16x16.png
 *   - favicon-32x32.png
 *   - favicon.ico          (multi-size: 16, 32, 48)
 *   - apple-touch-icon.png (180×180)
 *   - icon-192x192.png
 *   - icon-512x512.png
 *   - icon-maskable-192x192.png
 *   - icon-maskable-512x512.png
 */

import sharp from 'sharp';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const pngToIco = require('png-to-ico').default;

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUB = resolve(__dirname, '../client/public');

// ── Regular icon SVG ────────────────────────────────────────────────
const ICON_SVG = readFileSync(resolve(PUB, 'icon.svg'), 'utf-8');

// ── Maskable icon SVG ───────────────────────────────────────────────
// For maskable: background fills edge-to-edge (no rounded corners,
// OS applies the mask). Content sits within center 80% safe zone.
const MASKABLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1f8a4c"/>
  <circle cx="256" cy="256" r="138" fill="#ffffff"/>
  <rect x="168" y="278" width="44" height="72" rx="8" fill="#1f8a4c"/>
  <rect x="234" y="244" width="44" height="106" rx="8" fill="#1f8a4c"/>
  <rect x="300" y="204" width="44" height="146" rx="8" fill="#1f8a4c"/>
</svg>`;

async function svgToPng(svg: string, size: number): Promise<Buffer> {
  return sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toBuffer();
}

async function main() {
  const sizes = [16, 32, 48, 180, 192, 512] as const;

  console.log('Generating standard PNG icons…');
  const pngs = new Map<number, Buffer>();
  for (const size of sizes) {
    const buf = await svgToPng(ICON_SVG, size);
    pngs.set(size, buf);
    console.log(`  ✓ ${size}×${size}`);
  }

  console.log('Generating maskable PNG icons…');
  const maskable192 = await svgToPng(MASKABLE_SVG, 192);
  const maskable512 = await svgToPng(MASKABLE_SVG, 512);
  console.log('  ✓ maskable 192×192');
  console.log('  ✓ maskable 512×512');

  // Write PNG files
  writeFileSync(resolve(PUB, 'favicon-16x16.png'), pngs.get(16)!);
  writeFileSync(resolve(PUB, 'favicon-32x32.png'), pngs.get(32)!);
  writeFileSync(resolve(PUB, 'apple-touch-icon.png'), pngs.get(180)!);
  writeFileSync(resolve(PUB, 'icon-192x192.png'), pngs.get(192)!);
  writeFileSync(resolve(PUB, 'icon-512x512.png'), pngs.get(512)!);
  writeFileSync(resolve(PUB, 'icon-maskable-192x192.png'), maskable192);
  writeFileSync(resolve(PUB, 'icon-maskable-512x512.png'), maskable512);

  // Generate multi-size ICO via temp files (png-to-ico needs file paths)
  const tmp48 = resolve(PUB, '__tmp_favicon48.png');
  writeFileSync(tmp48, pngs.get(48)!);
  const icoBuf = await pngToIco([
    resolve(PUB, 'favicon-16x16.png'),
    resolve(PUB, 'favicon-32x32.png'),
    tmp48,
  ]);
  writeFileSync(resolve(PUB, 'favicon.ico'), icoBuf);
  // Clean up temp file
  unlinkSync(tmp48);
  console.log('  ✓ favicon.ico (16, 32, 48)');

  console.log('\nDone! All icons written to client/public/');
}

main().catch((err) => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});
