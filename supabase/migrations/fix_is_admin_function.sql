
-- Fix the is_admin function to properly return a boolean
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  is_admin_user boolean;
BEGIN
  SET search_path TO public, auth;
  
  SELECT p.is_admin INTO is_admin_user
  FROM profiles p
  WHERE p.id = auth.uid();
  
  RETURN COALESCE(is_admin_user, false);
END;
$$;
