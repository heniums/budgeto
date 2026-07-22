import { describe, it, expect } from 'vitest';
import { computePeriodWindow } from './period';

describe('computePeriodWindow', () => {
  describe('monthly', () => {
    it('returns first and last day of the reference month', () => {
      const window = computePeriodWindow('monthly', new Date('2024-03-15'));
      expect(window.startDate).toBe('2024-03-01');
      expect(window.endDate).toBe('2024-03-31');
    });

    it('handles January (31 days)', () => {
      const window = computePeriodWindow('monthly', new Date('2024-01-15'));
      expect(window.startDate).toBe('2024-01-01');
      expect(window.endDate).toBe('2024-01-31');
    });

    it('handles February in a leap year (29 days)', () => {
      const window = computePeriodWindow('monthly', new Date('2024-02-15'));
      expect(window.startDate).toBe('2024-02-01');
      expect(window.endDate).toBe('2024-02-29');
    });

    it('handles February in a non-leap year (28 days)', () => {
      const window = computePeriodWindow('monthly', new Date('2025-02-15'));
      expect(window.startDate).toBe('2025-02-01');
      expect(window.endDate).toBe('2025-02-28');
    });

    it('handles months with 30 days', () => {
      const window = computePeriodWindow('monthly', new Date('2024-04-20'));
      expect(window.startDate).toBe('2024-04-01');
      expect(window.endDate).toBe('2024-04-30');
    });

    it('defaults to today when no reference date is given', () => {
      const window = computePeriodWindow('monthly');
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      expect(window.startDate).toBe(`${year}-${month}-01`);
      expect(window.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('handles first day of the month edge case', () => {
      const window = computePeriodWindow('monthly', new Date('2024-06-01'));
      expect(window.startDate).toBe('2024-06-01');
      expect(window.endDate).toBe('2024-06-30');
    });

    it('handles last day of the month edge case', () => {
      const window = computePeriodWindow('monthly', new Date('2024-06-30'));
      expect(window.startDate).toBe('2024-06-01');
      expect(window.endDate).toBe('2024-06-30');
    });
  });

  describe('yearly', () => {
    it('returns first and last day of the reference year', () => {
      const window = computePeriodWindow('yearly', new Date('2024-06-15'));
      expect(window.startDate).toBe('2024-01-01');
      expect(window.endDate).toBe('2024-12-31');
    });

    it('handles first day of the year edge case', () => {
      const window = computePeriodWindow('yearly', new Date('2024-01-01'));
      expect(window.startDate).toBe('2024-01-01');
      expect(window.endDate).toBe('2024-12-31');
    });

    it('handles last day of the year edge case', () => {
      const window = computePeriodWindow('yearly', new Date('2024-12-31'));
      expect(window.startDate).toBe('2024-01-01');
      expect(window.endDate).toBe('2024-12-31');
    });

    it('defaults to current year when no reference date is given', () => {
      const window = computePeriodWindow('yearly');
      const year = new Date().getFullYear();
      expect(window.startDate).toBe(`${year}-01-01`);
      expect(window.endDate).toBe(`${year}-12-31`);
    });
  });

  describe('weekly', () => {
    it('returns Monday to Sunday of the reference week', () => {
      // 2024-03-13 is a Wednesday
      const window = computePeriodWindow('weekly', new Date('2024-03-13'));
      expect(window.startDate).toBe('2024-03-11'); // Monday
      expect(window.endDate).toBe('2024-03-17'); // Sunday
    });

    it('handles week spanning month boundary', () => {
      // 2024-01-31 is a Wednesday; week starts Mon Jan 29, ends Sun Feb 4
      const window = computePeriodWindow('weekly', new Date('2024-01-31'));
      expect(window.startDate).toBe('2024-01-29');
      expect(window.endDate).toBe('2024-02-04');
    });

    it('handles week spanning year boundary', () => {
      // 2024-12-31 is a Tuesday; week starts Mon Dec 30 2024, ends Sun Jan 5 2025
      const window = computePeriodWindow('weekly', new Date('2024-12-31'));
      expect(window.startDate).toBe('2024-12-30');
      expect(window.endDate).toBe('2025-01-05');
    });

    it('defaults to current week when no reference date is given', () => {
      const window = computePeriodWindow('weekly');
      expect(window.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(window.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('custom', () => {
    it('returns the provided start and end dates unchanged', () => {
      const window = computePeriodWindow(
        'custom',
        new Date('2024-03-15'),
        '2024-02-01',
        '2024-02-28',
      );
      expect(window.startDate).toBe('2024-02-01');
      expect(window.endDate).toBe('2024-02-28');
    });

    it('throws when start date is missing for custom period', () => {
      expect(() =>
        computePeriodWindow('custom', new Date('2024-03-15')),
      ).toThrow('Custom period requires startDate and endDate');
    });

    it('throws when end date is missing for custom period', () => {
      expect(() =>
        computePeriodWindow('custom', new Date('2024-03-15'), '2024-02-01'),
      ).toThrow('Custom period requires startDate and endDate');
    });
  });
});
