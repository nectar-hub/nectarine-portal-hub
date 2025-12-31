-- Create currencies table
CREATE TABLE public.currencies (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  decimal_places INTEGER NOT NULL DEFAULT 2,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_base BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

-- Ensure only one base currency
CREATE UNIQUE INDEX currencies_single_base 
  ON public.currencies (is_base) 
  WHERE is_base = true;

-- Enable RLS
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for currencies
CREATE POLICY "Admins can manage all currencies" 
  ON public.currencies FOR ALL USING (is_admin());

CREATE POLICY "Deny public access to currencies" 
  ON public.currencies FOR ALL USING (false);

-- Seed initial currencies
INSERT INTO public.currencies (code, name, symbol, is_active, is_base) VALUES
  ('USD', 'US Dollar', '$', true, true),
  ('TZS', 'Tanzanian Shilling', 'TSh', true, false),
  ('EUR', 'Euro', '€', true, false),
  ('GBP', 'British Pound', '£', true, false),
  ('AED', 'UAE Dirham', 'AED', true, false),
  ('CNY', 'Chinese Yuan', '¥', true, false),
  ('AUD', 'Australian Dollar', 'A$', true, false);

-- Create exchange_rates table
CREATE TABLE public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT NOT NULL REFERENCES public.currencies(code) ON DELETE RESTRICT,
  quote_currency TEXT NOT NULL REFERENCES public.currencies(code) ON DELETE RESTRICT,
  rate NUMERIC(18,6) NOT NULL,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  source TEXT DEFAULT 'manual',
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  
  -- Prevent self-referencing rates
  CONSTRAINT different_currencies CHECK (base_currency <> quote_currency),
  
  -- Ensure rate is positive
  CONSTRAINT positive_rate CHECK (rate > 0)
);

-- Index for efficient rate lookups
CREATE INDEX idx_exchange_rates_lookup 
  ON public.exchange_rates (base_currency, quote_currency, effective_from, is_active);

-- Enable RLS
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exchange_rates
CREATE POLICY "Admins can manage all exchange rates" 
  ON public.exchange_rates FOR ALL USING (is_admin());

CREATE POLICY "Deny public access to exchange_rates" 
  ON public.exchange_rates FOR ALL USING (false);

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION public.update_currency_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_currencies_timestamp
  BEFORE UPDATE ON public.currencies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_currency_timestamp();

CREATE TRIGGER update_exchange_rates_timestamp
  BEFORE UPDATE ON public.exchange_rates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_currency_timestamp();

-- Function to get exchange rate for a specific date
CREATE OR REPLACE FUNCTION public.get_exchange_rate(
  p_base_currency TEXT,
  p_quote_currency TEXT,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate NUMERIC;
  v_system_base TEXT;
BEGIN
  -- Same currency = 1
  IF p_base_currency = p_quote_currency THEN
    RETURN 1;
  END IF;

  -- Direct rate lookup
  SELECT rate INTO v_rate
  FROM exchange_rates
  WHERE base_currency = p_base_currency
    AND quote_currency = p_quote_currency
    AND effective_from <= p_date
    AND (effective_to IS NULL OR effective_to >= p_date)
    AND is_active = true
  ORDER BY effective_from DESC
  LIMIT 1;

  IF v_rate IS NOT NULL THEN
    RETURN v_rate;
  END IF;

  -- Try inverse rate
  SELECT 1.0 / rate INTO v_rate
  FROM exchange_rates
  WHERE base_currency = p_quote_currency
    AND quote_currency = p_base_currency
    AND effective_from <= p_date
    AND (effective_to IS NULL OR effective_to >= p_date)
    AND is_active = true
  ORDER BY effective_from DESC
  LIMIT 1;

  IF v_rate IS NOT NULL THEN
    RETURN v_rate;
  END IF;

  -- Try via system base currency
  SELECT code INTO v_system_base FROM currencies WHERE is_base = true LIMIT 1;
  
  IF v_system_base IS NOT NULL AND v_system_base <> p_base_currency AND v_system_base <> p_quote_currency THEN
    DECLARE
      v_rate_to_base NUMERIC;
      v_rate_from_base NUMERIC;
    BEGIN
      -- Get rate from p_base_currency to system base
      v_rate_to_base := get_exchange_rate(p_base_currency, v_system_base, p_date);
      -- Get rate from system base to p_quote_currency
      v_rate_from_base := get_exchange_rate(v_system_base, p_quote_currency, p_date);
      
      IF v_rate_to_base IS NOT NULL AND v_rate_from_base IS NOT NULL THEN
        RETURN v_rate_to_base * v_rate_from_base;
      END IF;
    END;
  END IF;

  RETURN NULL; -- No rate found
END;
$$;