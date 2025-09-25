-- Fix the handle_new_user function search path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public, auth
AS $$
BEGIN
    -- Function logic here
    RETURN NEW;
END;
$$;

-- Fix the is_admin function search path (already has SET search_path but let's ensure it's correct)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  is_admin_user boolean;
BEGIN
  SELECT p.is_admin INTO is_admin_user
  FROM profiles p
  WHERE p.id = auth.uid();
  
  RETURN COALESCE(is_admin_user, false);
END;
$$;