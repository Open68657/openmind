
CREATE TABLE public.comparison_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  progress INTEGER NOT NULL DEFAULT 0,
  sketch_path TEXT NOT NULL,
  final_path TEXT NOT NULL,
  sketch_name TEXT,
  final_name TEXT,
  sketch_mime_type TEXT,
  final_mime_type TEXT,
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.comparison_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own jobs"
ON public.comparison_jobs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own jobs"
ON public.comparison_jobs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can update jobs"
ON public.comparison_jobs FOR UPDATE
USING (true);

CREATE TRIGGER update_comparison_jobs_updated_at
BEFORE UPDATE ON public.comparison_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
