import React, { useState } from 'react'
import { LogIn, AlertCircle } from 'lucide-react'

interface LoginProps {
  onLogin: (username: string, role: 'admin' | 'teacher') => void
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'teacher'>('teacher')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password')
      return
    }

    // ✅ Demo credentials for admin & teacher
    const validUsers = {
      admin: { username: 'admin', password: 'admin123' },
      teacher: { username: 'teacher', password: 'teach123' },
    }

    if (
      username === validUsers[role].username &&
      password === validUsers[role].password
    ) {
      onLogin(username, role)
    } else {
      setError('Invalid username or password')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">AttendanceHub</h1>
          <p className="text-slate-400">Admin & Teacher Login Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/30 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Input */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-3">
                Login as
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['admin', 'teacher'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`px-4 py-3 rounded-lg font-medium transition-all text-sm capitalize ${
                      role === r
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-slate-600'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/20"
            >
              Sign In
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-slate-700/30">
            <div className="space-y-2 text-xs text-slate-400">
              <p className="font-medium text-slate-300">Demo Credentials:</p>
              <p>Admin → Username: <strong>admin</strong> | Password: <strong>admin123</strong></p>
              <p>Teacher → Username: <strong>teacher</strong> | Password: <strong>teach123</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
