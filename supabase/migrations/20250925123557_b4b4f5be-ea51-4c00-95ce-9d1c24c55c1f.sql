-- Add admin notes and action tracking to self_purchases table
ALTER TABLE public.self_purchases 
ADD COLUMN admin_notes TEXT,
ADD COLUMN status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN status_updated_by UUID REFERENCES auth.users(id);

-- Create trigger to automatically update status_updated_at when status changes
CREATE OR REPLACE FUNCTION public.update_self_purchase_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update the timestamp if the status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_updated_at = now();
    NEW.status_updated_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates on status change
CREATE TRIGGER update_self_purchase_status_timestamp
  BEFORE UPDATE ON public.self_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_self_purchase_status_timestamp();