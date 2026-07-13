import type { Item } from './db';

/** Format a Date as local ISO yyyy-mm-dd. */
export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse ISO yyyy-mm-dd as a Date at *local* midnight (avoids UTC off-by-one). */
export function fromISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function todayISO(): string {
  return toISO(new Date());
}

export function addDays(iso: string, n: number): string {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function addMonths(iso: string, n: number): string {
  const d = fromISO(iso);
  d.setMonth(d.getMonth() + n);
  return toISO(d);
}

/** Whole days from today until the given date. Negative = past. */
export function daysUntil(iso: string): number {
  const ms = fromISO(iso).getTime() - fromISO(todayISO()).getTime();
  return Math.round(ms / 86_400_000);
}

export function fmtDate(iso: string): string {
  return fromISO(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/** Compact stamp form, e.g. "2026-08-01" — used on the date stamps. */
export function stampDate(iso: string): string {
  return iso;
}

export function relLabel(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}

/**
 * The date that actually matters. If an item is opened and has a
 * "use within N days" window, the effective expiry is whichever comes
 * first: the printed date, or opened + N days.
 * (ISO yyyy-mm-dd strings compare correctly as plain strings.)
 */
export function effectiveExpiry(
  it: Pick<Item, 'expiresOn' | 'openedOn' | 'useWithinDays'>
): string {
  if (it.openedOn && it.useWithinDays && it.useWithinDays > 0) {
    const openedLimit = addDays(it.openedOn, it.useWithinDays);
    return openedLimit < it.expiresOn ? openedLimit : it.expiresOn;
  }
  return it.expiresOn;
}

export type Urgency = 'expired' | 'critical' | 'soon' | 'ok';

export function urgencyOf(days: number): Urgency {
  if (days < 0) return 'expired';
  if (days <= 3) return 'critical';
  if (days <= 14) return 'soon';
  return 'ok';
}
