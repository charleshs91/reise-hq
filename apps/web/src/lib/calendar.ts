/**
 * Plain date arithmetic for the range picker. Days are ISO `YYYY-MM-DD`,
 * months `YYYY-MM`; all maths runs in UTC so DST never shifts a day.
 */
const toUtc = (iso: string) => {
  const [y = 0, m = 1, d = 1] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function nights(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / 86_400_000);
}

export function addMonths(month: string, n: number): string {
  const [y = 0, m = 1] = month.split("-").map(Number);
  return fromUtc(Date.UTC(y, m - 1 + n, 1)).slice(0, 7);
}

/** A Monday-first grid of the month's days, padded with nulls to whole weeks. */
export function monthGrid(month: string): (string | null)[] {
  const first = toUtc(`${month}-01`);
  const lead = (new Date(first).getUTCDay() + 6) % 7;
  const days: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let ms = first; fromUtc(ms).startsWith(month); ms += 86_400_000) {
    days.push(fromUtc(ms));
  }
  while (days.length % 7) days.push(null);
  return days;
}

export type Range = { departure: string; return: string };

/**
 * First pick sets the departure; a later one completes the range. A pick on or
 * before the departure, or on a completed range, starts again — so the picker
 * can never express a return before its departure.
 */
export function pickDate(range: Range, day: string): Range & { done: boolean } {
  if (!range.departure || range.return || day <= range.departure) {
    return { departure: day, return: "", done: false };
  }
  return { departure: range.departure, return: day, done: true };
}
