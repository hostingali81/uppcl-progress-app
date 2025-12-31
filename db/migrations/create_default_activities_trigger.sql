-- Trigger to automatically insert default activities for new works

CREATE OR REPLACE FUNCTION insert_default_activities()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default activities for the new work
  INSERT INTO work_activities (work_id, activity_code, activity_name, is_main_activity, start_date, end_date, duration, progress_percentage, display_order)
  VALUES 
  -- A. Land Allotment and Layout
  (NEW.id, 'a', 'Land Allotment and Layout', true, NULL, NULL, 27, 0, 0),
  (NEW.id, 'a1', 'Land Alotment', false, NULL, NULL, 0, 0, 1),
  (NEW.id, 'a2', 'Land Demarcation', false, NULL, NULL, 0, 0, 2),
  (NEW.id, 'a3', 'Contouring & Layout', false, NULL, NULL, 19, 0, 3),
  
  -- B. Control Room Building
  (NEW.id, 'b', 'Control Room Building', true, NULL, NULL, 85, 0, 4),
  (NEW.id, 'b1', 'Excavation/PCC in foundation', false, NULL, NULL, 3, 0, 5),
  (NEW.id, 'b2', 'Column Reinforcement', false, NULL, NULL, 5, 0, 6),
  (NEW.id, 'b3', 'Footing Concrete', false, NULL, NULL, 8, 0, 7),
  (NEW.id, 'b4', 'brick work below Plinth and trench', false, NULL, NULL, 6, 0, 8),
  (NEW.id, 'b5', 'Rcc in plinth beam', false, NULL, NULL, 4, 0, 9),
  (NEW.id, 'b6', 'Coloumn work up to lintel bend', false, NULL, NULL, 4, 0, 10),
  (NEW.id, 'b7', 'Brick work up to lintel bend', false, NULL, NULL, 3, 0, 11),
  (NEW.id, 'b8', 'Lintel and Sunshade', false, NULL, NULL, 2, 0, 12),
  (NEW.id, 'b9', 'Coloumn work up to roof slab', false, NULL, NULL, 4, 0, 13),
  (NEW.id, 'b10', 'Brick work up to roof slab', false, NULL, NULL, 6, 0, 14),
  (NEW.id, 'b11', 'Slab Shuttering and Deshuttering', false, NULL, NULL, 25, 0, 15),
  (NEW.id, 'b12', 'Plaster work', false, NULL, NULL, 5, 0, 16),
  (NEW.id, 'b13', 'Flooring/Tiling work', false, NULL, NULL, 4, 0, 17),
  (NEW.id, 'b14', 'Plumbing/Electrification work', false, NULL, NULL, 5, 0, 18),
  (NEW.id, 'b15', 'Painting work', false, NULL, NULL, 4, 0, 19),
  
  -- C. Boundry Wall
  (NEW.id, 'c', 'Boundry Wall', true, NULL, NULL, 85, 0, 20),
  (NEW.id, 'c1', 'Excavation in foundation', false, NULL, NULL, 5, 0, 21),
  (NEW.id, 'c2', 'Column Reinforcement', false, NULL, NULL, 6, 0, 22),
  (NEW.id, 'c3', 'Footing PCC and Concrete', false, NULL, NULL, 12, 0, 23),
  (NEW.id, 'c4', 'brick work below PB', false, NULL, NULL, 6, 0, 24),
  (NEW.id, 'c5', 'Rcc in plinth beam', false, NULL, NULL, 4, 0, 25),
  (NEW.id, 'c6', 'Column Concreting', false, NULL, NULL, 10, 0, 26),
  (NEW.id, 'c7', 'Brick Work', false, NULL, NULL, 12, 0, 27),
  (NEW.id, 'c8', 'Top Beam', false, NULL, NULL, 4, 0, 28),
  (NEW.id, 'c9', 'Plaster work', false, NULL, NULL, 11, 0, 29),
  (NEW.id, 'c10', 'Fininshing Work', false, NULL, NULL, 18, 0, 30),
  
  -- D. Earth Filling
  (NEW.id, 'd', 'Earth Filling', true, NULL, NULL, 13, 0, 31),
  
  -- E. Road and Yard Work
  (NEW.id, 'e', 'Road and Yard Work', true, NULL, NULL, 35, 0, 32),
  (NEW.id, 'e1', 'Road Sub Base /Toe Wall', false, NULL, NULL, 6, 0, 33),
  (NEW.id, 'e2', 'Road GSB Work', false, NULL, NULL, 5, 0, 34),
  (NEW.id, 'e3', 'Road Work', false, NULL, NULL, 3, 0, 35),
  
  -- F. Other Yard Related Works
  (NEW.id, 'f', 'Other Yard Related Works', true, NULL, NULL, 23, 0, 36);
  
  -- Update parent relationships
  UPDATE work_activities SET parent_activity_id = (SELECT id FROM work_activities WHERE work_id = NEW.id AND activity_code = 'a') WHERE work_id = NEW.id AND activity_code IN ('a1', 'a2', 'a3');
  UPDATE work_activities SET parent_activity_id = (SELECT id FROM work_activities WHERE work_id = NEW.id AND activity_code = 'b') WHERE work_id = NEW.id AND activity_code IN ('b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 'b10', 'b11', 'b12', 'b13', 'b14', 'b15');
  UPDATE work_activities SET parent_activity_id = (SELECT id FROM work_activities WHERE work_id = NEW.id AND activity_code = 'c') WHERE work_id = NEW.id AND activity_code IN ('c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10');
  UPDATE work_activities SET parent_activity_id = (SELECT id FROM work_activities WHERE work_id = NEW.id AND activity_code = 'e') WHERE work_id = NEW.id AND activity_code IN ('e1', 'e2', 'e3');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS on_work_insert_activities ON works;
CREATE TRIGGER on_work_insert_activities
  AFTER INSERT ON works
  FOR EACH ROW
  EXECUTE FUNCTION insert_default_activities();
