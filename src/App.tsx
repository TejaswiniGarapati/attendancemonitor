import React, { useState, useEffect } from 'react'
import Navigation from './components/Navigation'
import Dashboard from './components/Dashboard'
import StudentManager from './components/StudentManager'
import AttendanceTracker from './components/AttendanceTracker'
import SubjectManager from './components/SubjectManager'
import Reports from './components/Reports'
import Login from './components/Login'

function App() {
  // Authentication and state management
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState<'admin' | 'teacher' | null>(null)
  const [username, setUsername] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard')

  // Load from localStorage (if logged in previously)
  useEffect(() => {
    const savedAuth = localStorage.getItem('isAuthenticated')
    const savedRole = localStorage.getItem('userRole')
    const savedUsername = localStorage.getItem('username')

    if (savedAuth === 'true' && savedRole) {
      setIsAuthenticated(true)
      setUserRole(savedRole as 'admin' | 'teacher')
      setUsername(savedUsername || '')
    }
  }, [])

  // Handle login success
  const handleLogin = (inputUsername: string, role: 'admin' | 'teacher') => {
    setUsername(inputUsername)
    setUserRole(role)
    setIsAuthenticated(true)

    // Persist session
    localStorage.setItem('isAuthenticated', 'true')
    localStorage.setItem('userRole', role)
    localStorage.setItem('username', inputUsername)
  }

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false)
    setUserRole(null)
    setUsername('')
    setActiveTab('dashboard')

    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('userRole')
    localStorage.removeItem('username')
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  // Dynamic page rendering
  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'students':
        return <StudentManager />
      case 'attendance':
        return <AttendanceTracker />
      case 'subjects':
        return <SubjectManager />
      case 'reports':
        return <Reports />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation bar with logout */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        username={username}
        userRole={userRole}
        onLogout={handleLogout}
      />

      {/* Main content area */}
      <main className="p-4">{renderActiveComponent()}</main>
    </div>
  )
}

export default App
