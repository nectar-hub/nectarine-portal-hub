-- Fix search path for update_air_cargo_timestamp function
DROP FUNCTION IF EXISTS public.update_air_cargo_timestamp() CASCADE;

CREATE OR REPLACE FUNCTION public.update_air_cargo_timestamp()
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

-- Fix search path for compute_cargo_weights function
DROP FUNCTION IF EXISTS public.compute_cargo_weights() CASCADE;

CREATE OR REPLACE FUNCTION public.compute_cargo_weights()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
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
$$;

-- Re-create triggers
CREATE TRIGGER update_air_cargo_clients_timestamp
  BEFORE UPDATE ON public.air_cargo_clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_air_cargo_timestamp();

CREATE TRIGGER update_air_cargo_shipments_timestamp
  BEFORE UPDATE ON public.air_cargo_shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_air_cargo_timestamp();

CREATE TRIGGER compute_cargo_weights_trigger
  BEFORE INSERT OR UPDATE ON public.air_cargo_shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_cargo_weights();