-- Update function to calculate parent progress using weighted average

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
