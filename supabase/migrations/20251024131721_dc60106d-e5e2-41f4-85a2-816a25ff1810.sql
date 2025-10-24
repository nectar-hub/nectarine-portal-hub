-- Drop purchase tracker tables and related objects
DROP TABLE IF EXISTS public.purchase_tracker_audit CASCADE;
DROP TABLE IF EXISTS public.purchase_tracker CASCADE;

-- Drop the custom types used by purchase tracker
DROP TYPE IF EXISTS public.purchase_status CASCADE;
DROP TYPE IF EXISTS public.purchase_region CASCADE;