import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { CheckCircle2, Loader } from 'lucide-react'
import type { Student, Subject, AttendanceRecord, ClassSession } from '../lib/supabase'

interface Period {
  id: string
  period_number: number
  name: string
  start_time: string
  end_time: string
  created_at: string
}

export default function AttendanceTracker() {
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [periods, setPeriods] = useState<Period[]>([])
  const [sessions, setSessions] = useState<ClassSession[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedYear, setSelectedYear] = useState<number | ''>('')
  const [selectedSection, setSelectedSection] = useState('')
  const [showMarkAttendance, setShowMarkAttendance] = useState(false)
  const [attendanceData, setAttendanceData] = useState<{ [studentId: string]: 'present' | 'absent' | 'late' }>({})
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [markedList, setMarkedList] = useState<{ name: string; status: string }[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedSubject && selectedPeriod && selectedDate) {
      fetchSessions()
      fetchAttendance()

      const subscription = supabase
        .channel(`attendance:${selectedSubject}:${selectedPeriod}:${selectedDate}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'attendance_records',
            filter: `subject_id=eq.${selectedSubject}`
          },
          (payload) => {
            if (payload.new && payload.new.date === selectedDate) {
              fetchAttendance()
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(subscription)
      }
    }
  }, [selectedSubject, selectedPeriod, selectedDate])

  const fetchData = async () => {
    try {
      const [studentsRes, subjectsRes, periodsRes] = await Promise.all([
        supabase.from('students').select('*').order('name'),
        supabase.from('subjects').select('*').order('name'),
        supabase.from('periods').select('*').order('period_number')
      ])

      setStudents(studentsRes.data || [])
      setSubjects(subjectsRes.data || [])
      setPeriods((periodsRes.data || []).filter(p => p.name.toLowerCase() !== 'lunch break'))
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSessions = async () => {
    const { data } = await supabase
      .from('class_sessions')
      .select('*')
      .eq('subject_id', selectedSubject)
      .eq('date', selectedDate)
      .eq('period_id', selectedPeriod)
    setSessions(data || [])
  }

  const fetchAttendance = async () => {
    setRefreshing(true)
    try {
      const { data } = await supabase
        .from('attendance_records')
        .select('*, students(name, student_id, course, year, section), class_sessions(period_id)')
        .eq('date', selectedDate)
        .eq('subject_id', selectedSubject)

      const filteredData = data?.filter(record =>
        record.class_sessions?.period_id === selectedPeriod
      ) || []

      setAttendance(filteredData)
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleMarkAttendance = async () => {
    if (!selectedSubject || !selectedPeriod || !selectedDate) return

    try {
      let sessionId = sessions[0]?.id
      if (!sessionId) {
        const { data: newSession } = await supabase
          .from('class_sessions')
          .insert([
            {
              subject_id: selectedSubject,
              date: selectedDate,
              period_id: selectedPeriod,
              start_time: periods.find(p => p.id === selectedPeriod)?.start_time,
              end_time: periods.find(p => p.id === selectedPeriod)?.end_time
            }
          ])
          .select()
          .single()
        sessionId = newSession?.id
      }

      const records = Object.entries(attendanceData).map(([studentId, status]) => ({
        student_id: studentId,
        subject_id: selectedSubject,
        session_id: sessionId,
        date: selectedDate,
        status,
        time_in: status !== 'absent' ? new Date().toISOString() : null
      }))

      await supabase.from('attendance_records').upsert(records, { onConflict: 'student_id,subject_id,session_id,date' })

      const marked = Object.entries(attendanceData).map(([id, status]) => {
        const student = students.find(s => s.id === id)
        return { name: student?.name || 'Unknown', status }
      })
      setMarkedList(marked)

      setShowMarkAttendance(false)
      setAttendanceData({})
      setShowSuccessDialog(true)

      await fetchAttendance()

      setTimeout(() => setShowSuccessDialog(false), 3000)
    } catch (error) {
      console.error('Error saving attendance:', error)
    }
  }

  const filteredStudents = students.filter((s) => {
    if (!selectedCourse && !selectedYear && !selectedSection) return true
    return (
      (!selectedCourse || s.course === selectedCourse) &&
      (!selectedYear || s.year === selectedYear) &&
      (!selectedSection || s.section === selectedSection)
    )
  })

  const getAttendanceStats = () => {
    const total = attendance.length
    const present = attendance.filter(r => r.status === 'present').length
    const late = attendance.filter(r => r.status === 'late').length
    const absent = attendance.filter(r => r.status === 'absent').length
    const rate = total > 0 ? ((present + late) / total * 100) : 0

    return { total, present, late, absent, rate }
  }

  const stats = getAttendanceStats()

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-2 border-green-500 rounded-full border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
          Attendance Tracker
        </h1>

        {/* Filters */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-gray-400 mb-2">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-gray-800 px-3 py-2 rounded-lg border border-gray-700"
            >
              <option value="">Select Subject</option>
              {subjects.map(sub => (
                <option key={sub.id} value={sub.id}>
                  {sub.code} - {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-400 mb-2">Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full bg-gray-800 px-3 py-2 rounded-lg border border-gray-700"
            >
              <option value="">Select Period</option>
              {periods.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.start_time}-{p.end_time})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-400 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-gray-800 px-3 py-2 rounded-lg border border-gray-700"
            />
          </div>

          <div>
            <label className="block text-gray-400 mb-2">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full bg-gray-800 px-3 py-2 rounded-lg border border-gray-700"
            >
              <option value="">All</option>
              {[1, 2, 3, 4].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
         <div>
  <label className="block text-gray-400 mb-2">Course</label>
  <select
    value={selectedCourse}
    onChange={(e) => setSelectedCourse(e.target.value)}
    className="w-full bg-gray-800 px-3 py-2 rounded-lg border border-gray-700"
  >
    <option value="">All</option>
    <option value="Computer Science and Engineering">Computer Science and Engineering</option>
    <option value="Information Technology">Information Technology</option>
    <option value="Electronics and Communication Engineering">Electronics and Communication Engineering</option>
    <option value="Electrical and Electronics Engineering">Electrical and Electronics Engineering</option>
    <option value="Mechanical Engineering">Mechanical Engineering</option>
    <option value="Civil Engineering">Civil Engineering</option>
    <option value="Artificial Intelligence and Data Science">Artificial Intelligence and Data Science</option>
    <option value="Artificial Intelligence and Machine Learning">Artificial Intelligence and Machine Learning</option>
    <option value="Electronics and Instrumentation Engineering">Electronics and Instrumentation Engineering</option>
    <option value="Bio Technology">Bio Technology</option>
    <option value="Chemical Engineering">Chemical Engineering</option>
    <option value="Aeronautical Engineering">Aeronautical Engineering</option>
    <option value="Automobile Engineering">Automobile Engineering</option>
  </select>
</div>


          <div>
            <label className="block text-gray-400 mb-2">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full bg-gray-800 px-3 py-2 rounded-lg border border-gray-700"
            >
              <option value="">All</option>
              {[...new Set(students.map(s => s.section))].map(section => (
                <option key={section}>{section}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        {selectedSubject && selectedPeriod && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Present</p>
                  <p className="text-2xl font-bold text-green-400">{stats.present}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Late</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.late}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Absent</p>
                  <p className="text-2xl font-bold text-red-400">{stats.absent}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Attendance Rate</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.rate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Button */}
        <div className="text-center">
          <button
            disabled={!selectedSubject || !selectedPeriod}
            onClick={() => setShowMarkAttendance(true)}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
          >
            Mark Attendance
          </button>
        </div>

        {/* Attendance Records */}
        {selectedSubject && selectedPeriod && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Attendance Records</h2>
              {refreshing && <Loader className="h-5 w-5 animate-spin text-green-400" />}
            </div>

            {attendance.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No attendance records found for this selection.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Student Name</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">ID</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Course</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Year</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Time In</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((record) => (
                      <tr key={record.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                        <td className="py-3 px-4 text-white">{record.students?.name}</td>
                        <td className="py-3 px-4 text-gray-400">{record.students?.student_id}</td>
                        <td className="py-3 px-4 text-gray-400">{record.students?.course}</td>
                        <td className="py-3 px-4 text-gray-400">{record.students?.year}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            record.status === 'present'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : record.status === 'late'
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {record.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-400">
                          {record.time_in ? new Date(record.time_in).toLocaleTimeString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Attendance Modal */}
        {showMarkAttendance && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Mark Attendance</h2>
                <button onClick={() => setShowMarkAttendance(false)}>✕</button>
              </div>

              {filteredStudents.length === 0 ? (
                <p className="text-center text-gray-400">No students found.</p>
              ) : (
                filteredStudents.map(student => (
                  <div key={student.id} className="flex justify-between items-center bg-gray-800 p-3 rounded-lg mb-2">
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-gray-400 text-sm">
                        {student.student_id} • {student.course} • Year {student.year} • Sec {student.section}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {['present', 'late', 'absent'].map(status => (
                        <button
                          key={status}
                          onClick={() => setAttendanceData({ ...attendanceData, [student.id]: status as any })}
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            attendanceData[student.id] === status
                              ? status === 'present'
                                ? 'bg-green-500 text-white'
                                : status === 'late'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-red-500 text-white'
                              : 'bg-gray-700 text-gray-300 hover:opacity-80'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowMarkAttendance(false)}
                  className="flex-1 border border-gray-600 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkAttendance}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 py-2 rounded-lg font-semibold"
                >
                  Save Attendance
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Dialog */}
        {showSuccessDialog && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 transition-opacity">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 text-center w-full max-w-md animate-fadeIn">
              <CheckCircle2 className="text-green-400 mx-auto mb-3" size={40} />
              <h2 className="text-lg font-semibold mb-3">Attendance Marked Successfully!</h2>
              <div className="text-left space-y-1 max-h-60 overflow-y-auto px-2">
                {markedList.map((m, idx) => (
                  <p key={idx} className="text-gray-300">
                    <span className="font-medium">{m.name}</span> —{' '}
                    <span
                      className={
                        m.status === 'present'
                          ? 'text-green-400'
                          : m.status === 'late'
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }
                    >
                      {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                    </span>
                  </p>
                ))}
              </div>
              <p className="text-gray-400 text-sm mt-4">Records will be displayed below automatically</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 