// Shared design tokens and configuration constants.
// These values are stable and unlikely to change per-feature.

/** Default wallet/category accent colour (Budgeto brand green). */
export const DEFAULT_COLOR = '#1f8a4c';

/** Curated preset colour palette for the colour picker. */
export const PRESET_COLORS = [
  '#1f8a4c',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#ec4899',
  '#f43f5e',
  '#6b7280',
  '#09090b',
  '#ffffff',
] as const;

/** Default icon for newly created categories. */
export const DEFAULT_ICON_NAME = 'Tag';

/** Maximum input lengths used by Zod schemas. */
export const MAX_NAME_LENGTH = 128;
export const MAX_DESCRIPTION_LENGTH = 512;

/** Human-readable labels shared across wallet/category forms. */
export const LABEL = {
  NAME: 'Name',
  DESCRIPTION: 'Description',
  COLOR: 'Color',
  ICON: 'Icon',
} as const;

/** Error message templates. */
export const ERR = {
  FAILED_TO_LOAD: (resource: string): string =>
    `Failed to load ${resource}.`,
  FAILED_TO_SAVE: (resource: string): string =>
    `Failed to save ${resource}.`,
  FAILED_TO_DELETE: (resource: string): string =>
    `Failed to delete ${resource}.`,
} as const;

/** Sheet layout constants. */
export const SHEET_SIDE = 'right' as const;
export const SHEET_WIDTH = 'sm:max-w-md' as const;
