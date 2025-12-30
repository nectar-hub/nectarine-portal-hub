-- Recreate view as SECURITY INVOKER (default in Postgres 15+, but explicit for safety)
-- This ensures the view uses the querying user's permissions rather than the creator's
DROP VIEW IF EXISTS public.air_cargo_consignment_weights;

CREATE VIEW public.air_cargo_consignment_weights
WITH (security_invoker = on)
AS
SELECT
  consignment_id,
  COALESCE(SUM(dead_weight_kg), 0)::numeric AS total_dead_weight,
  COALESCE(SUM(volumetric_weight_kg), 0)::numeric AS total_volumetric_weight,
  COALESCE(SUM(chargeable_weight_kg), 0)::numeric AS total_chargeable_weight,
  COUNT(*)::bigint AS shipment_count
FROM public.air_cargo_shipments
WHERE consignment_id IS NOT NULL
GROUP BY consignment_id;