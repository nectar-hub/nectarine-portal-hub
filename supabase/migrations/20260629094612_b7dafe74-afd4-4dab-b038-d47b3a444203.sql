
-- 1) Prevent privilege escalation via profiles.is_admin
CREATE OR REPLACE FUNCTION public.prevent_profile_admin_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_admin IS DISTINCT FROM false AND NOT public.is_superadmin() THEN
      RAISE EXCEPTION 'Only superadmins can set is_admin';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.is_admin IS DISTINCT FROM OLD.is_admin AND NOT public.is_superadmin() THEN
      RAISE EXCEPTION 'Only superadmins can change is_admin';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_admin_escalation_trg ON public.profiles;
CREATE TRIGGER prevent_profile_admin_escalation_trg
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_admin_escalation();

-- 2) Restrict user_roles management to superadmins only
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Only superadmins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- 3) create_order: enforce caller identity
CREATE OR REPLACE FUNCTION public.create_order(_reference_id uuid, _user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  new_order_id UUID;
  order_type_value TEXT;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF EXISTS (SELECT 1 FROM public.buy_requests WHERE id = _reference_id) THEN
    order_type_value := 'buy_request';
  ELSIF EXISTS (SELECT 1 FROM public.self_purchases WHERE id = _reference_id) THEN
    order_type_value := 'self_purchase';
  ELSE
    RAISE EXCEPTION 'Invalid reference_id: %', _reference_id;
  END IF;

  INSERT INTO public.orders (reference_id, user_id, order_type)
  VALUES (_reference_id, _user_id, order_type_value)
  RETURNING id INTO new_order_id;

  RETURN new_order_id;
END;
$function$;

-- 4) Storage policy: use role-system is_admin() instead of profiles.is_admin column
DROP POLICY IF EXISTS "Admins can view all screenshots" ON storage.objects;
CREATE POLICY "Admins can view all screenshots"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'buy-request-screenshots' AND public.is_admin());

-- 5) Revoke EXECUTE on trigger/internal SECURITY DEFINER functions from public roles
REVOKE EXECUTE ON FUNCTION public.update_purchase_tracker_timestamp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_air_cargo_timestamp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_real_time_timestamp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_currency_timestamp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_assign_shipping_addresses() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_purchase_tracker_changes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_bfm_order_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_admin_escalation() FROM PUBLIC, anon, authenticated;
