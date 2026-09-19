/** Calendar-aware expiry preset helpers (device-local dates). */

export type ExpiryPresetId = '6mo' | '1y' | '2y' | '3y' | '5y' | 'none';

export type ExpiryPreset = {
  id: ExpiryPresetId;
  /** Months to add from today; null means clear expiry. */
  months: number | null;
  labelKey: string;
};

export const EXPIRY_PRESETS: readonly ExpiryPreset[] = [
  { id: '6mo', months: 6, labelKey: 'expiryPreset6mo' },
  { id: '1y', months: 12, labelKey: 'expiryPreset1y' },
  { id: '2y', months: 24, labelKey: 'expiryPreset2y' },
  { id: '3y', months: 36, labelKey: 'expiryPreset3y' },
  { id: '5y', months: 60, labelKey: 'expiryPreset5y' },
  { id: 'none', months: null, labelKey: 'expiryNone' },
] as const;

/** Local calendar date at local midnight (year/month/day only). */
export function startOfLocalDay(d: Date = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Add calendar months, clamping the day to the last day of the target month
 * when the source day does not exist there (e.g. Jan 31 + 1 mo → Feb 28/29).
 */
export function addCalendarMonths(from: Date, months: number): Date {
  const base = startOfLocalDay(from);
  const day = base.getDate();
  const target = new Date(base.getFullYear(), base.getMonth() + months, 1);
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate();
  target.setDate(Math.min(day, lastDay));
  return target;
}

export function addCalendarYears(from: Date, years: number): Date {
  return addCalendarMonths(from, years * 12);
}

/** Format a local Date as YYYY-MM-DD (schema expiry_at). */
export function toIsoDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse YYYY-MM-DD as a local calendar date (noon avoided; local midnight). */
export function parseIsoDateLocal(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  if (
    d.getFullYear() !== +m[1] ||
    d.getMonth() !== +m[2] - 1 ||
    d.getDate() !== +m[3]
  ) {
    return null;
  }
  return d;
}

/** ISO date for a preset from device-local today, or null for None. */
export function presetExpiryIso(
  presetId: ExpiryPresetId,
  today: Date = new Date(),
): string | null {
  const preset = EXPIRY_PRESETS.find((p) => p.id === presetId);
  if (!preset || preset.months === null) return null;
  return toIsoDateLocal(addCalendarMonths(today, preset.months));
}

/**
 * Which preset chip (if any) matches the current expiry, computed from today only.
 * Returns 'none' when expiry is null/empty; null when a custom date matches no preset.
 */
export function matchingPresetId(
  expiryAt: string | null | undefined,
  today: Date = new Date(),
): ExpiryPresetId | null {
  if (!expiryAt) return 'none';
  for (const p of EXPIRY_PRESETS) {
    if (p.months === null) continue;
    if (presetExpiryIso(p.id, today) === expiryAt) return p.id;
  }
  return null;
}
