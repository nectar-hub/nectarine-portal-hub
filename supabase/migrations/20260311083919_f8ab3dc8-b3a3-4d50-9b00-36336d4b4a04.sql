-- Allow all authenticated users to READ currencies
CREATE POLICY "Authenticated users can view currencies"
ON public.currencies
FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to READ exchange_rates
CREATE POLICY "Authenticated users can view exchange rates"
ON public.exchange_rates
FOR SELECT
TO authenticated
USING (true);
