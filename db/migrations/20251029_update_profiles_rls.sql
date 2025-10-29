-- Migration: Update RLS policies on existing profiles table
-- Date: 2025-10-29
-- Use this if profiles table already exists with different RLS policies

-- Check current state
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'profiles' AND schemaname = 'public';

-- List existing policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'profiles' AND schemaname = 'public';

-- Drop ALL existing policies on profiles table (be careful!)
-- Drop policies manually to avoid dynamic SQL issues
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Superadmin can do everything" ON public.profiles;
DROP POLICY IF EXISTS "All users can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "View own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin policies" ON public.profiles;
DROP POLICY IF EXISTS "Profile policies" ON public.profiles;

-- Also drop any policy with similar names (using a simple loop that doesn't use format)
DO $$
DECLARE
    policy_name text;
    policies_to_drop text[] := ARRAY[
        'enable read access for authenticated users',
        'enable insert for authenticated users',
        'enable update for own profile',
        'enable delete for own profile',
        'enable all for superadmins',
        'read',
        'insert',
        'update',
        'delete',
        'all'
    ];
BEGIN
    FOREACH policy_name IN ARRAY policies_to_drop
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_name) || ' ON public.profiles';
    EXCEPTION
        WHEN OTHERS THEN
            -- Ignore errors for policies that don't exist
            NULL;
    END LOOP;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add new comprehensive RLS policies
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

-- Policy 4: Users can delete their own profile
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = id);

-- Policy 5: Superadmins can manage all profiles (full access)
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

-- Verify the policies were created
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE tablename = 'profiles' AND schemaname = 'public'
ORDER BY policyname;
