
-- Table to store shipping rates per origin country
CREATE TABLE public.shipping_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL UNIQUE,
  country_name text NOT NULL,
  rate_per_kg numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read active rates
CREATE POLICY "Authenticated users can view shipping rates"
  ON public.shipping_rates FOR SELECT TO authenticated
  USING (true);

-- Admins can manage all rates
CREATE POLICY "Admins can manage shipping rates"
  ON public.shipping_rates FOR ALL TO authenticated
  USING (public.is_admin());

-- Deny anonymous access
CREATE POLICY "Deny public access to shipping_rates"
  ON public.shipping_rates FOR ALL TO anon
  USING (false);

-- Timestamp trigger
CREATE TRIGGER update_shipping_rates_timestamp
  BEFORE UPDATE ON public.shipping_rates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_air_cargo_timestamp();

-- Seed default data
INSERT INTO public.shipping_rates (country_code, country_name, rate_per_kg) VALUES
  ('US', 'United States', 12),
  ('UK', 'United Kingdom', 10),
  ('DE', 'Germany', 11),
  ('FR', 'France', 11),
  ('NL', 'Netherlands', 11),
  ('CN', 'China', 8),
  ('AE', 'Dubai (UAE)', 9),
  ('KR', 'South Korea', 13),
  ('HK', 'Hong Kong', 10),
  ('CA', 'Canada', 12);
