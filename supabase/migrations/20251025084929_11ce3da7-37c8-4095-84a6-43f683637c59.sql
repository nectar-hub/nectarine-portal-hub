-- Fix the foreign key constraint on purchase_tracker_audit to allow cascading deletes
ALTER TABLE public.purchase_tracker_audit
DROP CONSTRAINT IF EXISTS purchase_tracker_audit_purchase_id_fkey;

-- Re-add the constraint with ON DELETE CASCADE
ALTER TABLE public.purchase_tracker_audit
ADD CONSTRAINT purchase_tracker_audit_purchase_id_fkey
FOREIGN KEY (purchase_id) REFERENCES public.purchase_tracker(id)
ON DELETE CASCADE;