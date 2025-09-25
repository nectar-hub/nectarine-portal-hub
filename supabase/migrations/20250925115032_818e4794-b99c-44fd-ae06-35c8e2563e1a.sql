-- Fix the is_admin function to properly check admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  is_admin_user boolean;
BEGIN
  -- Get the current user's admin status
  SELECT COALESCE(p.is_admin, false) INTO is_admin_user
  FROM profiles p
  WHERE p.id = auth.uid();
  
  -- Return false if no profile found or not admin
  RETURN COALESCE(is_admin_user, false);
END;
$$;