-- Add circle and zone fields to profiles table
-- Safe to run multiple times

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS circle text,
    ADD COLUMN IF NOT EXISTS zone text;

-- Optional: backfill from region if previously used for circle/zone
-- Uncomment if you had stored circle/zone values in region earlier
-- UPDATE public.profiles SET circle = COALESCE(circle, region) WHERE circle IS NULL AND role = 'circle_head';
-- UPDATE public.profiles SET zone = COALESCE(zone, region) WHERE zone IS NULL AND role = 'zone_head';

-- Ensure RLS remains enabled (does not change policies)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

