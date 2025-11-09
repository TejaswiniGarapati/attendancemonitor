import React, { useState, useEffect } from 'react'
import { 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  BookOpen,
  BarChart3
} from 'lucide-react'
import { supabase, Student, Subject, AttendanceRecord } from '../lib/supabase'

export default function Reports() {
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedYear, setSelectedYear] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchAttendanceData()
    }
  }, [dateRange])

  const fetchData = async () => {
    try {
      const [studentsData, subjectsData] = await Promise.all([
        supabase.from('students').select('*').order('name'),
        supabase.from('subjects').select('*').order('name')
      ])

      setStudents(studentsData.data || [])
      setSubjects(subjectsData.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendanceData = async () => {
    try {
      const { data } = await supabase
        .from('attendance_records')
        .select('*, students(name, course, year, section), subjects(name, code)')
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
        .order('date', { ascending: false })

      setAttendance(data || [])
    } catch (error) {
      console.error('Error fetching attendance data:', error)
    }
  }

  const getFilteredAttendance = () => {
    return attendance.filter(record => {
      if (selectedCourse && record.students?.course !== selectedCourse) return false
      if (selectedYear && record.students?.year.toString() !== selectedYear) return false
      return true
    })
  }

  const getAttendanceStats = () => {
    const filtered = getFilteredAttendance()
    const total = filtered.length
    const present = filtered.filter(r => r.status === 'present').length
    const late = filtered.filter(r => r.status === 'late').length
    const absent = filtered.filter(r => r.status === 'absent').length
    const rate = total > 0 ? ((present + late) / total * 100) : 0

    return { total, present, late, absent, rate }
  }

  const getStudentAttendanceReport = () => {
    const filtered = getFilteredAttendance()
    const studentStats = new Map()

    filtered.forEach(record => {
      const studentId = record.student_id
      if (!studentStats.has(studentId)) {
        studentStats.set(studentId, {
          student: record.students,
          total: 0,
          present: 0,
          late: 0,
          absent: 0
        })
      }
      
      const stats = studentStats.get(studentId)
      stats.total++
      stats[record.status]++
    })

    return Array.from(studentStats.values()).map(stats => ({
      ...stats,
      rate: stats.total > 0 ? ((stats.present + stats.late) / stats.total * 100) : 0
    })).sort((a, b) => b.rate - a.rate)
  }

  const getSubjectAttendanceReport = () => {
    const filtered = getFilteredAttendance()
    const subjectStats = new Map()

    filtered.forEach(record => {
      const subjectId = record.subject_id
      if (!subjectStats.has(subjectId)) {
        subjectStats.set(subjectId, {
          subject: record.subjects,
          total: 0,
          present: 0,
          late: 0,
          absent: 0
        })
      }
      
      const stats = subjectStats.get(subjectId)
      stats.total++
      stats[record.status]++
    })

    return Array.from(subjectStats.values()).map(stats => ({
      ...stats,
      rate: stats.total > 0 ? ((stats.present + stats.late) / stats.total * 100) : 0
    })).sort((a, b) => b.rate - a.rate)
  }

  const exportReport = () => {
    const stats = getAttendanceStats()
    const studentReport = getStudentAttendanceReport()
    const subjectReport = getSubjectAttendanceReport()

    const csvContent = [
      'Attendance Report',
      `Period: ${dateRange.startDate} to ${dateRange.endDate}`,
      '',
      'Overall Statistics',
      'Total Records,Present,Late,Absent,Attendance Rate',
      `${stats.total},${stats.present},${stats.late},${stats.absent},${stats.rate.toFixed(2)}%`,
      '',
      'Student Attendance Report',
      'Name,Student ID,Course,Total,Present,Late,Absent,Attendance Rate',
      ...studentReport.map(s => 
        `${s.student?.name || 'Unknown'},${s.student?.student_id || 'N/A'},${s.student?.course || 'N/A'},${s.total},${s.present},${s.late},${s.absent},${s.rate.toFixed(2)}%`
      ),
      '',
      'Subject Attendance Report',
      'Subject,Code,Total,Present,Late,Absent,Attendance Rate',
      ...subjectReport.map(s => 
        `${s.subject?.name || 'Unknown'},${s.subject?.code || 'N/A'},${s.total},${s.present},${s.late},${s.absent},${s.rate.toFixed(2)}%`
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const stats = getAttendanceStats()
  const studentReport = getStudentAttendanceReport()
  const subjectReport = getSubjectAttendanceReport()

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              Attendance Reports & Analytics
            </h1>
            <p className="text-gray-400 mt-2">Generate detailed attendance reports and insights</p>
          </div>
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300"
          >
            <Download className="h-5 w-5" />
            Export Report
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-400 mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
              />
            </div>

            {/* Fixed Course List */}
            <div>
              <label className="block text-gray-400 mb-2">Course</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
              >
                <option value="">All Courses</option>
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
              <label className="block text-gray-400 mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 text-white"
              >
                <option value="">All Years</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
            </div>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Present</p>
                <p className="text-2xl font-bold text-green-400">{stats.present}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Late</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.late}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Absent</p>
                <p className="text-2xl font-bold text-red-400">{stats.absent}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-400" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Attendance Rate</p>
                <p className="text-2xl font-bold text-purple-400">{stats.rate.toFixed(1)}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Student Report */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="h-6 w-6 text-orange-400" />
            <h2 className="text-xl font-semibold text-white">Student Attendance Report</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Student</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">ID</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Course</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Total</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Present</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Late</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Absent</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Rate</th>
                </tr>
              </thead>
              <tbody>
                {studentReport.slice(0, 10).map((report, index) => (
                  <tr key={index} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4 text-white">{report.student?.name || 'Unknown'}</td>
                    <td className="py-3 px-4 text-gray-400">{report.student?.student_id || 'N/A'}</td>
                    <td className="py-3 px-4 text-cyan-400">{report.student?.course || 'N/A'}</td>
                    <td className="py-3 px-4 text-gray-400">{report.total}</td>
                    <td className="py-3 px-4 text-green-400">{report.present}</td>
                    <td className="py-3 px-4 text-yellow-400">{report.late}</td>
                    <td className="py-3 px-4 text-red-400">{report.absent}</td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${
                        report.rate >= 90 
                          ? 'text-green-400' 
                          : report.rate >= 75 
                          ? 'text-yellow-400' 
                          : 'text-red-400'
                      }`}>
                        {report.rate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subject Report */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="h-6 w-6 text-orange-400" />
            <h2 className="text-xl font-semibold text-white">Subject Attendance Report</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Subject</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Code</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Total</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Present</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Late</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Absent</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Rate</th>
                </tr>
              </thead>
              <tbody>
                {subjectReport.map((report, index) => (
                  <tr key={index} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4 text-white">{report.subject?.name || 'Unknown'}</td>
                    <td className="py-3 px-4 text-gray-400">{report.subject?.code || 'N/A'}</td>
                    <td className="py-3 px-4 text-gray-400">{report.total}</td>
                    <td className="py-3 px-4 text-green-400">{report.present}</td>
                    <td className="py-3 px-4 text-yellow-400">{report.late}</td>
                    <td className="py-3 px-4 text-red-400">{report.absent}</td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${
                        report.rate >= 90 
                          ? 'text-green-400' 
                          : report.rate >= 75 
                          ? 'text-yellow-400' 
                          : 'text-red-400'
                      }`}>
                        {report.rate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
