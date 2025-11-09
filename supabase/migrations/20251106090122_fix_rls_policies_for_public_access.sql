/*
  # Fix RLS Policies for Public Access

  1. Changes
    - Drop existing restrictive policies that require authentication
    - Create new policies that allow public access for all operations
    - This is appropriate for a school attendance system where authentication
      is not required and staff can freely manage students and attendance

  2. Security Notes
    - All tables (students, subjects, class_sessions, attendance_records) 
      will be accessible to anonymous users
    - This allows the application to function without authentication
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read students" ON students;
DROP POLICY IF EXISTS "Allow authenticated users to manage students" ON students;
DROP POLICY IF EXISTS "Allow authenticated users to read subjects" ON subjects;
DROP POLICY IF EXISTS "Allow authenticated users to manage subjects" ON subjects;
DROP POLICY IF EXISTS "Allow authenticated users to read class_sessions" ON class_sessions;
DROP POLICY IF EXISTS "Allow authenticated users to manage class_sessions" ON class_sessions;
DROP POLICY IF EXISTS "Allow authenticated users to read attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "Allow authenticated users to manage attendance_records" ON attendance_records;

-- Create public access policies for students
CREATE POLICY "Allow public read access to students"
  ON students FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to students"
  ON students FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to students"
  ON students FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to students"
  ON students FOR DELETE
  USING (true);

-- Create public access policies for subjects
CREATE POLICY "Allow public read access to subjects"
  ON subjects FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to subjects"
  ON subjects FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to subjects"
  ON subjects FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to subjects"
  ON subjects FOR DELETE
  USING (true);

-- Create public access policies for class_sessions
CREATE POLICY "Allow public read access to class_sessions"
  ON class_sessions FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to class_sessions"
  ON class_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to class_sessions"
  ON class_sessions FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to class_sessions"
  ON class_sessions FOR DELETE
  USING (true);

-- Create public access policies for attendance_records
CREATE POLICY "Allow public read access to attendance_records"
  ON attendance_records FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to attendance_records"
  ON attendance_records FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to attendance_records"
  ON attendance_records FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to attendance_records"
  ON attendance_records FOR DELETE
  USING (true);
