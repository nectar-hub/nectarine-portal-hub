-- Temporarily add a direct admin policy that doesn't rely on the is_admin() function
-- This will help us debug the issue

CREATE POLICY "Direct admin access for buy_requests" 
ON public.buy_requests 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Also update the is_admin function with debugging
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  current_user_id uuid;
  is_admin_user boolean;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- If no authenticated user, return false
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get the current user's admin status
  SELECT COALESCE(p.is_admin, false) INTO is_admin_user
  FROM profiles p
  WHERE p.id = current_user_id;
  
  -- Return admin status
  RETURN COALESCE(is_admin_user, false);
END;
$$;