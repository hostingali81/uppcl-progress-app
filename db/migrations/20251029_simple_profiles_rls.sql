-- Migration: Simple and Reliable RLS policies for profiles table
-- Date: 2025-10-29
-- Eliminates circular dependencies completely

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "users_read_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "superadmins_manage_profiles" ON public.profiles;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create SIMPLE RLS policies (no circular dependencies)

-- Policy 1: Users can view their own profile ONLY
CREATE POLICY "users_read_own_profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Users can insert their own profile (for account creation)
CREATE POLICY "users_insert_own_profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy 3: Users can update their own profile
CREATE POLICY "users_update_own_profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- NOTE: Superadmin operations will use service role (bypasses RLS)
-- Admins should never rely on RLS for permissions - use service role authentication

-- Verify the policies were created successfully
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    'Simple RLS policy created' as status
FROM pg_policies
WHERE tablename = 'profiles' AND schemaname = 'public'
ORDER BY policyname;

-- Check RLS status
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    'RLS is properly configured' as message
FROM pg_tables
WHERE tablename = 'profiles' AND schemaname = 'public';

-- Final status
SELECT
    'Migration completed successfully! Superadmin operations use service role.' as final_status,
    COUNT(*) as active_rls_policies
FROM pg_policies
WHERE tablename = 'profiles' AND schemaname = 'public';
