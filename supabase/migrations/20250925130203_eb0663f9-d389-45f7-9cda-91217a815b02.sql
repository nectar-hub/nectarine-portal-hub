-- Add INSERT policy for profiles table to allow users to create their own profile
-- This fixes the security issue where no INSERT policies existed, preventing legitimate user registration
-- while ensuring users cannot create profiles for others or set admin privileges

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  auth.uid() = id AND 
  is_admin = false
);

-- Also ensure we have a proper trigger to handle new user profile creation
-- Update the existing handle_new_user function to work with our profile structure
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'fullName',
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;