-- Update compute_cargo_weights function to use CEIL (ROUNDUP) for chargeable weight
DROP FUNCTION IF EXISTS public.compute_cargo_weights() CASCADE;

CREATE OR REPLACE FUNCTION public.compute_cargo_weights()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  -- Compute volumetric weight if not locked and dimensions are present
  IF NEW.volumetric_weight_locked = false AND 
     NEW.length_cm IS NOT NULL AND 
     NEW.width_cm IS NOT NULL AND 
     NEW.height_cm IS NOT NULL THEN
    NEW.volumetric_weight_kg = (NEW.length_cm * NEW.width_cm * NEW.height_cm) / 5000.0;
  END IF;
  
  -- Compute chargeable weight using CEIL (ROUNDUP) of the greater value
  IF NEW.dead_weight_kg IS NOT NULL AND NEW.volumetric_weight_kg IS NOT NULL THEN
    NEW.chargeable_weight_kg = CEIL(GREATEST(NEW.dead_weight_kg, NEW.volumetric_weight_kg));
  ELSIF NEW.dead_weight_kg IS NOT NULL THEN
    NEW.chargeable_weight_kg = CEIL(NEW.dead_weight_kg);
  ELSIF NEW.volumetric_weight_kg IS NOT NULL THEN
    NEW.chargeable_weight_kg = CEIL(NEW.volumetric_weight_kg);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER compute_cargo_weights_trigger
  BEFORE INSERT OR UPDATE ON air_cargo_shipments
  FOR EACH ROW
  EXECUTE FUNCTION compute_cargo_weights();