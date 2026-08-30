import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAppSettings } from '../context/AppSettingsContext'

function ForgotPassword() {
  const { schoolName } = useAppSettings()
  const [identifier, setIdentifier] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [resetUrl, setResetUrl] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setResetUrl('')
    try {
      const response = await api.post('/auth/forgot-password', { email: identifier })
      setMessage(response.data?.message || 'Check your registered email for reset instructions.')
      setResetUrl(response.data?.reset_url || '')
    } catch (error) {
      setMessage(error.response?.data?.error || error.message || 'Could not request a password reset.')
    } finally {
      setLoading(false)
    }
  }

  return <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-[#0f0f1a]">
    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-[#2a2a4a] dark:bg-[#1a1a2e]">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot password</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Enter your {schoolName} username or registered email address.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username or email
          <input required value={identifier} onChange={(event) => setIdentifier(event.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 dark:border-[#2a2a4a] dark:bg-[#0f0f1a] dark:text-white" />
        </label>
        <button disabled={loading} className="w-full rounded-xl bg-blue-600 px-4 py-2.5 font-bold text-white disabled:opacity-60">{loading ? 'Sending…' : 'Send Reset Link'}</button>
      </form>
      {message && <p className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">{message}</p>}
      {resetUrl && <a href={resetUrl} className="mt-3 block rounded-xl bg-amber-100 p-3 text-center text-sm font-bold text-amber-900 hover:bg-amber-200">Open local development reset link</a>}
      <Link to="/login" className="mt-6 block text-center text-sm font-semibold text-blue-600 hover:underline">Back to Login</Link>
    </div>
  </div>
}

export default ForgotPassword
