-- Create air_cargo_clients table
CREATE TABLE public.air_cargo_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  phone_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.air_cargo_clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for air_cargo_clients (admin only)
CREATE POLICY "Admins can manage all clients"
  ON public.air_cargo_clients
  FOR ALL
  USING (is_admin());

-- Create air_cargo_shipments table
CREATE TABLE public.air_cargo_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_received DATE NOT NULL DEFAULT CURRENT_DATE,
  client_id UUID NOT NULL REFERENCES public.air_cargo_clients(id) ON DELETE RESTRICT,
  invoice_no TEXT,
  pieces INTEGER,
  length_cm NUMERIC(10,2),
  width_cm NUMERIC(10,2),
  height_cm NUMERIC(10,2),
  dead_weight_kg NUMERIC(10,2),
  volumetric_weight_kg NUMERIC(10,2),
  volumetric_weight_locked BOOLEAN DEFAULT false,
  chargeable_weight_kg NUMERIC(10,2),
  destination TEXT,
  packed_in TEXT,
  status TEXT NOT NULL DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED', 'PROCESSING', 'READY', 'SENT', 'DELIVERED')),
  dims_notes TEXT,
  account_code TEXT,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.air_cargo_shipments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for air_cargo_shipments (admin only)
CREATE POLICY "Admins can manage all shipments"
  ON public.air_cargo_shipments
  FOR ALL
  USING (is_admin());

-- Create function to auto-update timestamps
CREATE OR REPLACE FUNCTION public.update_air_cargo_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for auto-updating timestamps
CREATE TRIGGER update_air_cargo_clients_timestamp
  BEFORE UPDATE ON public.air_cargo_clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_air_cargo_timestamp();

CREATE TRIGGER update_air_cargo_shipments_timestamp
  BEFORE UPDATE ON public.air_cargo_shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_air_cargo_timestamp();

-- Create function to compute volumetric and chargeable weights
CREATE OR REPLACE FUNCTION public.compute_cargo_weights()
RETURNS TRIGGER AS $$
BEGIN
  -- Compute volumetric weight if not locked and dimensions are present
  IF NEW.volumetric_weight_locked = false AND 
     NEW.length_cm IS NOT NULL AND 
     NEW.width_cm IS NOT NULL AND 
     NEW.height_cm IS NOT NULL THEN
    NEW.volumetric_weight_kg = (NEW.length_cm * NEW.width_cm * NEW.height_cm) / 5000.0;
  END IF;
  
  -- Compute chargeable weight as the greater of dead weight or volumetric weight
  IF NEW.dead_weight_kg IS NOT NULL AND NEW.volumetric_weight_kg IS NOT NULL THEN
    NEW.chargeable_weight_kg = GREATEST(NEW.dead_weight_kg, NEW.volumetric_weight_kg);
  ELSIF NEW.dead_weight_kg IS NOT NULL THEN
    NEW.chargeable_weight_kg = NEW.dead_weight_kg;
  ELSIF NEW.volumetric_weight_kg IS NOT NULL THEN
    NEW.chargeable_weight_kg = NEW.volumetric_weight_kg;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to compute weights automatically
CREATE TRIGGER compute_cargo_weights_trigger
  BEFORE INSERT OR UPDATE ON public.air_cargo_shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_cargo_weights();

-- Create indexes for better performance
CREATE INDEX idx_air_cargo_shipments_client_id ON public.air_cargo_shipments(client_id);
CREATE INDEX idx_air_cargo_shipments_date_received ON public.air_cargo_shipments(date_received);
CREATE INDEX idx_air_cargo_shipments_status ON public.air_cargo_shipments(status);
CREATE INDEX idx_air_cargo_clients_name ON public.air_cargo_clients(client_name);