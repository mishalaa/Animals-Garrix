import { addDays, addMonths, daysBetween, parseISODate, startOfDay, today } from './dates';
import type { DoseLog, Medicine, Pet } from '@/types';

/**
 * Turns medicine rows into concrete due items ("doses") for a date range,
 * and merges in what was logged as done or skipped.
 *
 * - Recurring medicines (daily, twice daily, weekly, monthly) produce a dose per scheduled time.
 * - Vaccines, deworming and other one-off items with a next_due date produce one dose on that date.
 */

export interface Dose {
  key: string; // medicine_id + scheduled time, stable for logging
  medicine: Medicine;
  pet: Pet | undefined;
  at: Date;
  status: 'pending' | 'done' | 'skipped';
  log?: DoseLog;
}

const DEFAULT_TIMES: Record<string, string[]> = {
  twice_daily: ['08:00', '20:00'],
};

function timesFor(m: Medicine): string[] {
  const t = m.times?.filter(Boolean) ?? [];
  if (m.frequency === 'twice_daily' && t.length < 2) return DEFAULT_TIMES.twice_daily;
  return t.length ? t : ['09:00'];
}

function at(day: Date, hhmm: string): Date {
  const [h, mi] = hhmm.split(':').map((x) => parseInt(x, 10));
  const d = new Date(day);
  d.setHours(isNaN(h) ? 9 : h, isNaN(mi) ? 0 : mi, 0, 0);
  return d;
}

function occursOn(m: Medicine, day: Date): boolean {
  const start = parseISODate(m.start_date);
  if (!start) return false;
  const end = parseISODate(m.end_date);
  if (day < startOfDay(start)) return false;
  if (end && day > startOfDay(end)) return false;
  switch (m.frequency) {
    case 'daily':
    case 'twice_daily':
      return true;
    case 'weekly':
      return daysBetween(start, day) % 7 === 0;
    case 'monthly':
      return (
        day.getDate() ===
        Math.min(start.getDate(), new Date(day.getFullYear(), day.getMonth() + 1, 0).getDate())
      );
    default:
      return false;
  }
}

/** Is this a "due date" style item (vaccine, deworming, one-off) rather than a recurring routine? */
export function isDueDateItem(m: Medicine): boolean {
  return m.frequency === 'once' || m.frequency === 'yearly' || !!m.next_due;
}

export function dosesBetween(
  medicines: Medicine[],
  logs: DoseLog[],
  pets: Pet[],
  from: Date,
  to: Date,
): Dose[] {
  const petById = new Map(pets.map((p) => [p.id, p]));
  const logByKey = new Map(logs.map((l) => [`${l.medicine_id}@${new Date(l.scheduled_for).getTime()}`, l]));
  const out: Dose[] = [];
  const push = (m: Medicine, when: Date) => {
    const key = `${m.id}@${when.getTime()}`;
    const log = logByKey.get(key);
    out.push({
      key,
      medicine: m,
      pet: petById.get(m.pet_id),
      at: when,
      status: log?.status ?? 'pending',
      log,
    });
  };

  for (const m of medicines) {
    if (!m.active || m.deleted_at) continue;
    if (!petById.has(m.pet_id)) continue;
    if (isDueDateItem(m)) {
      const due = parseISODate(m.next_due);
      if (due && due >= startOfDay(from) && due <= startOfDay(to)) push(m, at(due, timesFor(m)[0]));
      continue;
    }
    for (let day = startOfDay(from); day <= to; day = addDays(day, 1)) {
      if (occursOn(m, day)) timesFor(m).forEach((t) => push(m, at(day, t)));
    }
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}

export interface Agenda {
  overdue: Dose[];
  today: Dose[];
  upcoming: Dose[];
}

/**
 * Overdue, today, and the next `days` days.
 * Only due-date items (vaccines, deworming, one-offs) carry over as overdue; a missed daily dose
 * from a previous day is simply missed, otherwise the overdue list would grow every day.
 */
export function buildAgenda(medicines: Medicine[], logs: DoseLog[], pets: Pet[], days = 7): Agenda {
  const t = today();
  const all = dosesBetween(medicines, logs, pets, addDays(t, -90), addDays(t, days));
  const endOfToday = addDays(t, 1);
  return {
    overdue: all.filter((d) => d.at < t && d.status === 'pending' && isDueDateItem(d.medicine)),
    today: all.filter((d) => d.at >= t && d.at < endOfToday),
    upcoming: all.filter((d) => d.at >= endOfToday),
  };
}

/** For a due-date item marked done, when is the next one due? */
export function nextDueAfter(m: Medicine, from: Date): string | null {
  switch (m.frequency) {
    case 'yearly':
      return isoOf(addMonths(from, 12));
    case 'monthly':
      return isoOf(addMonths(from, 1));
    case 'weekly':
      return isoOf(addDays(from, 7));
    default:
      // Deworming defaults to every 3 months; other one-offs end.
      return m.kind === 'deworming' ? isoOf(addMonths(from, 3)) : null;
  }
}

function isoOf(d: Date) {
  const y = d.getFullYear();
  return `${y}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Course progress: doses given so far versus the planned total. */
export function courseProgress(m: Medicine, logs: DoseLog[]) {
  const given = logs.filter((l) => l.medicine_id === m.id && l.status === 'done' && !l.deleted_at).length;
  return { given, total: m.total_doses ?? null };
}
