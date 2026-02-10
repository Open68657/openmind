
-- Fix overly permissive brand_guidelines policies
DROP POLICY "Anyone can insert brand guidelines" ON public.brand_guidelines;
DROP POLICY "Anyone can update brand guidelines" ON public.brand_guidelines;

CREATE POLICY "Admins can insert brand guidelines"
  ON public.brand_guidelines FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update brand guidelines"
  ON public.brand_guidelines FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
