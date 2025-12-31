export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimal_places: number;
  is_active: boolean;
  is_base: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ExchangeRate {
  id: string;
  base_currency: string;
  quote_currency: string;
  rate: number;
  effective_from: string;
  effective_to: string | null;
  source: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ConversionResult {
  original_amount: number;
  original_currency: string;
  converted_amount: number;
  target_currency: string;
  rate_used: number;
  rate_date: string;
  base_equivalent: number | null;
  base_currency: string;
}

export type CurrencyCode = 'USD' | 'TZS' | 'EUR' | 'GBP' | 'AED' | 'CNY' | 'AUD';

export interface CurrencyFormData {
  code: string;
  name: string;
  symbol: string;
  decimal_places: number;
  is_active: boolean;
}

export interface ExchangeRateFormData {
  base_currency: string;
  quote_currency: string;
  rate: number;
  effective_from: Date;
  effective_to: Date | null;
  source: string;
  notes: string;
  is_active: boolean;
}
