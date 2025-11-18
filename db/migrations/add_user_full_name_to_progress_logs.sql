-- Add user_full_name to progress_logs table
ALTER TABLE public.progress_logs
ADD COLUMN IF NOT EXISTS user_full_name TEXT;
