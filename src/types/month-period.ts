export type MonthPeriodStatus = 'OPEN' | 'CLOSED';

export interface MonthPeriod {
  id: string;
  month: number;
  year: number;
  status: MonthPeriodStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;

export const getMonthName = (month: number): string => {
  return MONTH_NAMES[month - 1] || 'Unknown';
};

export const getMonthLabel = (period: MonthPeriod): string => {
  return `${getMonthName(period.month)} ${period.year}`;
};
