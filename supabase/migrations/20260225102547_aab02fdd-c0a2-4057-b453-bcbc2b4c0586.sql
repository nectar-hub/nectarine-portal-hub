-- Add regulatory fees column to bfm_cart_items
ALTER TABLE public.bfm_cart_items 
ADD COLUMN estimated_regulatory_fees numeric NOT NULL DEFAULT 0;

-- Add regulatory fees column to bfm_order_items
ALTER TABLE public.bfm_order_items 
ADD COLUMN regulatory_fees numeric NOT NULL DEFAULT 0;