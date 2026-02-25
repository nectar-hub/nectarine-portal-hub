
-- Create order status enum
CREATE TYPE public.bfm_order_status AS ENUM (
  'DRAFT', 'SUBMITTED', 'AWAITING_PAYMENT', 'PAID', 'PURCHASED',
  'IN_TRANSIT', 'READY_FOR_PICKUP', 'DELIVERED', 'CANCELLED'
);

-- Create payment method enum
CREATE TYPE public.bfm_payment_method AS ENUM ('OFFLINE', 'DPO');

-- Create payment status enum
CREATE TYPE public.bfm_payment_status AS ENUM ('UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- Create provider payment status enum
CREATE TYPE public.bfm_provider_payment_status AS ENUM ('INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- ==========================================
-- Table: bfm_cart_items
-- ==========================================
CREATE TABLE public.bfm_cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  store_name TEXT,
  product_url TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_image_url TEXT,
  variant_color TEXT,
  variant_size TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(14,2),
  currency TEXT NOT NULL DEFAULT 'USD',
  estimated_tax NUMERIC(14,2) NOT NULL DEFAULT 0,
  estimated_shipping NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bfm_cart_items ENABLE ROW LEVEL SECURITY;

-- Users can manage their own cart items
CREATE POLICY "Users can view own cart items" ON public.bfm_cart_items
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own cart items" ON public.bfm_cart_items
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own cart items" ON public.bfm_cart_items
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own cart items" ON public.bfm_cart_items
  FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Deny public access to bfm_cart_items" ON public.bfm_cart_items
  FOR ALL USING (false);

-- ==========================================
-- Table: bfm_orders
-- ==========================================
CREATE TABLE public.bfm_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  status bfm_order_status NOT NULL DEFAULT 'DRAFT',
  payment_method bfm_payment_method NOT NULL DEFAULT 'OFFLINE',
  payment_status bfm_payment_status NOT NULL DEFAULT 'UNPAID',
  currency TEXT NOT NULL DEFAULT 'USD',
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_tax NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_shipping NUMERIC(14,2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bfm_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON public.bfm_orders
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own orders" ON public.bfm_orders
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own draft orders" ON public.bfm_orders
  FOR UPDATE USING (user_id = auth.uid() AND status = 'DRAFT');
CREATE POLICY "Admins can manage all bfm_orders" ON public.bfm_orders
  FOR ALL USING (is_admin());
CREATE POLICY "Deny public access to bfm_orders" ON public.bfm_orders
  FOR ALL USING (false);

-- ==========================================
-- Table: bfm_order_items
-- ==========================================
CREATE TABLE public.bfm_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.bfm_orders(id) ON DELETE CASCADE,
  store_name TEXT,
  product_url TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_image_url TEXT,
  variant_color TEXT,
  variant_size TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  tax NUMERIC(14,2) NOT NULL DEFAULT 0,
  shipping NUMERIC(14,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bfm_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items" ON public.bfm_order_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.bfm_orders WHERE bfm_orders.id = bfm_order_items.order_id AND bfm_orders.user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own order items" ON public.bfm_order_items
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.bfm_orders WHERE bfm_orders.id = bfm_order_items.order_id AND bfm_orders.user_id = auth.uid()
  ));
CREATE POLICY "Admins can manage all bfm_order_items" ON public.bfm_order_items
  FOR ALL USING (is_admin());
CREATE POLICY "Deny public access to bfm_order_items" ON public.bfm_order_items
  FOR ALL USING (false);

-- ==========================================
-- Table: bfm_payments
-- ==========================================
CREATE TABLE public.bfm_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.bfm_orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'OFFLINE',
  method bfm_payment_method NOT NULL DEFAULT 'OFFLINE',
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status bfm_provider_payment_status NOT NULL DEFAULT 'INITIATED',
  provider_reference TEXT,
  checkout_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bfm_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.bfm_payments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.bfm_orders WHERE bfm_orders.id = bfm_payments.order_id AND bfm_orders.user_id = auth.uid()
  ));
CREATE POLICY "Admins can manage all bfm_payments" ON public.bfm_payments
  FOR ALL USING (is_admin());
CREATE POLICY "Deny public access to bfm_payments" ON public.bfm_payments
  FOR ALL USING (false);

-- ==========================================
-- Auto-generate order numbers
-- ==========================================
CREATE OR REPLACE FUNCTION public.generate_bfm_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.order_number := 'BFM-' || to_char(now(), 'YYYYMMDD') || '-' || substr(NEW.id::text, 1, 8);
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_bfm_order_number
  BEFORE INSERT ON public.bfm_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_bfm_order_number();

-- ==========================================
-- Updated_at triggers
-- ==========================================
CREATE TRIGGER update_bfm_cart_items_updated_at
  BEFORE UPDATE ON public.bfm_cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_air_cargo_timestamp();

CREATE TRIGGER update_bfm_orders_updated_at
  BEFORE UPDATE ON public.bfm_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_air_cargo_timestamp();

CREATE TRIGGER update_bfm_payments_updated_at
  BEFORE UPDATE ON public.bfm_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_air_cargo_timestamp();
