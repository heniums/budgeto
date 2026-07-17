import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { MockInstance } from 'vitest';
import { detectLocaleCurrency, formatMoney, isCurrencyCode } from './currencies';

describe('detectLocaleCurrency', () => {
  let languageSpy: ReturnType<typeof vi.spyOn>;
  let intlNumberFormatSpy: MockInstance<(...args: unknown[]) => unknown>;

  beforeEach(() => {
    languageSpy = vi.spyOn(window.navigator, 'language', 'get');
    intlNumberFormatSpy = vi.spyOn(Intl, 'NumberFormat').mockImplementation(
      () =>
        ({
          resolvedOptions: () => ({ currency: 'USD' }),
        }) as unknown as Intl.NumberFormat,
    ) as MockInstance<(...args: unknown[]) => unknown>;
  });

  afterEach(() => {
    languageSpy.mockRestore();
    intlNumberFormatSpy.mockRestore();
  });

  it('returns the currency resolved from the browser locale', () => {
    languageSpy.mockReturnValue('de-DE');
    intlNumberFormatSpy.mockImplementation(
      () =>
        ({
          resolvedOptions: () => ({ currency: 'EUR' }),
        }) as unknown as Intl.NumberFormat,
    );

    expect(detectLocaleCurrency()).toBe('EUR');
  });

  it('returns USD when the resolved currency is unsupported', () => {
    languageSpy.mockReturnValue('xx-XX');
    intlNumberFormatSpy.mockImplementation(
      () =>
        ({
          resolvedOptions: () => ({ currency: 'XXX' }),
        }) as unknown as Intl.NumberFormat,
    );

    expect(detectLocaleCurrency()).toBe('USD');
  });

  it('falls back to USD when Intl.NumberFormat throws', () => {
    languageSpy.mockReturnValue('de-DE');
    intlNumberFormatSpy.mockImplementation(() => {
      throw new Error('Intl unavailable');
    });

    expect(detectLocaleCurrency()).toBe('USD');
  });

  it('falls back to USD when no currency is resolved', () => {
    languageSpy.mockReturnValue('de-DE');
    intlNumberFormatSpy.mockImplementation(
      () =>
        ({
          resolvedOptions: () => ({ currency: undefined }),
        }) as unknown as Intl.NumberFormat,
    );

    expect(detectLocaleCurrency()).toBe('USD');
  });
});

describe('isCurrencyCode', () => {
  it('returns true for supported codes', () => {
    expect(isCurrencyCode('USD')).toBe(true);
    expect(isCurrencyCode('EUR')).toBe(true);
  });

  it('returns false for unsupported codes', () => {
    expect(isCurrencyCode('XYZ')).toBe(false);
    expect(isCurrencyCode('')).toBe(false);
  });
});

describe('formatMoney', () => {
  it('formats USD with two decimals', () => {
    expect(formatMoney('50', 'USD')).toBe('$50.00');
  });

  it('formats negative USD', () => {
    expect(formatMoney('-42.5', 'USD')).toBe('-$42.50');
  });

  it('formats JPY without decimals', () => {
    expect(formatMoney('5000', 'JPY')).toBe('¥5,000');
  });

  it('falls back to USD for invalid currency', () => {
    expect(formatMoney('100', 'XYZ')).toBe('$100.00');
  });

  it('returns em dash for non-numeric amount', () => {
    expect(formatMoney('not-a-number', 'USD')).toBe('—');
  });
});
