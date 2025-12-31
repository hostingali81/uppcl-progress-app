-- Insert all activities for work_id 2232
-- First delete existing, then insert with parent references

-- Delete existing activities
DELETE FROM work_activities WHERE work_id = 2232;

-- A. Land Allotment and Layout (Main)
INSERT INTO work_activities (work_id, activity_code, activity_name, is_main_activity, start_date, end_date, duration, progress_percentage, display_order)
VALUES (2232, 'a', 'Land Allotment and Layout', true, '2025-11-03', '2025-11-30', 27, 100, 0);

-- Get the ID of parent 'a'
DO $$
DECLARE parent_a_id BIGINT;
BEGIN
  SELECT id INTO parent_a_id FROM work_activities WHERE work_id = 2232 AND activity_code = 'a';
  
  -- Sub-activities under A
  INSERT INTO work_activities (work_id, activity_code, activity_name, is_main_activity, parent_activity_id, start_date, end_date, duration, progress_percentage, display_order)
  VALUES 
  (2232, 'a1', 'Land Alotment', false, parent_a_id, '2025-11-03', '2025-11-03', 0, 100, 1),
  (2232, 'a2', 'Land Demarcation', false, parent_a_id, '2025-11-11', '2025-11-11', 0, 100, 2),
  (2232, 'a3', 'Contouring & Layout', false, parent_a_id, '2025-11-11', '2025-11-30', 19, 100, 3);
END $$;

-- B. Control Room Building (Main)
INSERT INTO work_activities (work_id, activity_code, activity_name, is_main_activity, start_date, end_date, duration, progress_percentage, display_order)
VALUES (2232, 'b', 'Control Room Building', true, '2025-12-01', '2026-02-24', 85, 12, 4);

DO $$
DECLARE parent_b_id BIGINT;
BEGIN
  SELECT id INTO parent_b_id FROM work_activities WHERE work_id = 2232 AND activity_code = 'b';
  
  INSERT INTO work_activities (work_id, activity_code, activity_name, is_main_activity, parent_activity_id, start_date, end_date, duration, progress_percentage, display_order)
  VALUES 
  (2232, 'b1', 'Excavation/PCC in foundation', false, parent_b_id, '2025-12-01', '2025-12-04', 3, 100, 5),
  (2232, 'b2', 'Column Reinforcement', false, parent_b_id, '2025-12-05', '2025-12-10', 5, 100, 6),
  (2232, 'b3', 'Footing Concrete', false, parent_b_id, '2025-12-15', '2025-12-23', 8, 100, 7),
  (2232, 'b4', 'brick work below Plinth and trench', false, parent_b_id, '2025-12-23', '2025-12-29', 6, 100, 8),
  (2232, 'b5', 'Rcc in plinth beam', false, parent_b_id, '2025-12-30', '2026-01-03', 4, 20, 9),
  (2232, 'b6', 'Coloumn work up to lintel bend', false, parent_b_id, '2026-01-05', '2026-01-09', 4, 0, 10),
  (2232, 'b7', 'Brick work up to lintel bend', false, parent_b_id, '2026-01-07', '2026-01-10', 3, 0, 11),
  (2232, 'b8', 'Lintel and Sunshade', false, parent_b_id, '2026-01-10', '2026-01-12', 2, 0, 12),
  (2232, 'b9', 'Coloumn work up to roof slab', false, parent_b_id, '2026-01-10', '2026-01-14', 4, 0, 13),
  (2232, 'b10', 'Brick work up to roof slab', false, parent_b_id, '2026-01-10', '2026-01-16', 6, 0, 14),
  (2232, 'b11', 'Slab Shuttering and Deshuttering', false, parent_b_id, '2026-01-18', '2026-02-12', 25, 0, 15),
  (2232, 'b12', 'Plaster work', false, parent_b_id, '2026-02-13', '2026-02-18', 5, 0, 16),
  (2232, 'b13', 'Flooring/Tiling work', false, parent_b_id, '2026-02-15', '2026-02-19', 4, 0, 17),
  (2232, 'b14', 'Plumbing/Electrification work', false, parent_b_id, '2026-02-13', '2026-02-18', 5, 0, 18),
  (2232, 'b15', 'Painting work', false, parent_b_id, '2026-02-20', '2026-02-24', 4, 0, 19);
