-- Add attachment_type column to categorize attachments
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS attachment_type TEXT DEFAULT 'site_photo' CHECK (attachment_type IN ('site_photo', 'document'));

-- Create index for filtering by type
CREATE INDEX IF NOT EXISTS attachments_type_idx ON attachments(attachment_type);
