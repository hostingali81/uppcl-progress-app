-- Fix progress_logs RLS policies to allow authenticated users to view progress logs
-- Based on the comment in payment_tracking.sql that mentions "same as progress_logs"

-- Enable RLS on progress_logs table if not already enabled
ALTER TABLE public.progress_logs ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might be restrictive
DROP POLICY IF EXISTS "Anyone can view progress logs" ON public.progress_logs;
DROP POLICY IF EXISTS "Users can view their own progress logs" ON public.progress_logs;
DROP POLICY IF EXISTS "Users can view progress logs for their region" ON public.progress_logs;

-- Allow any authenticated user to view progress logs
-- This matches the policy for payment_logs as mentioned in payment_tracking migration
CREATE POLICY "Anyone can view progress logs"
    ON public.progress_logs
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert their own progress logs
CREATE POLICY "Users can insert their own progress logs"
    ON public.progress_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.progress_logs IS 'Tracks progress updates and changes to works';
