-- Migration: Fixed RLS policies for profiles table (no circular dependency)
-- Date: 2025-10-29
-- Fixes infinite recursion in RLS policies

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can manage profiles" ON public.profiles;

-- Create helper function to check superadmin status (avoids circular reference)
CREATE OR REPLACE FUNCTION is_superadmin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Using security definer to bypass RLS
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative approach: Grant bypass RLS to specific service role
-- GRANT BYPASSRLS ON public.profiles TO service_role;

-- Create new RLS policies (without circular dependency)

-- Policy 1: Users can view their own profile
CREATE POLICY "users_read_own_profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Users can insert their own profile
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

-- Policy 4: Superadmins can manage all profiles (uses function to avoid circular dependency)
CREATE POLICY "superadmins_manage_profiles"
ON public.profiles
FOR ALL
USING (is_superadmin(auth.uid()))
WITH CHECK (is_superadmin(auth.uid()));

-- Verify policies
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    'Policy created successfully' as status
FROM pg_policies
WHERE tablename = 'profiles' AND schemaname = 'public'
ORDER BY policyname;

-- Test the function works
SELECT
    'Function is_superadmin() created successfully' as status,
    CASE WHEN is_superadmin(auth.uid()) THEN 'User is superadmin'
         WHEN is_superadmin(auth.uid()) IS NULL THEN 'User not authenticated'
         ELSE 'User is not superadmin'
    END as current_user_status;
