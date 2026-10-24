// Small date helpers. Dates are stored as local calendar days in YYYY-MM-DD form.

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISODate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

export function isValidISODate(s: string): boolean {
  const d = parseISODate(s);
  return !!d && toISODate(d) === s.slice(0, 10);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  r.setDate(r.getDate() + n);
  return r;
}

export function addMonths(d: Date, n: number): Date {
  const r = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
  r.setDate(Math.min(d.getDate(), last));
  return r;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);
}

export const today = () => startOfDay(new Date());

export function localeTag(lang: string) {
  return lang === 'bn' ? 'bn-BD' : 'en-GB';
}

export function formatDate(s: string | Date | null | undefined, lang = 'en'): string {
  const d = typeof s === 'string' ? parseISODate(s) : (s ?? null);
  if (!d) return '';
  return d.toLocaleDateString(localeTag(lang), { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(d: Date, lang = 'en'): string {
  return d.toLocaleTimeString(localeTag(lang), { hour: 'numeric', minute: '2-digit' });
}

export function formatNumber(n: number, lang = 'en', digits = 1): string {
  return n.toLocaleString(localeTag(lang), { maximumFractionDigits: digits });
}

/** Age as whole years and months, e.g. { years: 2, months: 3 }. */
export function ageParts(birth: string | null): { years: number; months: number } | null {
  const b = parseISODate(birth);
  if (!b) return null;
  const n = new Date();
  let months = (n.getFullYear() - b.getFullYear()) * 12 + (n.getMonth() - b.getMonth());
  if (n.getDate() < b.getDate()) months -= 1;
  if (months < 0) return null;
  return { years: Math.floor(months / 12), months: months % 12 };
}
