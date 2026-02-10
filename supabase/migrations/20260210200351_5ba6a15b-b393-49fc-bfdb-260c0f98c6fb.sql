
DROP POLICY "Service role can update jobs" ON public.comparison_jobs;

CREATE POLICY "Service role can update jobs"
ON public.comparison_jobs FOR UPDATE
USING (auth.uid() = user_id);
