
-- Table to store extracted brand guideline data per client
CREATE TABLE public.brand_guidelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL UNIQUE,
  colors JSONB NOT NULL DEFAULT '[]'::jsonb,
  fonts JSONB NOT NULL DEFAULT '[]'::jsonb,
  logo_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  sub_brands JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_file_name TEXT,
  summary TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brand_guidelines ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (no auth in app currently)
CREATE POLICY "Anyone can read brand guidelines"
  ON public.brand_guidelines FOR SELECT
  USING (true);

-- Allow anyone to insert
CREATE POLICY "Anyone can insert brand guidelines"
  ON public.brand_guidelines FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update
CREATE POLICY "Anyone can update brand guidelines"
  ON public.brand_guidelines FOR UPDATE
  USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_brand_guidelines_updated_at
  BEFORE UPDATE ON public.brand_guidelines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
