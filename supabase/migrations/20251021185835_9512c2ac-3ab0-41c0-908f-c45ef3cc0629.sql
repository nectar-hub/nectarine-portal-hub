-- Add explicit DENY policies for anonymous access to all sensitive tables
-- This ensures unauthenticated users cannot access any data

-- Profiles table
CREATE POLICY "Deny public access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false);

-- Air cargo tables
CREATE POLICY "Deny public access to air_cargo_clients"
ON public.air_cargo_clients
FOR ALL
TO anon
USING (false);

CREATE POLICY "Deny public access to air_cargo_shipments"
ON public.air_cargo_shipments
FOR ALL
TO anon
USING (false);

CREATE POLICY "Deny public access to air_cargo_consignments"
ON public.air_cargo_consignments
FOR ALL
TO anon
USING (false);

-- Purchase and order tables
CREATE POLICY "Deny public access to buy_requests"
ON public.buy_requests
FOR ALL
TO anon
USING (false);

CREATE POLICY "Deny public access to buy_request_items"
ON public.buy_request_items
FOR ALL
TO anon
USING (false);

CREATE POLICY "Deny public access to self_purchases"
ON public.self_purchases
FOR ALL
TO anon
USING (false);

CREATE POLICY "Deny public access to orders"
ON public.orders
FOR ALL
TO anon
USING (false);

-- Address tables
CREATE POLICY "Deny public access to shipping_addresses"
ON public.shipping_addresses
FOR ALL
TO anon
USING (false);

CREATE POLICY "Deny public access to user_shipping_addresses"
ON public.user_shipping_addresses
FOR ALL
TO anon
USING (false);

-- User roles
CREATE POLICY "Deny public access to user_roles"
ON public.user_roles
FOR ALL
TO anon
USING (false);