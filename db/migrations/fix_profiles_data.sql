-- Fix profiles table - ensure all auth users have profiles

-- Insert missing profiles for users who don't have one
INSERT INTO public.profiles (id, full_name, role)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email, 'User') as full_name,
    'user' as role
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
);

-- Update existing profiles with null full_name to use auth.users email
UPDATE public.profiles p
SET full_name = COALESCE(au.email, 'User')
FROM auth.users au
WHERE p.id = au.id AND p.full_name IS NULL;
