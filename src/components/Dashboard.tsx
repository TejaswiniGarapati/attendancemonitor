import React, { useState, useEffect } from 'react'
import {
  Users,
  Calendar,
  TrendingUp,
  BarChart3,
  UserCheck,
  UserX,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import { supabase, AttendanceRecord } from '../lib/supabase'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    attendanceRate: 0
  })
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    fetchDashboardData()

    const channel = supabase
      .channel('attendance_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance_records' },
        (payload) => {
          console.log('🔄 Attendance change detected:', payload.eventType)
          fetchDashboardData()
        }
      )
      .subscribe()

    const interval = setInterval(fetchDashboardData, 30000)

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [])

  const refreshRecentData = async () => {
    setIsUpdating(true)
    try {
      const { data: recentData } = await supabase
        .from('attendance_records')
        .select('*, students(name, student_id), subjects(name, code)')
        .order('created_at', { ascending: false })
        .limit(10)
      setRecentAttendance(recentData || [])
    } catch (error) {
      console.error('Error refreshing recent data:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const fetchDashboardData = async () => {
    setIsUpdating(true)
    try {
      const { data: students } = await supabase.from('students').select('*')

      const today = new Date().toISOString().split('T')[0]
      const { data: todayAttendance } = await supabase
        .from('attendance_records')
        .select('*, students(name, student_id), subjects(name, code)')
        .eq('date', today)
        .order('created_at', { ascending: false })

      const { data: recentData } = await supabase
        .from('attendance_records')
        .select('*, students(name, student_id), subjects(name, code)')
        .order('created_at', { ascending: false })
        .limit(10)

      const totalStudents = students?.length || 0
      const presentCount = todayAttendance?.filter(r => r.status === 'present').length || 0
      const absentCount = todayAttendance?.filter(r => r.status === 'absent').length || 0
      const lateCount = todayAttendance?.filter(r => r.status === 'late').length || 0
      const attendanceRate = totalStudents > 0 ? ((presentCount + lateCount) / totalStudents) * 100 : 0

      setStats({
        totalStudents,
        presentToday: presentCount,
        absentToday: absentCount,
        lateToday: lateCount,
        attendanceRate
      })

      setRecentAttendance(recentData || [])
      setLastUpdated(new Date())
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
      setIsUpdating(false)
    }
  }

  const StatCard = ({ title, value, icon: Icon, color, bgColor }: any) => (
    <div
      className={`relative overflow-hidden rounded-xl ${bgColor} border border-gray-800 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-105`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br from-${color}-500/10 to-transparent`}></div>
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className={`text-2xl font-bold text-${color}-400 mt-2`}>{value}</p>
        </div>
        <div className={`p-3 rounded-lg bg-${color}-500/20 border border-${color}-500/30`}>
          <Icon className={`h-6 w-6 text-${color}-400`} />
        </div>
      </div>
    </div>
  )

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
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Student Attendance Dashboard
          </h1>
          <p className="text-gray-400">
            Monitor and analyze student attendance in real-time
          </p>
          {lastUpdated && (
            <div className="flex items-center justify-center gap-2">
              <p className="text-xs text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
              {isUpdating && (
                <RefreshCw className="h-4 w-4 text-green-400 animate-spin" />
              )}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard title="Total Students" value={stats.totalStudents} icon={Users} color="cyan" bgColor="bg-gray-900/50" />
          <StatCard title="Present Today" value={stats.presentToday} icon={UserCheck} color="green" bgColor="bg-gray-900/50" />
          <StatCard title="Absent Today" value={stats.absentToday} icon={UserX} color="red" bgColor="bg-gray-900/50" />
          <StatCard title="Late Today" value={stats.lateToday} icon={AlertTriangle} color="yellow" bgColor="bg-gray-900/50" />
          <StatCard title="Attendance Rate" value={`${stats.attendanceRate.toFixed(1)}%`} icon={TrendingUp} color="purple" bgColor="bg-gray-900/50" />
        </div>

        {/* Recent Attendance */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-cyan-400" />
              <h2 className="text-xl font-semibold text-white">
                Recent Attendance Records
              </h2>
            </div>
            {isUpdating && (
              <div className="flex items-center gap-2 text-xs text-green-400">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Updating...
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Student</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">ID</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Subject</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentAttendance.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-white">
                      {record.students?.name || 'Unknown'}
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {record.students?.student_id || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-cyan-400">
                      {record.subjects?.code || 'Unknown'}
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.status === 'present'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : record.status === 'late'
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {record.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {record.time_in
                        ? new Date(record.time_in).toLocaleTimeString()
                        : '--:--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {recentAttendance.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No attendance records found.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
