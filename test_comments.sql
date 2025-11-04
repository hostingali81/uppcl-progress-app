-- Test script to verify comments table and functionality

-- 1. Check if comments table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'comments'
) as comments_table_exists;

-- 2. Check comments table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'comments'
ORDER BY ordinal_position;

-- 3. Check RLS policies on comments table
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
WHERE tablename = 'comments';

-- 4. Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'comments';

-- 5. Count existing comments
SELECT COUNT(*) as total_comments FROM public.comments;

-- 6. Check recent comments (if any)
SELECT 
    id,
    work_id,
    user_full_name,
    LEFT(content, 50) as content_preview,
    is_deleted,
    is_edited,
    created_at
FROM public.comments
ORDER BY created_at DESC
LIMIT 5;
