import { describe, it, expect, vi } from 'vitest';
import { detectLocaleCurrency } from './currencies';

describe('detectLocaleCurrency', () => {
  it('returns USD for en-US locale', () => {
    const languageSpy = vi.spyOn(window.navigator, 'language', 'get');
    languageSpy.mockReturnValue('en-US');

    expect(detectLocaleCurrency()).toBe('USD');

    languageSpy.mockRestore();
  });

  it('returns EUR for de-DE locale', () => {
    const languageSpy = vi.spyOn(window.navigator, 'language', 'get');
    languageSpy.mockReturnValue('de-DE');

    expect(detectLocaleCurrency()).toBe('EUR');

    languageSpy.mockRestore();
  });

  it('falls back to USD for unknown locales', () => {
    const languageSpy = vi.spyOn(window.navigator, 'language', 'get');
    languageSpy.mockReturnValue('xx-XX');

    expect(detectLocaleCurrency()).toBe('USD');

    languageSpy.mockRestore();
  });
});
