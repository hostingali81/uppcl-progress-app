-- Migration: Fix RLS policies for works table - Remove Circular Dependencies
-- Date: 2025-10-29
-- Removes circular dependency in works table superadmin policy

-- Useful queries to check current state before running migration:
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'works' AND schemaname = 'public';

-- Drop ALL existing policies on works table first
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    -- Drop all existing policies dynamically
    FOR policy_name IN
        SELECT p.policyname::TEXT
        FROM pg_policies p
        WHERE p.tablename = 'works' AND p.schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.works';
    END LOOP;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;

-- Clean RLS policies without circular dependencies

-- Policy 1: Allow all authenticated users to read works (view dashboard, work details, etc.)
CREATE POLICY "allow_authenticated_users_read_works"
ON public.works
FOR SELECT
USING (auth.role() = 'authenticated');

-- Policy 2: Allow all authenticated users to update works (for progress updates, status changes)
-- Note: This allows all authenticated users to update. In production you might want more restrictive policies
CREATE POLICY "allow_authenticated_users_update_works"
ON public.works
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Policy 3: Allow all authenticated users to insert works (for data import/management)
-- Remove this policy in production if you want to restrict who can add new works
CREATE POLICY "allow_authenticated_users_insert_works"
ON public.works
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- NOTE: Superadmin specialized operations should use service role (client)
-- The service role bypasses RLS entirely, so admin operations are handled via server actions
-- that use the service role client (not the regular user client)

-- Verify the policies
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    qual,
    'New RLS policy created' as status
FROM pg_policies
WHERE tablename = 'works' AND schemaname = 'public'
ORDER BY policyname;

-- Summary of changes
SELECT
    'RLS policies fixed - removed circular dependency!' as message,
    COUNT(*) as total_works_policies,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_policies p
JOIN pg_tables t ON p.tablename = t.tablename AND p.schemaname = t.schemaname
WHERE p.tablename = 'works' AND p.schemaname = 'public'
GROUP BY rowsecurity;
