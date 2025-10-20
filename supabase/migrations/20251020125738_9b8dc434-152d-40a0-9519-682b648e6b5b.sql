-- Create air_cargo_consignments table
CREATE TABLE public.air_cargo_consignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consignment_name TEXT NOT NULL,
  consignment_number TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  status TEXT NOT NULL DEFAULT 'OPEN',
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.air_cargo_consignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for consignments
CREATE POLICY "Admins can manage all consignments"
ON public.air_cargo_consignments
FOR ALL
USING (is_admin());

-- Add consignment_id to air_cargo_shipments
ALTER TABLE public.air_cargo_shipments
ADD COLUMN consignment_id UUID REFERENCES public.air_cargo_consignments(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_shipments_consignment_id ON public.air_cargo_shipments(consignment_id);

-- Update trigger for consignments
CREATE TRIGGER update_air_cargo_consignment_timestamp
  BEFORE UPDATE ON public.air_cargo_consignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_air_cargo_timestamp();