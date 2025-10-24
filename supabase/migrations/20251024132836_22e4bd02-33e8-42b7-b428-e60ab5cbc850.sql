-- Create enums for Purchase Tracker
CREATE TYPE public.purchase_region AS ENUM ('UK', 'US', 'UAE', 'CN', 'EU', 'AU');
CREATE TYPE public.purchase_status AS ENUM ('PENDING', 'ORDERED', 'RECEIVED', 'IN_TRANSIT', 'READY', 'DELIVERED', 'CANCELLED');

-- Create purchase_tracker table
CREATE TABLE public.purchase_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_date DATE NOT NULL,
  client_id UUID NOT NULL REFERENCES public.air_cargo_clients(id) ON DELETE RESTRICT,
  invoice_no TEXT,
  item_description TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  from_region purchase_region NOT NULL,
  store_name TEXT,
  amount NUMERIC(14,2),
  dop DATE,
  store_order_no TEXT,
  purchased_by TEXT,
  dod DATE,
  status purchase_status NOT NULL DEFAULT 'PENDING',
  remarks TEXT,
  source_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  CONSTRAINT qty_positive CHECK (qty >= 1)
);

-- Create audit table
CREATE TABLE public.purchase_tracker_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.purchase_tracker(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  old_data JSONB,
  new_data JSONB
);

-- Enable RLS
ALTER TABLE public.purchase_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_tracker_audit ENABLE ROW LEVEL SECURITY;

-- Deny public access
CREATE POLICY "Deny public access to purchase_tracker"
ON public.purchase_tracker
FOR ALL
USING (false);

CREATE POLICY "Deny public access to purchase_tracker_audit"
ON public.purchase_tracker_audit
FOR ALL
USING (false);

-- Admin-only policies
CREATE POLICY "Admins can manage all purchase tracker records"
ON public.purchase_tracker
FOR ALL
USING (public.is_admin());

CREATE POLICY "Admins can view audit trail"
ON public.purchase_tracker_audit
FOR SELECT
USING (public.is_admin());

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_purchase_tracker_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_purchase_tracker_updated_at
BEFORE UPDATE ON public.purchase_tracker
FOR EACH ROW
EXECUTE FUNCTION public.update_purchase_tracker_timestamp();

-- Trigger to log changes
CREATE OR REPLACE FUNCTION public.log_purchase_tracker_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.purchase_tracker_audit (purchase_id, action, changed_by, new_data)
    VALUES (NEW.id, 'INSERT', auth.uid(), to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.purchase_tracker_audit (purchase_id, action, changed_by, old_data, new_data)
    VALUES (NEW.id, 'UPDATE', auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.purchase_tracker_audit (purchase_id, action, changed_by, old_data)
    VALUES (OLD.id, 'DELETE', auth.uid(), to_jsonb(OLD));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER log_purchase_tracker_changes
AFTER INSERT OR UPDATE OR DELETE ON public.purchase_tracker
FOR EACH ROW
EXECUTE FUNCTION public.log_purchase_tracker_changes();

-- Create indexes
CREATE INDEX idx_purchase_tracker_client_id ON public.purchase_tracker(client_id);
CREATE INDEX idx_purchase_tracker_invoice_date ON public.purchase_tracker(invoice_date);
CREATE INDEX idx_purchase_tracker_status ON public.purchase_tracker(status);
CREATE INDEX idx_purchase_tracker_from_region ON public.purchase_tracker(from_region);