-- Enable Row Level Security on buy_request_items table
ALTER TABLE public.buy_request_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for buy_request_items table
-- Users can view buy request items for their own buy requests
CREATE POLICY "Users can view their own buy request items" 
ON public.buy_request_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.buy_requests 
    WHERE buy_requests.id = buy_request_items.buy_request_id 
    AND buy_requests.user_id = auth.uid()
  )
);

-- Users can insert buy request items for their own buy requests
CREATE POLICY "Users can insert their own buy request items" 
ON public.buy_request_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.buy_requests 
    WHERE buy_requests.id = buy_request_items.buy_request_id 
    AND buy_requests.user_id = auth.uid()
  )
);

-- Users can update buy request items for their own buy requests (only pending ones)
CREATE POLICY "Users can update their own buy request items" 
ON public.buy_request_items 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.buy_requests 
    WHERE buy_requests.id = buy_request_items.buy_request_id 
    AND buy_requests.user_id = auth.uid()
    AND buy_requests.status = 'pending'
  )
);

-- Users can delete buy request items for their own buy requests (only pending ones)
CREATE POLICY "Users can delete their own buy request items" 
ON public.buy_request_items 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.buy_requests 
    WHERE buy_requests.id = buy_request_items.buy_request_id 
    AND buy_requests.user_id = auth.uid()
    AND buy_requests.status = 'pending'
  )
);

-- Admins can manage all buy request items
CREATE POLICY "Admins can manage all buy request items" 
ON public.buy_request_items 
FOR ALL 
USING (is_admin());