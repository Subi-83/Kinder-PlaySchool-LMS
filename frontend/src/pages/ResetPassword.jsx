import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../services/api'

function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [complete, setComplete] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (password !== confirmPassword) return setMessage('Passwords do not match.')
    setLoading(true)
    setMessage('')
    try {
      const response = await api.post('/auth/reset-password', { token, new_password: password })
      setMessage(response.data?.message || 'Password reset successfully.')
      setComplete(true)
    } catch (error) {
      setMessage(error.response?.data?.error || error.message || 'Could not reset password.')
    } finally {
      setLoading(false)
    }
  }

  return <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-[#0f0f1a]">
    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl dark:border-[#2a2a4a] dark:bg-[#1a1a2e]">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Set new password</h1>
      {!token ? <p className="mt-4 text-sm text-red-600">The reset link is missing or invalid.</p> : !complete && <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium dark:text-gray-300">New password
          <input required minLength="8" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 dark:border-[#2a2a4a] dark:bg-[#0f0f1a] dark:text-white" />
        </label>
        <label className="block text-sm font-medium dark:text-gray-300">Confirm new password
          <input required minLength="8" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 dark:border-[#2a2a4a] dark:bg-[#0f0f1a] dark:text-white" />
        </label>
        <button disabled={loading} className="w-full rounded-xl bg-blue-600 px-4 py-2.5 font-bold text-white disabled:opacity-60">{loading ? 'Resetting…' : 'Reset Password'}</button>
      </form>}
      {message && <p className={`mt-4 rounded-xl border p-3 text-sm ${complete ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-700'}`}>{message}</p>}
      <Link to="/login" className="mt-6 block text-center text-sm font-semibold text-blue-600 hover:underline">Back to Login</Link>
    </div>
  </div>
}

export default ResetPassword
