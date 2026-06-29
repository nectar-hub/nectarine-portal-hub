
-- 1. Restrict SELECT on air_cargo_* tables to admins only
DROP POLICY IF EXISTS "Admins only can select air_cargo_clients" ON public.air_cargo_clients;
CREATE POLICY "Admins only can select air_cargo_clients"
  ON public.air_cargo_clients AS RESTRICTIVE FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins only can select air_cargo_shipments" ON public.air_cargo_shipments;
CREATE POLICY "Admins only can select air_cargo_shipments"
  ON public.air_cargo_shipments AS RESTRICTIVE FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins only can select air_cargo_consignments" ON public.air_cargo_consignments;
CREATE POLICY "Admins only can select air_cargo_consignments"
  ON public.air_cargo_consignments AS RESTRICTIVE FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 2. Profiles: prevent privilege escalation via overlapping permissive UPDATE policies
DROP POLICY IF EXISTS "Admins can modify admin status" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. SECURITY DEFINER function exposure
-- Trigger-only functions: no execute grants needed
REVOKE ALL ON FUNCTION public.update_purchase_tracker_timestamp() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_currency_timestamp() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_bfm_order_number() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.auto_assign_shipping_addresses() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_purchase_tracker_changes() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_air_cargo_timestamp() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_real_time_timestamp() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Helper/business functions: restrict to authenticated only (revoke anon)
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

REVOKE ALL ON FUNCTION public.is_superadmin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated;

REVOKE ALL ON FUNCTION public.get_exchange_rate(text, text, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_exchange_rate(text, text, date) TO authenticated;

REVOKE ALL ON FUNCTION public.create_order(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_order(uuid, uuid) TO authenticated;
