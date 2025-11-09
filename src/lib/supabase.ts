import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface Student {
  id: string
  student_id: string
  name: string
  email: string
  course: string
  year: number
  section: string
  created_at: string
}

export interface Subject {
  id: string
  name: string
  code: string
  course: string
  year: number
  created_at: string
}

export interface ClassSession {
  id: string
  subject_id: string
  date: string
  start_time: string
  end_time: string
  created_at: string
  subjects?: Subject
}

export interface AttendanceRecord {
  id: string
  student_id: string
  subject_id?: string   // ✅ made optional since attendance might not always be linked to subject
  session_id?: string   // ✅ optional too
  date: string
  time_in?: string | null
  time_out?: string | null
  status: 'present' | 'absent' | 'late'
  course?: string
  year?: number
  section?: string
  created_at: string
  students?: Student
  subjects?: Subject
  class_sessions?: ClassSession
}
