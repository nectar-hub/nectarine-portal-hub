export function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  const n = parseFloat(String(value).replace(/,/g, ''));
  return Number.isFinite(n) ? n : fallback;
}
