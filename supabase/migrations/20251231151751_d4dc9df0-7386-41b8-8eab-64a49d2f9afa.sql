-- Create a function to check if user is superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(auth.uid(), 'superadmin'::app_role)
$$;

-- Update RLS policies for production_costs to only allow superadmin
DROP POLICY IF EXISTS "Admins can manage all production costs" ON public.production_costs;
CREATE POLICY "Superadmins can manage all production costs" 
ON public.production_costs 
FOR ALL 
USING (is_superadmin());

-- Update RLS policies for currencies to only allow superadmin
DROP POLICY IF EXISTS "Admins can manage all currencies" ON public.currencies;
CREATE POLICY "Superadmins can manage all currencies" 
ON public.currencies 
FOR ALL 
USING (is_superadmin());

-- Update RLS policies for exchange_rates to only allow superadmin
DROP POLICY IF EXISTS "Admins can manage all exchange rates" ON public.exchange_rates;
CREATE POLICY "Superadmins can manage all exchange rates" 
ON public.exchange_rates 
FOR ALL 
USING (is_superadmin());