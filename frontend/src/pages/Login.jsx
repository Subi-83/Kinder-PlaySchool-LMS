import React, { useState } from 'react'
import { useAppSettings } from '../context/AppSettingsContext'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

function Login() {
  const { schoolName } = useAppSettings()
  const schoolInitials = (schoolName || 'School')
    .trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((word) => word[0]).join('').toUpperCase()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const { login } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f0f1a] p-4">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-white dark:bg-[#1a1a2e] shadow-sm border border-gray-200 dark:border-[#2a2a4a]"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-[#2a2a4a]">
          {/* Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500 text-white text-2xl font-bold mb-4">
              {schoolInitials}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{schoolName}</h1>
            <p className="text-gray-500 dark:text-gray-400">Library Management System</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username / Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter your username"
                required
                disabled={loading}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Demo Credentials:
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Admin: <span className="font-mono">admin / admin123</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Staff: <span className="font-mono">staff / staff123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
