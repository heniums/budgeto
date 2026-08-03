import { describe, it, expect } from 'vitest';
import {
  periodKey,
  formatPeriodLabel,
  startOfWeek,
  getIntervalBounds,
  type DatePreset,
} from './dateRange';

const NOW = new Date('2026-01-15T12:00:00'); // Thursday

describe('periodKey', () => {
  it('buckets by local day for day and custom presets', () => {
    expect(periodKey('2026-01-15T08:00:00', 'day')).toBe('2026-01-15');
    expect(periodKey('2026-01-14T23:59:00', 'day')).toBe('2026-01-14');
    expect(periodKey('2026-01-15T08:00:00', 'custom')).toBe('2026-01-15');
  });

  it('buckets by Monday-anchored week', () => {
    // 2026-01-15 is Thursday; the week starts Monday 2026-01-12.
    expect(periodKey('2026-01-12T00:00:00', 'week')).toBe('2026-01-12');
    expect(periodKey('2026-01-13T00:00:00', 'week')).toBe('2026-01-12');
    expect(periodKey('2026-01-11T23:00:00', 'week')).toBe('2026-01-05');
  });

  it('buckets by month', () => {
    expect(periodKey('2026-01-31T00:00:00', 'month')).toBe('2026-01');
    expect(periodKey('2025-12-01T00:00:00', 'month')).toBe('2025-12');
  });

  it('buckets by year', () => {
    expect(periodKey('2026-06-01T00:00:00', 'year')).toBe('2026');
    expect(periodKey('2025-06-01T00:00:00', 'year')).toBe('2025');
  });

  it('keeps separate days in separate years distinct', () => {
    expect(periodKey('2025-01-15T00:00:00', 'day')).toBe('2025-01-15');
  });
});

describe('formatPeriodLabel', () => {
  const presets: DatePreset[] = ['day', 'week', 'month', 'year', 'custom'];

  it('uses Today/Yesterday for recent days', () => {
    expect(formatPeriodLabel('2026-01-15T08:00:00', 'day', NOW)).toBe('Today');
    expect(formatPeriodLabel('2026-01-14T08:00:00', 'day', NOW)).toBe(
      'Yesterday',
    );
  });

  it('labels This week / Last week', () => {
    expect(formatPeriodLabel('2026-01-12T08:00:00', 'week', NOW)).toBe(
      'This week',
    );
    expect(formatPeriodLabel('2026-01-05T08:00:00', 'week', NOW)).toBe(
      'Last week',
    );
  });

  it('labels months and years', () => {
    expect(formatPeriodLabel('2026-01-15T08:00:00', 'month', NOW)).toContain(
      '2026',
    );
    expect(formatPeriodLabel('2025-12-15T08:00:00', 'year', NOW)).toBe('2025');
  });

  it('returns non-empty labels for every preset', () => {
    for (const preset of presets) {
      const label = formatPeriodLabel('2026-01-13T08:00:00', preset, NOW);
      expect(label.length).toBeGreaterThan(0);
    }
  });
});

describe('startOfWeek', () => {
  it('anchors on Monday', () => {
    // Thursday -> Monday of the same week.
    expect(startOfWeek(new Date('2026-01-15T12:00:00')).getDay()).toBe(1);
    // Sunday 2026-01-18 -> Monday 2026-01-12.
    expect(startOfWeek(new Date('2026-01-18T12:00:00')).getDate()).toBe(12);
  });
});

describe('getIntervalBounds', () => {
  const NOW = new Date('2026-01-15T12:00:00'); // Thursday

  it('returns the full day for "day"', () => {
    const { from, to } = getIntervalBounds('day', NOW);
    expect(from.toISOString()).toBe('2026-01-15T00:00:00.000Z');
    // endOf('day') is 23:59:59.999
    expect(to.getFullYear()).toBe(2026);
    expect(to.getMonth()).toBe(0);
    expect(to.getDate()).toBe(15);
    expect(to.getHours()).toBe(23);
    expect(to.getMinutes()).toBe(59);
    expect(to.getSeconds()).toBe(59);
  });

  it('returns Monday-anchored week for "week"', () => {
    const { from, to } = getIntervalBounds('week', NOW);
    // 2026-01-15 is Thursday; week starts Monday 2026-01-12
    expect(from.getFullYear()).toBe(2026);
    expect(from.getMonth()).toBe(0);
    expect(from.getDate()).toBe(12);
    expect(from.getHours()).toBe(0);
    // Monday + 6 days = Sunday 2026-01-18
    expect(to.getFullYear()).toBe(2026);
    expect(to.getMonth()).toBe(0);
    expect(to.getDate()).toBe(18);
    expect(to.getHours()).toBe(23);
    expect(to.getMinutes()).toBe(59);
    // matches startOfWeek
    expect(from.getTime()).toBe(startOfWeek(NOW).getTime());
  });

  it('returns the full month for "month"', () => {
    const { from, to } = getIntervalBounds('month', NOW);
    expect(from.getFullYear()).toBe(2026);
    expect(from.getMonth()).toBe(0);
    expect(from.getDate()).toBe(1);
    expect(from.getHours()).toBe(0);
    expect(to.getFullYear()).toBe(2026);
    expect(to.getMonth()).toBe(0);
    expect(to.getDate()).toBe(31);
    expect(to.getHours()).toBe(23);
  });

  it('returns the full year for "year"', () => {
    const { from, to } = getIntervalBounds('year', NOW);
    expect(from.getFullYear()).toBe(2026);
    expect(from.getMonth()).toBe(0);
    expect(from.getDate()).toBe(1);
    expect(from.getHours()).toBe(0);
    expect(to.getFullYear()).toBe(2026);
    expect(to.getMonth()).toBe(11);
    expect(to.getDate()).toBe(31);
    expect(to.getHours()).toBe(23);
  });
});
