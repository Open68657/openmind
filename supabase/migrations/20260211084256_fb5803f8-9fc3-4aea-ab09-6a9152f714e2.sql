-- Create table for brand PDF parsing jobs
CREATE TABLE public.brand_parse_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id text NOT NULL,
  storage_path text NOT NULL,
  file_name text,
  status text NOT NULL DEFAULT 'processing',
  result jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.brand_parse_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own parse jobs"
ON public.brand_parse_jobs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own parse jobs"
ON public.brand_parse_jobs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Service role updates handled server-side, but allow user to read status
CREATE POLICY "Service role can update jobs"
ON public.brand_parse_jobs FOR UPDATE
USING (auth.uid() = user_id);

CREATE TRIGGER update_brand_parse_jobs_updated_at
BEFORE UPDATE ON public.brand_parse_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();