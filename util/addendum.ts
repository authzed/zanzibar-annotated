/**
 * Addendum is a later addition to an annotation, shown after it.
 */
export type Addendum = {
  // The day the addendum was written, as YYYY-MM-DD.
  date: string;
  author?: string;
  content: string;
};

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * formatAddendumDate formats the day an addendum was written for display, e.g.
 * `Nov 12, 2026`. The day is formatted as written, without regard to time
 * zones, so that the server and the browser agree on it.
 */
export function formatAddendumDate(date: string | Date): string {
  // A day that was written without quotes is read from YAML as a date, at
  // midnight UTC.
  if (date instanceof Date) {
    date = date.toISOString().slice(0, 10);
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const month = match ? MONTHS[Number(match[2]) - 1] : undefined;
  if (!match || !month) {
    return date;
  }
  return `${month} ${Number(match[3])}, ${match[1]}`;
}

/**
 * addendumLabel returns the heading shown above an addendum.
 */
export function addendumLabel(addendum: Addendum): string {
  return ['Addendum', formatAddendumDate(addendum.date), addendum.author]
    .filter(Boolean)
    .join(' · ');
}
