-- Create a view that aggregates shipment weights per consignment.
-- This avoids client-side pagination/limits and guarantees exact totals.
CREATE OR REPLACE VIEW public.air_cargo_consignment_weights AS
SELECT
  consignment_id,
  COALESCE(SUM(dead_weight_kg), 0)::numeric AS total_dead_weight,
  COALESCE(SUM(volumetric_weight_kg), 0)::numeric AS total_volumetric_weight,
  COALESCE(SUM(chargeable_weight_kg), 0)::numeric AS total_chargeable_weight,
  COUNT(*)::bigint AS shipment_count
FROM public.air_cargo_shipments
WHERE consignment_id IS NOT NULL
GROUP BY consignment_id;

-- Helpful index for joining/filtering
CREATE INDEX IF NOT EXISTS idx_air_cargo_shipments_consignment_id
ON public.air_cargo_shipments(consignment_id);