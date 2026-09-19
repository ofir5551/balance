import { SOON_EXPIRING_DAYS } from '../constants';

export type ExpiryKind = 'none' | 'ok' | 'soon' | 'expired';

function todayUtc(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function parseDay(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
}

export function expiryStatus(
  expiryAt: string | null,
  soonDays = SOON_EXPIRING_DAYS,
): ExpiryKind {
  if (!expiryAt) return 'none';
  const day = parseDay(expiryAt);
  if (!day) return 'none';
  const diff = Math.round((day.getTime() - todayUtc().getTime()) / 86_400_000);
  if (diff < 0) return 'expired';
  if (diff <= soonDays) return 'soon';
  return 'ok';
}

/** Locale-format dates for UI — never raw ISO. */
export function formatExpiryDate(expiryAt: string | null): string | null {
  if (!expiryAt) return null;
  const day = parseDay(expiryAt);
  if (!day) return expiryAt;
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(day);
}
