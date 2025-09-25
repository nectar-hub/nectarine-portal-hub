-- Create the buy-request-screenshots storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'buy-request-screenshots',
  'buy-request-screenshots',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
);

-- Create storage policies for buy request screenshots
-- Users can upload screenshots for their own requests
CREATE POLICY "Users can upload their own screenshots" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'buy-request-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own screenshots
CREATE POLICY "Users can view their own screenshots" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'buy-request-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can view all screenshots
CREATE POLICY "Admins can view all screenshots" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'buy-request-screenshots' 
  AND (
    SELECT is_admin FROM profiles WHERE id = auth.uid()
  ) = true
);

-- Users can update their own screenshots
CREATE POLICY "Users can update their own screenshots" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'buy-request-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own screenshots
CREATE POLICY "Users can delete their own screenshots" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'buy-request-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);