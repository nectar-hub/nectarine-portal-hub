
ALTER TABLE public.shipping_rates
  ADD COLUMN currency_code text NOT NULL DEFAULT 'USD',
  ADD COLUMN currency_symbol text NOT NULL DEFAULT '$';

-- Update existing rows
UPDATE public.shipping_rates SET currency_code = 'GBP', currency_symbol = '£' WHERE country_code = 'UK';
UPDATE public.shipping_rates SET currency_code = 'EUR', currency_symbol = '€' WHERE country_code IN ('DE', 'FR', 'NL');
