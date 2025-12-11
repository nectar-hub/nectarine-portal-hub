-- Add updated_by column to air_cargo_clients table
ALTER TABLE public.air_cargo_clients
ADD COLUMN updated_by uuid NULL;