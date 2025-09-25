-- Add product_type field to self_purchases table to categorize the type of products
ALTER TABLE public.self_purchases 
ADD COLUMN product_type TEXT;

-- Update existing records to have a default product type
UPDATE public.self_purchases 
SET product_type = 'General' 
WHERE product_type IS NULL;