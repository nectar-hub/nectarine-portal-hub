-- Remove overly broad authentication policies that bypass user-specific access controls
-- The existing policies already properly restrict access to owners and admins

DROP POLICY IF EXISTS "Require authentication for profiles access" ON public.profiles;
DROP POLICY IF EXISTS "Require authentication for air_cargo_clients access" ON public.air_cargo_clients;
DROP POLICY IF EXISTS "Require authentication for buy_requests access" ON public.buy_requests;
DROP POLICY IF EXISTS "Require authentication for buy_request_items access" ON public.buy_request_items;
DROP POLICY IF EXISTS "Require authentication for self_purchases access" ON public.self_purchases;
DROP POLICY IF EXISTS "Require authentication for orders access" ON public.orders;
DROP POLICY IF EXISTS "Require authentication for air_cargo_shipments access" ON public.air_cargo_shipments;
DROP POLICY IF EXISTS "Require authentication for air_cargo_consignments access" ON public.air_cargo_consignments;
DROP POLICY IF EXISTS "Require authentication for shipping_addresses access" ON public.shipping_addresses;
DROP POLICY IF EXISTS "Require authentication for user_shipping_addresses access" ON public.user_shipping_addresses;
DROP POLICY IF EXISTS "Require authentication for user_roles access" ON public.user_roles;