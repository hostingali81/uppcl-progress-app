-- Migration: Add profiles table and RLS policies
-- Date: 2025-10-29
-- This migration ensures the profiles table exists with proper schema and RLS policies

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    region TEXT NULL,
    division TEXT NULL,
    subdivision TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at on profiles table
DROP TRIGGER IF EXISTS on_profiles_update ON public.profiles;
CREATE TRIGGER on_profiles_update
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Superadmins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create RLS policies for profiles table
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

-- Policy 4: Superadmins can manage all profiles (read, update, delete)
CREATE POLICY "Superadmins can manage profiles"
ON public.profiles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'superadmin'
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);
CREATE INDEX IF NOT EXISTS profiles_region_idx ON public.profiles (region);
CREATE INDEX IF NOT EXISTS profiles_division_idx ON public.profiles (division);
CREATE INDEX IF NOT EXISTS profiles_subdivision_idx ON public.profiles (subdivision);

-- Add comments for documentation
COMMENT ON TABLE public.profiles IS 'User profiles with role-based access control';
COMMENT ON COLUMN public.profiles.id IS 'References auth.users.id';
COMMENT ON COLUMN public.profiles.full_name IS 'User display name';
COMMENT ON COLUMN public.profiles.role IS 'User role: superadmin, admin, zone_head, circle_head, division_head, sub_division_head, je';
COMMENT ON COLUMN public.profiles.region IS 'User zone/region assignment';
COMMENT ON COLUMN public.profiles.division IS 'User division assignment';
COMMENT ON COLUMN public.profiles.subdivision IS 'User subdivision assignment';

-- Verify the table structure
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename = 'profiles' AND schemaname = 'public';

-- Check RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'profiles' AND schemaname = 'public';
