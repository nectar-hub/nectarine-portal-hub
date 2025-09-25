-- Fix the create_order function to have proper search_path
CREATE OR REPLACE FUNCTION public.create_order(_reference_id uuid, _user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  new_order_id UUID;
  order_type_value TEXT;
BEGIN
  -- Determine the order type based on where the reference_id comes from
  -- Instead of using recursive queries, check table existence directly
  IF EXISTS (SELECT 1 FROM public.buy_requests WHERE id = _reference_id) THEN
    order_type_value := 'buy_request';
  ELSIF EXISTS (SELECT 1 FROM public.self_purchases WHERE id = _reference_id) THEN
    order_type_value := 'self_purchase';
  ELSE
    RAISE EXCEPTION 'Invalid reference_id: %', _reference_id;
  END IF;

  -- Create the new order with the determined type
  INSERT INTO public.orders (reference_id, user_id, order_type)
  VALUES (_reference_id, _user_id, order_type_value)
  RETURNING id INTO new_order_id;

  RETURN new_order_id;
END;
$$;