-- Migration: Final RLS policies for profiles table - No Circular Dependencies
-- Date: 2025-10-29
-- Completely eliminates circular dependencies by removing superadmin RLS policy

-- Start with a clean slate
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    -- Drop all existing policies dynamically
    FOR policy_name IN
        SELECT p.policyname::TEXT
        FROM pg_policies p
        WHERE p.tablename = 'profiles' AND p.schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.profiles';
    END LOOP;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Simple, clean RLS policies without any circular dependencies

-- Policy 1: Users can view their own profile
CREATE POLICY "users_can_view_own_profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Users can insert their own profile (for registration/account creation)
CREATE POLICY "users_can_insert_own_profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy 3: Users can update their own profile
CREATE POLICY "users_can_update_own_profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- NOTE: Superadmin operations (read, update, delete others' profiles)
-- should be performed using the service role key (admin), not through RLS.
-- This eliminates circular dependency issues and provides proper separation of concerns.
-- Client-side code should use server actions with admin/client separation for privileged operations.

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Verify the policies
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies
WHERE tablename = 'profiles' AND schemaname = 'public'
ORDER BY policyname;

-- Status verification
SELECT
    'RLS policies updated successfully!' as status,
    COUNT(*) as total_policies,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_policies p
JOIN pg_tables t ON p.tablename = t.tablename AND p.schemaname = t.schemaname
WHERE p.tablename = 'profiles' AND p.schemaname = 'public'
GROUP BY rowsecurity;
