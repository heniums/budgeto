import dayjs from 'dayjs';

export interface PeriodWindow {
  startDate: string;
  endDate: string;
}

export type PeriodType = 'monthly' | 'yearly' | 'weekly' | 'custom';

export function computePeriodWindow(
  period: PeriodType,
  referenceDate?: Date,
  customStartDate?: string,
  customEndDate?: string,
): PeriodWindow {
  const ref = dayjs(referenceDate ?? new Date());

  switch (period) {
    case 'monthly':
      return {
        startDate: ref.startOf('month').format('YYYY-MM-DD'),
        endDate: ref.endOf('month').format('YYYY-MM-DD'),
      };
    case 'yearly':
      return {
        startDate: ref.startOf('year').format('YYYY-MM-DD'),
        endDate: ref.endOf('year').format('YYYY-MM-DD'),
      };
    case 'weekly': {
      // dayjs day(0)=Sunday, day(1)=Monday, ..., day(7)=Sunday
      // Compute Monday of the current week
      const dayOfWeek = ref.day();
      const monday = ref.subtract(dayOfWeek === 0 ? 6 : dayOfWeek - 1, 'day');
      return {
        startDate: monday.format('YYYY-MM-DD'),
        endDate: monday.add(6, 'day').format('YYYY-MM-DD'),
      };
    }
    case 'custom':
      if (!customStartDate || !customEndDate) {
        throw new Error('Custom period requires startDate and endDate');
      }
      return {
        startDate: customStartDate,
        endDate: customEndDate,
      };
  }
}

export function resolveStoredDates(
  period: string,
  startDate?: string,
  endDate?: string,
  referenceDate?: Date,
): { startDate: string; endDate: string } {
  if (period === 'custom') {
    if (!startDate || !endDate) {
      throw new Error('Custom period requires startDate and endDate');
    }
    return { startDate, endDate };
  }
  return computePeriodWindow(period as PeriodType, referenceDate);
}

export function parsePeriodReference(periodParam: string): Date {
  return dayjs(periodParam + '-01').toDate();
}

export function resolveUpdateDates(
  inputPeriod: string | undefined,
  inputStartDate: string | undefined,
  inputEndDate: string | undefined,
  existingPeriod: string,
  existingStartDate: string,
  existingEndDate: string,
): { startDate: string; endDate: string } {
  const effectivePeriod = inputPeriod ?? existingPeriod;
  return resolveStoredDates(
    effectivePeriod,
    inputStartDate ?? existingStartDate,
    inputEndDate ?? existingEndDate,
  );
}
