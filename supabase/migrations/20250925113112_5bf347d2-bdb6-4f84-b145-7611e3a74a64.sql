-- Enable realtime for all request-related tables
ALTER TABLE public.buy_requests REPLICA IDENTITY FULL;
ALTER TABLE public.buy_request_items REPLICA IDENTITY FULL;
ALTER TABLE public.self_purchases REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- Add tables to the realtime publication so clients can subscribe to changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.buy_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.buy_request_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.self_purchases;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;