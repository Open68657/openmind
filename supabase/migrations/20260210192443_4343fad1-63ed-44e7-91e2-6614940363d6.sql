
-- Create storage bucket for finals audit uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('finals-audit', 'finals-audit', false);

-- Authenticated users can upload to finals-audit
CREATE POLICY "Auth users can upload finals"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'finals-audit');

-- Authenticated users can read their own uploads
CREATE POLICY "Auth users can read finals"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'finals-audit');

-- Authenticated users can delete their own uploads
CREATE POLICY "Auth users can delete finals"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'finals-audit');
