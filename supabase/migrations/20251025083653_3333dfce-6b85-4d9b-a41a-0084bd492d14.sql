-- Create month_periods table to organize purchases by month
CREATE TABLE IF NOT EXISTS public.month_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  UNIQUE(month, year)
);

-- Enable RLS on month_periods
ALTER TABLE public.month_periods ENABLE ROW LEVEL SECURITY;

-- RLS policies for month_periods
CREATE POLICY "Admins can manage all month periods"
ON public.month_periods
FOR ALL
USING (is_admin());

CREATE POLICY "Deny public access to month_periods"
ON public.month_periods
FOR ALL
USING (false);

-- Add month_period_id to purchase_tracker
ALTER TABLE public.purchase_tracker
ADD COLUMN month_period_id UUID REFERENCES public.month_periods(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_purchase_tracker_month_period ON public.purchase_tracker(month_period_id);

-- Create trigger for month_periods timestamp updates
CREATE TRIGGER update_month_periods_timestamp
BEFORE UPDATE ON public.month_periods
FOR EACH ROW
EXECUTE FUNCTION public.update_purchase_tracker_timestamp();