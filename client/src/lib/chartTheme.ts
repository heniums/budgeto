export const OTHER_COLOR = 'hsl(160 12% 35%)';

export const CHART_COLORS = {
  income: 'hsl(152 76% 38%)',
  expense: 'hsl(0 78% 50%)',
  net: 'hsl(48 96% 56%)',
  grid: 'hsl(160 12% 35% / 0.15)',
  text: 'hsl(160 12% 35%)',
  tooltipBg: 'hsl(0 0% 100%)',
  fallback: [
    'hsl(152 76% 38%)',
    'hsl(48 96% 56%)',
    'hsl(0 78% 50%)',
    'hsl(210 80% 50%)',
    'hsl(280 60% 50%)',
    'hsl(330 70% 50%)',
    'hsl(20 80% 50%)',
    'hsl(195 70% 45%)',
  ],
} as const;
