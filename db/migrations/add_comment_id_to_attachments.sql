-- Migration: Add comment_id to attachments table
-- Description: This migration adds a foreign key relationship from attachments to comments,
-- allowing attachments to be directly associated with a comment.

-- Add the comment_id column to the attachments table
ALTER TABLE public.attachments
ADD COLUMN comment_id BIGINT;

-- Add a foreign key constraint to link attachments to comments
ALTER TABLE public.attachments
ADD CONSTRAINT fk_comment
FOREIGN KEY (comment_id)
REFERENCES public.comments(id)
ON DELETE SET NULL; -- If a comment is deleted, we might want to keep the attachment, so we set the comment_id to NULL.

-- Create an index on the new comment_id column for better query performance
CREATE INDEX IF NOT EXISTS attachments_comment_id_idx ON public.attachments(comment_id);

-- Update RLS policies to allow users to view attachments linked to comments they can see.
-- We need to drop the existing select policy and recreate it with the new logic.

DROP POLICY IF EXISTS "attachments_select_policy" ON public.attachments;

CREATE POLICY "attachments_select_policy" ON public.attachments
FOR SELECT USING (
    -- Users can view attachments for works they have access to
    EXISTS (
        SELECT 1 FROM public.works w
        WHERE w.id = attachments.work_id
    )
    -- OR users can view attachments linked to comments they can view
    OR (
        comment_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.comments c
            WHERE c.id = attachments.comment_id
        )
    )
);

-- The insert and delete policies can remain as they are, as they are based on the uploader_id.

-- Verify the new column and constraint
SELECT
    column_name,
    data_type,
    is_nullable
FROM
    information_schema.columns
WHERE
    table_name = 'attachments' AND column_name = 'comment_id';

-- List RLS policies to confirm the change
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'attachments';
