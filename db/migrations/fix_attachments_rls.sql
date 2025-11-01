-- Fix attachments RLS to allow all authenticated users to view
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view attachments" ON public.attachments;
DROP POLICY IF EXISTS "Anyone can view attachments" ON public.attachments;

-- Allow all authenticated users to view attachments
CREATE POLICY "All authenticated users can view attachments"
    ON public.attachments
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow users to insert their own attachments
CREATE POLICY "Users can insert attachments"
    ON public.attachments
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = uploader_id);

-- Allow users to delete their own attachments
CREATE POLICY "Users can delete their own attachments"
    ON public.attachments
    FOR DELETE
    TO authenticated
    USING (auth.uid() = uploader_id);
