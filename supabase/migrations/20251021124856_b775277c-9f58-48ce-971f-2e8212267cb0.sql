-- Fix security issues: Block anonymous access to sensitive tables

-- 1. Fix profiles table - Deny anonymous access to personal information
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- 2. Fix air_cargo_clients - Require authentication for client data
CREATE POLICY "Require authentication for air_cargo_clients"
ON public.air_cargo_clients
FOR SELECT
TO anon
USING (false);

-- 3. Fix buy_requests - Block anonymous access to purchase requests
CREATE POLICY "Block anonymous access to buy_requests"
ON public.buy_requests
FOR SELECT
TO anon
USING (false);

-- 4. Fix buy_request_items - Block anonymous access to purchase items
CREATE POLICY "Block anonymous access to buy_request_items"
ON public.buy_request_items
FOR SELECT
TO anon
USING (false);

-- 5. Fix self_purchases - Block anonymous access to self purchases
CREATE POLICY "Block anonymous access to self_purchases"
ON public.self_purchases
FOR SELECT
TO anon
USING (false);

-- 6. Fix orders - Block anonymous access to orders
CREATE POLICY "Block anonymous access to orders"
ON public.orders
FOR SELECT
TO anon
USING (false);

-- 7. Fix air_cargo_shipments - Block anonymous access
CREATE POLICY "Block anonymous access to air_cargo_shipments"
ON public.air_cargo_shipments
FOR SELECT
TO anon
USING (false);

-- 8. Fix air_cargo_consignments - Block anonymous access
CREATE POLICY "Block anonymous access to air_cargo_consignments"
ON public.air_cargo_consignments
FOR SELECT
TO anon
USING (false);

-- 9. Fix shipping_addresses - Block anonymous access to addresses
CREATE POLICY "Block anonymous access to shipping_addresses"
ON public.shipping_addresses
FOR SELECT
TO anon
USING (false);

-- 10. Fix user_shipping_addresses - Block anonymous access
CREATE POLICY "Block anonymous access to user_shipping_addresses"
ON public.user_shipping_addresses
FOR SELECT
TO anon
USING (false);

-- 11. Fix user_roles - Block anonymous access to roles
CREATE POLICY "Block anonymous access to user_roles"
ON public.user_roles
FOR SELECT
TO anon
USING (false);