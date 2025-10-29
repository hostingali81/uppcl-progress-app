-- Add expected_completion_date to works and progress_logs

ALTER TABLE public.works
  ADD COLUMN IF NOT EXISTS expected_completion_date date NULL;

ALTER TABLE public.progress_logs
  ADD COLUMN IF NOT EXISTS expected_completion_date date NULL;

