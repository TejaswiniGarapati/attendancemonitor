import React from 'react'
import {
  BarChart3,
  Users,
  Calendar,
  BookOpen,
  FileText,
  Monitor,
  LogOut
} from 'lucide-react'

interface NavigationProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  username?: string
  userRole?: 'admin' | 'teacher' | 'student' | null
  onLogout?: () => void
}

export default function Navigation({ activeTab, setActiveTab, username, userRole, onLogout }: NavigationProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'reports', label: 'Reports', icon: FileText },
  ]

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Monitor className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">AttendanceHub</h1>
              <p className="text-xs text-gray-400">College Management System</p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              )
            })}
          </div>

          {/* User Info & Logout */}
          {username && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{username}</p>
                <p className="text-xs text-gray-400 capitalize">{userRole}</p>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}