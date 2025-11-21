-- Fix missing comment_id column in attachments table

-- 1. Add comment_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attachments' AND column_name = 'comment_id') THEN
        ALTER TABLE public.attachments ADD COLUMN comment_id BIGINT;
    END IF;
END $$;

-- 2. Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_comment') THEN
        ALTER TABLE public.attachments
        ADD CONSTRAINT fk_comment
        FOREIGN KEY (comment_id)
        REFERENCES public.comments(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Create index for performance
CREATE INDEX IF NOT EXISTS attachments_comment_id_idx ON public.attachments(comment_id);

-- 4. Update RLS policies to allow viewing attachments linked to comments
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

-- 5. Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'attachments' AND column_name = 'comment_id';
