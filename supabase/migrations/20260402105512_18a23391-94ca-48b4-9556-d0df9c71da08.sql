
-- Fix 1: Remove the insecure "Direct admin access for buy_requests" policy that uses profiles.is_admin
DROP POLICY IF EXISTS "Direct admin access for buy_requests" ON public.buy_requests;

-- Fix 2: Harden the "Users can update own profile data" policy to prevent is_admin escalation
-- Drop and recreate with a WITH CHECK that explicitly prevents changing is_admin
DROP POLICY IF EXISTS "Users can update own profile data" ON public.profiles;

CREATE POLICY "Users can update own profile data"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND is_admin = (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid())
);

-- Fix 3: Set security_invoker on the view so queries run with caller's privileges
ALTER VIEW public.air_cargo_consignment_weights SET (security_invoker = true);
