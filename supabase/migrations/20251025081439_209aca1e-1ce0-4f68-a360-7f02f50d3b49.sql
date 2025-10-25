-- Create purchase_tracker_items table for multiple items per purchase order
CREATE TABLE IF NOT EXISTS public.purchase_tracker_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID NOT NULL REFERENCES public.purchase_tracker(id) ON DELETE CASCADE,
  item_description TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  amount NUMERIC,
  store_name TEXT,
  store_order_no TEXT,
  source_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on purchase_tracker_items
ALTER TABLE public.purchase_tracker_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for purchase_tracker_items
CREATE POLICY "Admins can manage all purchase tracker items"
  ON public.purchase_tracker_items
  FOR ALL
  USING (is_admin());

CREATE POLICY "Deny public access to purchase_tracker_items"
  ON public.purchase_tracker_items
  FOR ALL
  USING (false);

-- Create trigger for timestamp updates
CREATE TRIGGER update_purchase_tracker_items_timestamp
  BEFORE UPDATE ON public.purchase_tracker_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_purchase_tracker_timestamp();

-- Migrate existing data from purchase_tracker to purchase_tracker_items
INSERT INTO public.purchase_tracker_items (
  purchase_id,
  item_description,
  qty,
  amount,
  store_name,
  store_order_no,
  source_link
)
SELECT 
  id,
  item_description,
  qty,
  amount,
  store_name,
  store_order_no,
  source_link
FROM public.purchase_tracker
WHERE item_description IS NOT NULL;

-- Remove item-specific columns from purchase_tracker (keep as comments for reference)
-- Note: We'll keep these columns for now to avoid breaking existing queries
-- They can be removed in a future migration once all code is updated
ALTER TABLE public.purchase_tracker 
  ALTER COLUMN item_description DROP NOT NULL,
  ALTER COLUMN qty DROP NOT NULL;

-- Add comment to indicate the table structure has changed
COMMENT ON TABLE public.purchase_tracker IS 'Parent table for purchase orders. Item details are now in purchase_tracker_items table.';