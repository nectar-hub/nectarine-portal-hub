-- Remove the route column from production_costs table
ALTER TABLE public.production_costs DROP COLUMN IF EXISTS route;