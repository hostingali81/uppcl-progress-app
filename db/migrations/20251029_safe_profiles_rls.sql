-- Migration: Safely update RLS policies on profiles table
-- Date: 2025-10-29
-- This version avoids dynamic SQL completely

-- First, check current state
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'profiles' AND schemaname = 'public';

-- List existing policies before dropping
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'profiles' AND schemaname = 'public';

-- Drop ALL known policies manually (comprehensive list)
-- This is safer than dynamic SQL and covers all possible policy names
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can manage profiles" ON public.profiles;

-- These variations might exist too
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Superadmin can do everything" ON public.profiles;
DROP POLICY IF EXISTS "All users can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "View own profile" ON public.profiles;

-- More possible variations
DROP POLICY IF EXISTS "enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "enable update for own profile" ON public.profiles;
DROP POLICY IF EXISTS "enable delete for own profile" ON public.profiles;
DROP POLICY IF EXISTS "enable all for superadmins" ON public.profiles;

-- Ensure RLS is enabled (just in case)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create the NEW comprehensive RLS policies

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Users can insert their own profile (for registration)
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 4: Superadmins can manage all profiles (read, insert, update, delete)
CREATE POLICY "Superadmins can manage profiles"
ON public.profiles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'superadmin'
  )
);

-- Verify the new policies
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename = 'profiles' AND schemaname = 'public'
ORDER BY policyname;

-- Final verification
SELECT
    'Migration completed successfully!' as status,
    COUNT(*) as total_policies
FROM pg_policies
WHERE tablename = 'profiles' AND schemaname = 'public';