END $$;

-- C. Boundry Wall (Main)
INSERT INTO work_activities (work_id, activity_code, activity_name, is_main_activity, start_date, end_date, duration, progress_percentage, display_order)
VALUES (2232, 'c', 'Boundry Wall', true, '2025-12-01', '2026-02-24', 85, 0, 20);

DO $$
DECLARE parent_c_id BIGINT;
BEGIN
  SELECT id INTO parent_c_id FROM work_activities WHERE work_id = 2232 AND activity_code = 'c';
  
  INSERT INTO work_activities (work_id, activity_code, activity_name, is_main_activity, parent_activity_id, start_date, end_date, duration, progress_percentage, display_order)
  VALUES 
  (2232, 'c1', 'Excavation in foundation', false, parent_c_id, '2025-12-01', '2025-12-06', 5, 100, 21),
  (2232, 'c2', 'Column Reinforcement', false, parent_c_id, '2025-12-25', '2025-12-31', 6, 80, 22),
  (2232, 'c3', 'Footing PCC and Concrete', false, parent_c_id, '2025-12-28', '2026-01-09', 12, 15, 23),
  (2232, 'c4', 'brick work below PB', false, parent_c_id, '2026-01-06', '2026-01-12', 6, 0, 24),
  (2232, 'c5', 'Rcc in plinth beam', false, parent_c_id, '2026-01-12', '2026-01-16', 4, 0, 25),
  (2232, 'c6', 'Column Concreting', false, parent_c_id, '2026-01-16', '2026-01-26', 10, 0, 26),
  (2232, 'c7', 'Brick Work', false, parent_c_id, '2026-01-18', '2026-01-30', 12, 0, 27),
  (2232, 'c8', 'Top Beam', false, parent_c_id, '2026-01-28', '2026-02-01', 4, 0, 28),
  (2232, 'c9', 'Plaster work', false, parent_c_id, '2026-01-25', '2026-02-05', 11, 0, 29),
  (2232, 'c10', 'Fininshing Work', false, parent_c_id, '2026-02-02', '2026-02-20', 18, 0, 30);
END $$;

-- D. Earth Filling (Main)
INSERT INTO work_activities (work_id, activity_code, activity_name, is_main_activity, start_date, end_date, duration, progress_percentage, display_order)
VALUES (2232, 'd', 'Earth Filling', true, '2026-01-02', '2026-01-15', 13, 10, 31);

-- E. Road and Yard Work (Main)
INSERT INTO work_activities (work_id, activity_code, activity_name, is_main_activity, start_date, end_date, duration, progress_percentage, display_order)
VALUES (2232, 'e', 'Road and Yard Work', true, '2026-01-20', '2026-02-24', 35, 0, 32);

DO $$
DECLARE parent_e_id BIGINT;
BEGIN
  SELECT id INTO parent_e_id FROM work_activities WHERE work_id = 2232 AND activity_code = 'e';
  
  INSERT INTO work_activities (work_id, activity_code, activity_name, is_main_activity, parent_activity_id, start_date, end_date, duration, progress_percentage, display_order)
  VALUES 
  (2232, 'e1', 'Road Sub Base /Toe Wall', false, parent_e_id, '2026-01-28', '2026-02-03', 6, 0, 33),
  (2232, 'e2', 'Road GSB Work', false, parent_e_id, '2026-02-05', '2026-02-10', 5, 0, 34),
  (2232, 'e3', 'Road Work', false, parent_e_id, '2026-02-13', '2026-02-16', 3, 0, 35);
END $$;

-- F. Other Yard Related Works (Main)
INSERT INTO work_activities (work_id, activity_code, activity_name, is_main_activity, start_date, end_date, duration, progress_percentage, display_order)
VALUES (2232, 'f', 'Other Yard Related Works', true, '2026-02-01', '2026-02-24', 23, 0, 36);
