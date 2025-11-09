/*
  # Student Attendance Monitoring System (Extended Version)
  - Includes all major engineering branches
  - Works with Supabase (PostgreSQL)
*/

-- Existing Tables ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text UNIQUE NOT NULL,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  course text NOT NULL,
  year integer NOT NULL DEFAULT 1,
  section text NOT NULL DEFAULT 'A',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  course text NOT NULL,
  year integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS class_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  session_id uuid REFERENCES class_sessions(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  time_in timestamptz,
  time_out timestamptz,
  status text NOT NULL DEFAULT 'absent' CHECK (status IN ('present', 'absent', 'late')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS ------------------------------------------------------------

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users -------------------------------------

CREATE POLICY "Allow authenticated users to read students"
  ON students FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage students"
  ON students FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read subjects"
  ON subjects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage subjects"
  ON subjects FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read class_sessions"
  ON class_sessions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage class_sessions"
  ON class_sessions FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read attendance_records"
  ON attendance_records FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage attendance_records"
  ON attendance_records FOR ALL TO authenticated USING (true);

-- Sample Data -----------------------------------------------------------

-- Students
INSERT INTO students (student_id, name, email, course, year, section) VALUES
  ('STU001', 'John Doe', 'john.doe@college.edu', 'Computer Science', 3, 'A'),
  ('STU002', 'Jane Smith', 'jane.smith@college.edu', 'Computer Science', 3, 'A'),
  ('STU003', 'Mike Johnson', 'mike.johnson@college.edu', 'Computer Science', 2, 'B'),
  ('STU004', 'Sarah Wilson', 'sarah.wilson@college.edu', 'Information Technology', 4, 'A'),
  ('STU005', 'David Brown', 'david.brown@college.edu', 'Computer Science', 1, 'C'),
  ('STU006', 'Emily Davis', 'emily.davis@college.edu', 'Information Technology', 2, 'A'),
  ('STU007', 'Chris Miller', 'chris.miller@college.edu', 'Computer Science', 3, 'B'),
  ('STU008', 'Lisa Anderson', 'lisa.anderson@college.edu', 'Information Technology', 4, 'B'),

  -- New Engineering Branches
  ('STU009', 'Arjun Patel', 'arjun.patel@college.edu', 'Electronics and Communication Engineering', 3, 'A'),
  ('STU010', 'Priya Sharma', 'priya.sharma@college.edu', 'Mechanical Engineering', 2, 'B'),
  ('STU011', 'Rahul Verma', 'rahul.verma@college.edu', 'Civil Engineering', 4, 'A'),
  ('STU012', 'Sneha Reddy', 'sneha.reddy@college.edu', 'Electrical Engineering', 3, 'A'),
  ('STU013', 'Vikram Singh', 'vikram.singh@college.edu', 'Aerospace Engineering', 2, 'A'),
  ('STU014', 'Anjali Gupta', 'anjali.gupta@college.edu', 'Chemical Engineering', 4, 'B'),
  ('STU015', 'Naveen Kumar', 'naveen.kumar@college.edu', 'Biotechnology', 1, 'A');

-- Subjects for all courses
INSERT INTO subjects (name, code, course, year) VALUES
  -- Computer Science
  ('Data Structures', 'CS301', 'Computer Science', 3),
  ('Database Systems', 'CS302', 'Computer Science', 3),
  ('Machine Learning', 'CS401', 'Computer Science', 4),
  ('Programming Fundamentals', 'CS101', 'Computer Science', 1),

  -- Information Technology
  ('Web Development', 'IT201', 'Information Technology', 2),
  ('Network Security', 'IT401', 'Information Technology', 4),

  -- Electronics and Communication
  ('Digital Signal Processing', 'ECE301', 'Electronics and Communication Engineering', 3),
  ('Microprocessors', 'ECE302', 'Electronics and Communication Engineering', 3),

  -- Mechanical Engineering
  ('Thermodynamics', 'ME201', 'Mechanical Engineering', 2),
  ('Fluid Mechanics', 'ME301', 'Mechanical Engineering', 3),

  -- Civil Engineering
  ('Structural Analysis', 'CE401', 'Civil Engineering', 4),
  ('Surveying', 'CE201', 'Civil Engineering', 2),

  -- Electrical Engineering
  ('Power Systems', 'EE301', 'Electrical Engineering', 3),
  ('Control Systems', 'EE302', 'Electrical Engineering', 3),

  -- Aerospace Engineering
  ('Flight Mechanics', 'AE201', 'Aerospace Engineering', 2),
  ('Aerodynamics', 'AE301', 'Aerospace Engineering', 3),

  -- Chemical Engineering
  ('Process Control', 'CH401', 'Chemical Engineering', 4),
  ('Fluid Transport', 'CH301', 'Chemical Engineering', 3),

  -- Biotechnology
  ('Genetic Engineering', 'BT201', 'Biotechnology', 2),
  ('Cell Biology', 'BT101', 'Biotechnology', 1);

-- Class Sessions (7 days × 7 periods)
INSERT INTO class_sessions (subject_id, date, start_time, end_time)
SELECT 
  s.id,
  CURRENT_DATE - INTERVAL '1 day' * gs.day AS date,
  p.start_time,
  p.end_time
FROM subjects s
CROSS JOIN generate_series(0, 6) AS gs(day)
CROSS JOIN (
  VALUES
    ('09:00:00'::time, '10:30:00'::time),
    ('10:30:00'::time, '12:00:00'::time),
    ('12:00:00'::time, '13:30:00'::time),
    ('13:30:00'::time, '15:00:00'::time),
    ('15:00:00'::time, '16:30:00'::time),
    ('16:30:00'::time, '18:00:00'::time),
    ('18:00:00'::time, '19:30:00'::time)
) AS p(start_time, end_time)
WHERE s.code IN ('CS301', 'CS302', 'IT201', 'ECE301', 'ME201', 'EE301', 'CE401', 'AE201', 'CH401', 'BT201')
ORDER BY s.id, date, start_time;

-- Random Attendance Records
INSERT INTO attendance_records (student_id, subject_id, session_id, date, time_in, status)
SELECT 
  st.id,
  su.id,
  cs.id,
  cs.date,
  cs.date + cs.start_time + INTERVAL '5 minutes' * (random() * 10),
  CASE 
    WHEN random() < 0.8 THEN 'present'
    WHEN random() < 0.9 THEN 'late'
    ELSE 'absent'
  END
FROM students st
CROSS JOIN subjects su
JOIN class_sessions cs ON cs.subject_id = su.id
WHERE st.course = su.course 
  AND st.year = su.year
  AND cs.date >= CURRENT_DATE - INTERVAL '6 days'
  AND random() < 0.9;
