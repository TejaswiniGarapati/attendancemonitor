/*
  # Add Periods and Update Courses

  1. New Tables
    - `periods` table to store period timings (10:30 AM - 4:00 PM with 1-hour breaks)
      - `id` (uuid, primary key)
      - `period_number` (integer, 1-6)
      - `name` (text, e.g., "Period 1")
      - `start_time` (time)
      - `end_time` (time)
      - `created_at` (timestamp)

  2. Changes to existing tables
    - Update `class_sessions` to add `period_id` foreign key reference
    - Populate `periods` table with standard school periods

  3. New Courses
    - Add all six new courses: AIML, AIDS, EEE, ECE, MECH, CIVIL
    - Create sample subjects for each course
*/

-- Create periods table
CREATE TABLE IF NOT EXISTS periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_number integer NOT NULL UNIQUE,
  name text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add period_id to class_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'class_sessions' AND column_name = 'period_id'
  ) THEN
    ALTER TABLE class_sessions ADD COLUMN period_id uuid REFERENCES periods(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS on periods
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for periods
DROP POLICY IF EXISTS "Allow public read access to periods" ON periods;
DROP POLICY IF EXISTS "Allow public insert access to periods" ON periods;
DROP POLICY IF EXISTS "Allow public update access to periods" ON periods;
DROP POLICY IF EXISTS "Allow public delete access to periods" ON periods;

CREATE POLICY "Allow public read access to periods"
  ON periods FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to periods"
  ON periods FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to periods"
  ON periods FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to periods"
  ON periods FOR DELETE
  USING (true);

-- Insert periods (10:30 AM to 4:00 PM, 1-hour periods with lunch break from 12:00-13:00)
INSERT INTO periods (period_number, name, start_time, end_time)
VALUES 
  (1, 'Period 1', '10:30:00', '11:30:00'),
  (2, 'Period 2', '11:30:00', '12:00:00'),
  (3, 'Lunch Break', '12:00:00', '13:00:00'),
  (4, 'Period 3', '13:00:00', '14:00:00'),
  (5, 'Period 4', '14:00:00', '15:00:00'),
  (6, 'Period 5', '15:00:00', '16:00:00')
ON CONFLICT (period_number) DO NOTHING;

-- Insert new courses and subjects
DO $$
DECLARE
  v_year integer;
BEGIN
  FOR v_year IN 1..4 LOOP
    INSERT INTO subjects (name, code, course, year)
    SELECT 
      CASE course
        WHEN 'AIML' THEN 'Introduction to ' || course || ' - Year ' || v_year
        WHEN 'AIDS' THEN 'Data Science Fundamentals - Year ' || v_year
        WHEN 'EEE' THEN 'Electrical Principles - Year ' || v_year
        WHEN 'ECE' THEN 'Electronics & Circuits - Year ' || v_year
        WHEN 'MECH' THEN 'Mechanical Engineering - Year ' || v_year
        WHEN 'CIVIL' THEN 'Civil Engineering - Year ' || v_year
      END,
      course || '_' || LPAD(v_year::text, 3, '0') || '_' || row_number() OVER (ORDER BY course),
      course,
      v_year
    FROM (
      SELECT 'AIML' as course
      UNION SELECT 'AIDS'
      UNION SELECT 'EEE'
      UNION SELECT 'ECE'
      UNION SELECT 'MECH'
      UNION SELECT 'CIVIL'
    ) courses
    ON CONFLICT (code) DO NOTHING;
  END LOOP;
END $$;

-- Insert sample students for new courses
INSERT INTO students (student_id, name, email, course, year, section)
SELECT
  'STU_' || course || '_' || row_number() OVER (PARTITION BY course ORDER BY course),
  'Student ' || row_number() OVER (PARTITION BY course ORDER BY course) || ' - ' || course,
  'student' || row_number() OVER (PARTITION BY course ORDER BY course) || '@' || LOWER(course) || '.edu',
  course,
  (row_number() OVER (PARTITION BY course ORDER BY course) - 1) / 15 + 1,
  CASE ((row_number() OVER (PARTITION BY course ORDER BY course) - 1) % 3)
    WHEN 0 THEN 'A'
    WHEN 1 THEN 'B'
    ELSE 'C'
  END
FROM (
  SELECT 'AIML' as course FROM generate_series(1, 45)
  UNION ALL SELECT 'AIDS' FROM generate_series(1, 45)
  UNION ALL SELECT 'EEE' FROM generate_series(1, 45)
  UNION ALL SELECT 'ECE' FROM generate_series(1, 45)
  UNION ALL SELECT 'MECH' FROM generate_series(1, 45)
  UNION ALL SELECT 'CIVIL' FROM generate_series(1, 45)
) new_students
ON CONFLICT (email) DO NOTHING;
