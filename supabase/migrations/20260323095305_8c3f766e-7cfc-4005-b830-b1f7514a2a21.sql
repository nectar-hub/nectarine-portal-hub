
-- Add auto-assign flag to shipping_addresses
ALTER TABLE public.shipping_addresses 
ADD COLUMN auto_assign_new_users boolean NOT NULL DEFAULT false;

-- Create a trigger function to auto-assign new users to addresses with auto_assign_new_users = true
CREATE OR REPLACE FUNCTION public.auto_assign_shipping_addresses()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_shipping_addresses (user_id, address_id)
  SELECT NEW.id, sa.id
  FROM public.shipping_addresses sa
  WHERE sa.auto_assign_new_users = true
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger on profiles (new user signup)
CREATE TRIGGER trg_auto_assign_shipping_on_new_user
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_shipping_addresses();
