-- Create enum for regions
CREATE TYPE public.purchase_region AS ENUM ('UK', 'US', 'UAE', 'CN', 'EU', 'AU');

-- Create enum for purchase status
CREATE TYPE public.purchase_status AS ENUM (
  'PENDING',
  'ORDERED',
  'RECEIVED',
  'IN TRANSIT',
  'READY',
  'DELIVERED',
  'CANCELLED'
);

-- Create purchase_tracker table
CREATE TABLE public.purchase_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_date DATE NOT NULL,
  client_id UUID NOT NULL REFERENCES public.air_cargo_clients(id) ON DELETE RESTRICT,
  invoice_no TEXT,
  item_description TEXT NOT NULL,
  qty INTEGER NOT NULL CHECK (qty >= 1),
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.purchase_tracker ENABLE ROW LEVEL SECURITY;

-- Create policies (admin-only access)
CREATE POLICY "Admins can manage all purchases"
ON public.purchase_tracker
FOR ALL
USING (is_admin());

CREATE POLICY "Deny public access to purchase_tracker"
ON public.purchase_tracker
FOR ALL
USING (false);

-- Create indexes for better query performance
CREATE INDEX idx_purchase_tracker_client_id ON public.purchase_tracker(client_id);
CREATE INDEX idx_purchase_tracker_invoice_date ON public.purchase_tracker(invoice_date);
CREATE INDEX idx_purchase_tracker_status ON public.purchase_tracker(status);
CREATE INDEX idx_purchase_tracker_from_region ON public.purchase_tracker(from_region);

-- Create trigger for updated_at
CREATE TRIGGER update_purchase_tracker_timestamp
BEFORE UPDATE ON public.purchase_tracker
FOR EACH ROW
EXECUTE FUNCTION public.update_air_cargo_timestamp();

-- Create audit log table
CREATE TABLE public.purchase_tracker_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.purchase_tracker(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  old_data JSONB,
  new_data JSONB
);

-- Enable RLS on audit table
ALTER TABLE public.purchase_tracker_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
ON public.purchase_tracker_audit
FOR SELECT
USING (is_admin());

CREATE POLICY "Deny public access to purchase_tracker_audit"
ON public.purchase_tracker_audit
FOR ALL
USING (false);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_tracker;