import { Currency } from '@/types/currency';

/**
 * Format an amount with the currency symbol
 */
export function formatCurrency(
  amount: number,
  currency: Currency | { symbol: string; decimal_places?: number },
  options?: { showSymbol?: boolean }
): string {
  const { showSymbol = true } = options || {};
  const decimalPlaces = currency.decimal_places ?? 2;
  
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });

  return showSymbol ? `${currency.symbol}${formatted}` : formatted;
}

/**
 * Format an amount with currency code
 */
export function formatCurrencyWithCode(
  amount: number,
  currencyCode: string,
  decimalPlaces: number = 2
): string {
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });

  return `${formatted} ${currencyCode}`;
}

/**
 * Get currency symbol by code
 */
export function getCurrencySymbol(code: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    TZS: 'TSh',
    EUR: '€',
    GBP: '£',
    AED: 'AED',
    CNY: '¥',
    AUD: 'A$',
  };

  return symbols[code] || code;
}

/**
 * Parse a currency string to number
 */
export function parseCurrencyString(value: string): number {
  // Remove all non-numeric characters except decimal point and minus
  const cleaned = value.replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Format rate with appropriate decimal places
 */
export function formatRate(rate: number): string {
  // Show more decimal places for rates close to 1
  const decimalPlaces = rate >= 1 && rate < 100 ? 4 : rate >= 100 ? 2 : 6;
  
  return rate.toLocaleString('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
}
