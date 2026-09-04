import React, { useState } from 'react'
import { useAppSettings } from '../context/AppSettingsContext'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader2, User, Lock, Eye, EyeOff, LogIn, BookOpen } from 'lucide-react'
import ThemeToggle from '../components/common/ThemeToggle'
import loginHero from '../assets/login-hero.jpg'

function Login() {
  const { schoolName } = useAppSettings()
  const schoolInitials = (schoolName || 'School')
    .trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((word) => word[0]).join('').toUpperCase()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const { login } = useAuth()
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-[#0a0a14] dark:via-[#0d0d1a] dark:to-[#0a0a14]">
      {/* Decorative classroom photo: left portion only, feathered into the
          plain gradient on its right edge so it never has to visually
          collide with the real card — no matter the viewport width. */}
      <div
        className="hidden md:block absolute inset-y-0 left-0 w-[64%] lg:w-[56%] bg-cover bg-left"
        style={{
          backgroundImage: `url(${loginHero})`,
          WebkitMaskImage: 'linear-gradient(to right, black 65%, transparent 100%)',
          maskImage: 'linear-gradient(to right, black 65%, transparent 100%)',
        }}
      />
      <div className="hidden md:block absolute inset-y-0 left-0 w-[64%] lg:w-[56%] bg-black/0 dark:bg-black/45" style={{
        WebkitMaskImage: 'linear-gradient(to right, black 65%, transparent 100%)',
        maskImage: 'linear-gradient(to right, black 65%, transparent 100%)',
      }} />

      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <div className="rounded-full bg-white dark:bg-[#1a1a2e] shadow-md">
          <ThemeToggle />
        </div>
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center lg:justify-end px-4 py-10 sm:px-8 lg:pr-[7%]">
        <div className="w-full max-w-md">
          <div className="relative">
            {/* Brand badge, floating over the card's top edge */}
            <div className="absolute left-1/2 -top-8 -translate-x-1/2 z-10 flex h-16 w-16 items-center justify-center rounded-full bg-primary-main text-xl font-bold text-white shadow-lg ring-4 ring-white dark:ring-[#1a1a2e]">
              {schoolInitials}
            </div>

            <div className="rounded-3xl bg-white dark:bg-[#1a1a2e] px-7 pb-8 pt-12 shadow-2xl sm:px-9">
              {/* Brand */}
              <div className="text-center mb-6">
                <h1 className="text-xl font-bold leading-snug text-gray-900 dark:text-white">{schoolName}</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Library Management System</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-sm border border-rose-200 dark:border-rose-800">
                  {error}
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-4">
                  <label htmlFor="login-username" className="form-label">
                    Username / Email
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                    <input
                      id="login-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="form-input pl-10"
                      placeholder="Enter your username"
                      required
                      disabled={loading}
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="mb-2">
                  <label htmlFor="login-password" className="form-label">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input pl-10 pr-10"
                      placeholder="Enter your password"
                      required
                      disabled={loading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                <div className="mb-5 text-right">
                  <Link to="/forgot-password" className="text-sm font-semibold text-primary-main hover:underline dark:text-blue-400">Forgot password?</Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full py-2.5"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LogIn className="h-4 w-4" aria-hidden="true" />}
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

              {/* Demo Credentials */}
              <div className="mt-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                <span className="h-px flex-1 bg-gray-200 dark:bg-[#2a2a4a]" />
                Or try demo
                <span className="h-px flex-1 bg-gray-200 dark:bg-[#2a2a4a]" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-gray-50 dark:bg-[#10101d] border border-gray-100 dark:border-[#2a2a4a] p-3.5 text-xs">
                <div>
                  <p className="font-semibold text-gray-600 dark:text-gray-300">Admin:</p>
                  <p className="mt-0.5 font-mono text-gray-500 dark:text-gray-400">admin / admin123</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-600 dark:text-gray-300">Staff:</p>
                  <p className="mt-0.5 font-mono text-gray-500 dark:text-gray-400">staff / staff123</p>
                </div>
              </div>

              {/* Quote */}
              <div className="mt-6 flex items-start justify-center gap-2 text-center">
                <BookOpen className="h-4 w-4 mt-0.5 shrink-0 text-primary-main dark:text-blue-400" aria-hidden="true" />
                <p className="text-sm italic text-gray-500 dark:text-gray-400">
                  "Today a reader, tomorrow a leader."<br />
                  <span className="not-italic text-xs text-gray-400 dark:text-gray-500">— {schoolName}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
