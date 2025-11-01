-- Add progress_log_id to attachments table to link photos with progress updates
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS progress_log_id BIGINT REFERENCES progress_logs(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS attachments_progress_log_id_idx ON attachments(progress_log_id);
