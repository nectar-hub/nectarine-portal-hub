-- Remove problematic FK from audit table to allow DELETE logging without parent row
ALTER TABLE public.purchase_tracker_audit
DROP CONSTRAINT IF EXISTS purchase_tracker_audit_purchase_id_fkey;