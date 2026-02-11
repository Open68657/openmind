-- Create storage bucket for brand PDF uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('brand-pdfs', 'brand-pdfs', false);

-- Authenticated users can upload brand PDFs
CREATE POLICY "Auth users can upload brand pdfs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'brand-pdfs' AND auth.uid() IS NOT NULL);

-- Authenticated users can read brand PDFs
CREATE POLICY "Auth users can read brand pdfs"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-pdfs' AND auth.uid() IS NOT NULL);

-- Admins can delete brand PDFs
CREATE POLICY "Admins can delete brand pdfs"
ON storage.objects FOR DELETE
USING (bucket_id = 'brand-pdfs' AND has_role(auth.uid(), 'admin'::app_role));