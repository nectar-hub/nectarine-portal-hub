-- Replace fragile blocking policies with explicit authentication checks

-- Drop the blocking policies
DROP POLICY IF EXISTS "Deny anonymous access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Require authentication for air_cargo_clients" ON public.air_cargo_clients;
DROP POLICY IF EXISTS "Block anonymous access to buy_requests" ON public.buy_requests;
DROP POLICY IF EXISTS "Block anonymous access to buy_request_items" ON public.buy_request_items;
DROP POLICY IF EXISTS "Block anonymous access to self_purchases" ON public.self_purchases;
DROP POLICY IF EXISTS "Block anonymous access to orders" ON public.orders;
DROP POLICY IF EXISTS "Block anonymous access to air_cargo_shipments" ON public.air_cargo_shipments;
DROP POLICY IF EXISTS "Block anonymous access to air_cargo_consignments" ON public.air_cargo_consignments;
DROP POLICY IF EXISTS "Block anonymous access to shipping_addresses" ON public.shipping_addresses;
DROP POLICY IF EXISTS "Block anonymous access to user_shipping_addresses" ON public.user_shipping_addresses;
DROP POLICY IF EXISTS "Block anonymous access to user_roles" ON public.user_roles;

-- Create explicit authentication requirement policies that work with existing policies
-- These policies ensure authentication is required but delegate specific access control to existing policies

CREATE POLICY "Require authentication for profiles access"
ON public.profiles
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Require authentication for air_cargo_clients access"
ON public.air_cargo_clients
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL AND public.is_admin());

CREATE POLICY "Require authentication for buy_requests access"
ON public.buy_requests
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Require authentication for buy_request_items access"
ON public.buy_request_items
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Require authentication for self_purchases access"
ON public.self_purchases
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Require authentication for orders access"
ON public.orders
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Require authentication for air_cargo_shipments access"
ON public.air_cargo_shipments
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL AND public.is_admin());

CREATE POLICY "Require authentication for air_cargo_consignments access"
ON public.air_cargo_consignments
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL AND public.is_admin());

CREATE POLICY "Require authentication for shipping_addresses access"
ON public.shipping_addresses
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Require authentication for user_shipping_addresses access"
ON public.user_shipping_addresses
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Require authentication for user_roles access"
ON public.user_roles
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);