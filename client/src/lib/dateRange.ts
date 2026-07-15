import dayjs from 'dayjs';

export type DatePreset = 'day' | 'week' | 'month' | 'year' | 'custom';

export const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'custom', label: 'Custom' },
];

// Week is anchored on Monday (common convention for finance apps).
export function startOfWeek(date: Date): Date {
  const diff = (dayjs(date).day() + 6) % 7; // days since Monday (day(): 0=Sun..6=Sat)
  return dayjs(date).subtract(diff, 'day').startOf('day').toDate();
}

export function startOfDay(date: Date): Date {
  return dayjs(date).startOf('day').toDate();
}

export function addDays(date: Date, days: number): Date {
  return dayjs(date).add(days, 'day').toDate();
}

function localDateKey(date: Date): string {
  return dayjs(date).format('YYYY-MM-DD');
}

/**
 * Stable bucket key for a transaction timestamp under the given preset.
 * Keys are computed in the user's local timezone so grouping matches what
 * they see on screen.
 */
export function periodKey(iso: string, preset: DatePreset): string {
  const d = dayjs(iso);
  switch (preset) {
    case 'day':
    case 'custom':
      return d.format('YYYY-MM-DD');
    case 'week':
      return localDateKey(startOfWeek(d.toDate()));
    case 'month':
      return d.format('YYYY-MM');
    case 'year':
      return d.format('YYYY');
  }
}

/** Human-friendly label for a period bucket, rendered above its transactions. */
export function formatPeriodLabel(
  iso: string,
  preset: DatePreset,
  now: Date = new Date(),
): string {
  const d = dayjs(iso);
  switch (preset) {
    case 'day': {
      const daysAgo = dayjs(now).startOf('day').diff(d.startOf('day'), 'day');
      if (daysAgo <= 0) return 'Today';
      if (daysAgo === 1) return 'Yesterday';
      return d.format('ddd, MMM D');
    }
    case 'week': {
      const weeksAgo = Math.round(
        dayjs(startOfWeek(now))
          .startOf('day')
          .diff(dayjs(startOfWeek(d.toDate())).startOf('day'), 'day') / 7,
      );
      if (weeksAgo <= 0) return 'This week';
      if (weeksAgo === 1) return 'Last week';
      const weekStart = startOfWeek(d.toDate());
      const weekEnd = dayjs(weekStart).add(6, 'day').toDate();
      return `${dayjs(weekStart).format('MMM D')} – ${dayjs(weekEnd).format(
        'MMM D',
      )}`;
    }
    case 'month':
      return d.format('MMMM YYYY');
    case 'year':
      return d.format('YYYY');
    case 'custom':
      return d.format('ddd, MMM D');
  }
}
