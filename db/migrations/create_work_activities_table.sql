-- Migration: Create work_activities table for Gantt chart activities
-- This table stores main activities and sub-activities with progress tracking

CREATE TABLE IF NOT EXISTS public.work_activities (
  id BIGSERIAL PRIMARY KEY,
  work_id BIGINT NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
  
  -- Activity identification
  activity_code TEXT NOT NULL, -- e.g., 'a', 'b1', 'c3'
  activity_name TEXT NOT NULL,
  parent_activity_id BIGINT NULL REFERENCES public.work_activities(id) ON DELETE CASCADE,
  is_main_activity BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Schedule data
  start_date DATE NULL,
  end_date DATE NULL,
  duration INTEGER NULL, -- in days
  
  -- Progress tracking
  progress_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  
  -- Display order
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint
  CONSTRAINT work_activities_unique UNIQUE (work_id, activity_code)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS work_activities_work_id_idx ON public.work_activities(work_id);
CREATE INDEX IF NOT EXISTS work_activities_parent_id_idx ON public.work_activities(parent_activity_id);
CREATE INDEX IF NOT EXISTS work_activities_is_main_idx ON public.work_activities(is_main_activity);

-- Enable RLS
ALTER TABLE public.work_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view activities" ON public.work_activities;
DROP POLICY IF EXISTS "Users can manage activities" ON public.work_activities;

CREATE POLICY "Users can view activities"
ON public.work_activities
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage activities"
ON public.work_activities
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER on_work_activities_update
    BEFORE UPDATE ON public.work_activities
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Function to auto-calculate parent activity progress based on weighted average
CREATE OR REPLACE FUNCTION calculate_parent_activity_progress()
RETURNS TRIGGER AS $$
DECLARE
  parent_id BIGINT;
  total_weight NUMERIC;
  weighted_sum NUMERIC;
  avg_progress NUMERIC;
BEGIN
  -- Get parent activity ID
  parent_id := NEW.parent_activity_id;
  
  -- If this activity has a parent, update parent's progress
  IF parent_id IS NOT NULL THEN
    -- Calculate weighted average if duration exists, otherwise simple average
    SELECT 
      SUM(COALESCE(duration, 1)),
      SUM(progress_percentage * COALESCE(duration, 1))
    INTO total_weight, weighted_sum
    FROM public.work_activities
    WHERE parent_activity_id = parent_id;
    
    -- Calculate weighted average progress
    IF total_weight > 0 THEN
      avg_progress := weighted_sum / total_weight;
    ELSE
      -- Fallback to simple average if no weights
      SELECT AVG(progress_percentage) INTO avg_progress
      FROM public.work_activities
      WHERE parent_activity_id = parent_id;
    END IF;
    
    -- Update parent activity progress
    UPDATE public.work_activities
    SET progress_percentage = COALESCE(avg_progress, 0),
        updated_at = NOW()
    WHERE id = parent_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update parent progress when child progress changes
CREATE TRIGGER on_activity_progress_update
    AFTER INSERT OR UPDATE OF progress_percentage ON public.work_activities
    FOR EACH ROW
    EXECUTE FUNCTION calculate_parent_activity_progress();
