
-- Enable Row Level Security on buy_requests table
ALTER TABLE public.buy_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own buy requests
CREATE POLICY "Users can view their own buy_requests" 
ON public.buy_requests 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own buy requests
CREATE POLICY "Users can insert their own buy_requests" 
ON public.buy_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admins can view all buy requests
CREATE POLICY "Admins can view all buy_requests" 
ON public.buy_requests 
FOR SELECT 
USING (is_admin());

-- Admins can update all buy requests
CREATE POLICY "Admins can update all buy_requests" 
ON public.buy_requests 
FOR UPDATE 
USING (is_admin());

-- Enable Row Level Security on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own orders
CREATE POLICY "Users can insert their own orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admins can view all orders
CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR SELECT 
USING (is_admin());

-- Admins can update all orders
CREATE POLICY "Admins can update all orders" 
ON public.orders 
FOR UPDATE 
USING (is_admin());

-- Enable Row Level Security on self_purchases table
ALTER TABLE public.self_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own self purchases
CREATE POLICY "Users can view their own self_purchases" 
ON public.self_purchases 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own self purchases
CREATE POLICY "Users can insert their own self_purchases" 
ON public.self_purchases 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own self purchases
CREATE POLICY "Users can update their own self_purchases" 
ON public.self_purchases 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Admins can view all self purchases
CREATE POLICY "Admins can view all self_purchases" 
ON public.self_purchases 
FOR SELECT 
USING (is_admin());

-- Admins can update all self purchases
CREATE POLICY "Admins can update all self_purchases" 
ON public.self_purchases 
FOR UPDATE 
USING (is_admin());
