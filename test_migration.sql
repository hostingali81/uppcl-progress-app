-- Test the profile operations after fixes
-- Run this in Supabase SQL Editor to test the fixes
-- Note: This test assumes you have an existing user in auth.users table
-- Replace 'existing-user-uuid-here' with an actual user ID

-- 1. First check if there are any existing users in the system
SELECT id, email, created_at FROM auth.users LIMIT 5;

-- 2. Pick any existing user ID from above query and use it in the test BELOW:
-- REPLACE 'YOUR-ACTUAL-USER-ID-HERE' with a real user ID from step 1

-- Example test (use a real user ID):
/*
-- 1. First create a test profile for an existing user
INSERT INTO public.profiles (id, full_name, role, region) VALUES
('YOUR-ACTUAL-USER-ID-HERE', 'Test User', 'admin', 'Test Region');

-- 2. Update the test user (simulate what happens in updateUser)
UPDATE public.profiles
SET full_name = 'Updated Test User', role = 'superadmin', updated_at = NOW()
WHERE id = 'YOUR-ACTUAL-USER-ID-HERE';

-- 3. Check the profile was updated correctly
SELECT id, full_name, role, region, updated_at
FROM public.profiles
WHERE id = 'YOUR-ACTUAL-USER-ID-HERE';

-- 4. Clean up test data (optional)
DELETE FROM public.profiles WHERE full_name = 'Updated Test User';
*/

-- Alternative: Test just the table structure and RLS policies
-- Without inserting data

-- Check if profiles table exists and has correct structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'profiles' AND schemaname = 'public';

-- List all RLS policies on profiles table
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles' AND schemaname = 'public';
