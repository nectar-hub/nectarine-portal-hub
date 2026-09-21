// Extract a sortable date from a consignment title such as
// "14&21 AUGUST 2026| UK CARGO", "#7TH SEPTEMBER 2026 | USA CARGO", "11-18 JUNE 2026| UK CARGO"
const MONTHS: Record<string, number> = {
  JANUARY: 0, JAN: 0,
  FEBRUARY: 1, FEB: 1,
  MARCH: 2, MAR: 2,
  APRIL: 3, APR: 3,
  MAY: 4,
  JUNE: 5, JUN: 5,
  JULY: 6, JUL: 6,
  AUGUST: 7, AUG: 7,
  SEPTEMBER: 8, SEP: 8, SEPT: 8,
  OCTOBER: 9, OCT: 9,
  NOVEMBER: 10, NOV: 10,
  DECEMBER: 11, DEC: 11,
};

/**
 * Returns a timestamp parsed from the consignment title (month/year first, then day),
 * or null when no month/year could be found.
 */
export const parseConsignmentTitleDate = (name?: string | null): number | null => {
  if (!name) return null;
  const upper = name.toUpperCase();

  const monthNames = Object.keys(MONTHS).join('|');
  const match = upper.match(new RegExp(`\\b(${monthNames})\\b[^0-9]*(\\d{4})`));
  if (!match) return null;

  const month = MONTHS[match[1]];
  const year = Number(match[2]);

  // Day: last number appearing before the month word (handles "14&21", "11-18", "7TH")
  const beforeMonth = upper.slice(0, match.index ?? 0);
  const dayMatches = beforeMonth.match(/\d{1,2}/g);
  const day = dayMatches ? Number(dayMatches[dayMatches.length - 1]) : 1;

  return new Date(year, month, day >= 1 && day <= 31 ? day : 1).getTime();
};

/** Sort comparator: oldest title date first; untitled/unparsable entries last. */
export const compareConsignmentTitlesAsc = (a?: string | null, b?: string | null): number => {
  const da = parseConsignmentTitleDate(a);
  const db = parseConsignmentTitleDate(b);
  if (da === null && db === null) return (a || '').localeCompare(b || '');
  if (da === null) return 1;
  if (db === null) return -1;
  if (da !== db) return da - db;
  return (a || '').localeCompare(b || '');
};
