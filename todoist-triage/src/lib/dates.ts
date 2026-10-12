import type { Due } from '../api/types';

/** Dates are handled as local `YYYY-MM-DD` strings, the way Todoist shows them. */

const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(now = new Date()): string {
  return toISODate(now);
}

function fromISODate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function daysBetween(fromISO: string, toISO: string): number {
  return Math.round((fromISODate(toISO).getTime() - fromISODate(fromISO).getTime()) / 86_400_000);
}

/**
 * Split a Todoist due date into its local day and time. Floating times
 * ("2026-10-13T09:00:00") are already local; fixed-zone times end in Z and are converted.
 */
export function parseDue(date: string): { day: string; time: string | null } {
  if (date.length <= 10) return { day: date, time: null };
  if (date.endsWith('Z')) {
    const d = new Date(date);
    return { day: toISODate(d), time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
  }
  return { day: date.slice(0, 10), time: date.slice(11, 16) };
}

/** When a dated-only target meets a task that has a time, keep the time (Todoist does the same). */
export function keepTimeOfDay(newDate: string, current: string): string {
  if (newDate.length > 10 || current.length <= 10) return newDate;
  return newDate + current.slice(10);
}

export type DueState = 'overdue' | 'today' | 'upcoming' | 'none';

export function dueState(due: Due | null, today: string): DueState {
  if (!due) return 'none';
  const { day } = parseDue(due.date);
  if (day < today) return 'overdue';
  if (day === today) return 'today';
  return 'upcoming';
}

const WEEKDAY = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
const MONTH_DAY = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const FULL = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

/** "Today", "Tomorrow", "Yesterday", "Fri, Oct 16", or "Mar 3, 2027" outside this year. */
export function formatDay(iso: string, today: string): string {
  const diff = daysBetween(today, iso);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return formatDate(iso, today);
}

/** Always the calendar date ("Tue, Oct 13"), for lists where relative words would repeat the label. */
export function formatDate(iso: string, today: string): string {
  const d = fromISODate(iso);
  if (iso.slice(0, 4) !== today.slice(0, 4)) return FULL.format(d);
  return `${WEEKDAY.format(d)}, ${MONTH_DAY.format(d)}`;
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatDue(due: Due, today: string): string {
  const { day, time } = parseDue(due.date);
  return time ? `${formatDay(day, today)} ${formatTime(time)}` : formatDay(day, today);
}

/** How long a task has been sitting: "added today", "added 12d ago", "added 5w ago", "added 4mo ago". */
export function ageLabel(addedAt: string | null, today: string): string | null {
  if (!addedAt) return null;
  const days = daysBetween(toISODate(new Date(addedAt)), today);
  if (days <= 0) return 'added today';
  if (days < 21) return `added ${days}d ago`;
  if (days < 90) return `added ${Math.round(days / 7)}w ago`;
  if (days < 730) return `added ${Math.round(days / 30)}mo ago`;
  return `added ${Math.round(days / 365)}y ago`;
}

export interface LaterOption {
  key: string;
  label: string;
  date: string;
}

/** The quick choices on the Later sheet, each with the real date it lands on. */
export function laterOptions(today: string): LaterOption[] {
  const weekday = fromISODate(today).getDay(); // 0 = Sunday
  const daysToSaturday = ((6 - weekday + 7) % 7) || 7;
  const daysToMonday = ((1 - weekday + 7) % 7) || 7;
  const t = fromISODate(today);
  const firstOfNextMonth = toISODate(new Date(t.getFullYear(), t.getMonth() + 1, 1));
  return [
    { key: 'tomorrow', label: 'Tomorrow', date: addDays(today, 1) },
    { key: 'weekend', label: weekday === 6 || weekday === 0 ? 'Next weekend' : 'This weekend', date: addDays(today, daysToSaturday) },
    { key: 'next-week', label: 'Next week', date: addDays(today, daysToMonday) },
    { key: 'next-month', label: 'Next month', date: firstOfNextMonth },
  ];
}
