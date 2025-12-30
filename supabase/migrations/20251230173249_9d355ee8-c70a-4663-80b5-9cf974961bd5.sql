-- Create production_costs table for tracking costs per consignment
CREATE TABLE public.production_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consignment_id UUID NOT NULL REFERENCES public.air_cargo_consignments(id) ON DELETE CASCADE,
  airline_freight_cost NUMERIC NOT NULL DEFAULT 0,
  office_handling_cost NUMERIC NOT NULL DEFAULT 0,
  arrival_clearance_cost NUMERIC NOT NULL DEFAULT 0,
  znz_airport_to_ferry_transport_cost NUMERIC NOT NULL DEFAULT 0,
  znz_to_dar_shipping_cost NUMERIC NOT NULL DEFAULT 0,
  dar_clearance_cost NUMERIC NOT NULL DEFAULT 0,
  dar_ferry_to_office_transport_cost NUMERIC NOT NULL DEFAULT 0,
  labour_helpers_cost NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  notes TEXT,
  cost_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  CONSTRAINT unique_consignment_cost UNIQUE (consignment_id)
);

-- Enable RLS
ALTER TABLE public.production_costs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin-only access
CREATE POLICY "Admins can manage all production costs"
ON public.production_costs
FOR ALL
USING (is_admin());

CREATE POLICY "Deny public access to production_costs"
ON public.production_costs
FOR ALL
USING (false);

-- Attach existing trigger for updated_at and updated_by
CREATE TRIGGER update_production_costs_timestamp
BEFORE UPDATE ON public.production_costs
FOR EACH ROW
EXECUTE FUNCTION public.update_air_cargo_timestamp();