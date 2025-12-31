-- Create payment account enum for REAL TIME entries
CREATE TYPE public.payment_account AS ENUM (
  'CASH',
  'NMB_CARD',
  'MPESA_271',
  'CRDB',
  'CRDB_USD'
);

-- Create real_time_days table (one record per operational day)
CREATE TABLE public.real_time_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  op_date DATE NOT NULL UNIQUE,
  notes TEXT,
  opening_cash NUMERIC NOT NULL DEFAULT 0,
  opening_nmb_card NUMERIC NOT NULL DEFAULT 0,
  opening_mpesa_271 NUMERIC NOT NULL DEFAULT 0,
  opening_crdb NUMERIC NOT NULL DEFAULT 0,
  opening_crdb_usd NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create real_time_entries table (transactions for each day)
CREATE TABLE public.real_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES public.real_time_days(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  description TEXT NOT NULL,
  payment_account payment_account NOT NULL,
  amount NUMERIC NOT NULL,
  reference_no TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create index for faster lookups
CREATE INDEX idx_real_time_days_op_date ON public.real_time_days(op_date);
CREATE INDEX idx_real_time_entries_day_id ON public.real_time_entries(day_id);
CREATE INDEX idx_real_time_entries_sort_order ON public.real_time_entries(day_id, sort_order);

-- Enable Row Level Security
ALTER TABLE public.real_time_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.real_time_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for real_time_days - Admin only
CREATE POLICY "Deny public access to real_time_days"
ON public.real_time_days
FOR ALL
USING (false);

CREATE POLICY "Admins can manage all real_time_days"
ON public.real_time_days
FOR ALL
USING (is_admin());

-- RLS Policies for real_time_entries - Admin only
CREATE POLICY "Deny public access to real_time_entries"
ON public.real_time_entries
FOR ALL
USING (false);

CREATE POLICY "Admins can manage all real_time_entries"
ON public.real_time_entries
FOR ALL
USING (is_admin());

-- Trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_real_time_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;

-- Create triggers for timestamp updates
CREATE TRIGGER update_real_time_days_timestamp
BEFORE UPDATE ON public.real_time_days
FOR EACH ROW
EXECUTE FUNCTION public.update_real_time_timestamp();

CREATE TRIGGER update_real_time_entries_timestamp
BEFORE UPDATE ON public.real_time_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_real_time_timestamp();