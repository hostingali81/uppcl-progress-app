-- Add schedule_data column to works table
-- This column stores the Gantt chart schedule data as JSON

ALTER TABLE public.works 
ADD COLUMN IF NOT EXISTS schedule_data TEXT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.works.schedule_data IS 'Stores Gantt chart schedule data as JSON string';
