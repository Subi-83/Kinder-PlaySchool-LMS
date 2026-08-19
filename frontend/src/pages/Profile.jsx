import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function Profile() {
  const { user, refreshUser } = useAuth()
  const [profile, setProfile] = useState({ full_name: user?.full_name || '', email: user?.email || '' })
  const [password, setPassword] = useState({ old_password: '', new_password: '', confirm: '' })
  const [message, setMessage] = useState('')

  const saveProfile = async (e) => {
    e.preventDefault()
    try {
      await api.put('/auth/profile', profile)
      await refreshUser()
      setMessage('✅ Profile updated successfully.')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || err.message || 'Could not update profile.'))
    }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    if (password.new_password !== password.confirm) {
      setMessage('❌ New password and confirmation do not match.')
      return
    }
    try {
      await api.post('/auth/change-password', {
        old_password: password.old_password,
        new_password: password.new_password
      })
      setPassword({ old_password: '', new_password: '', confirm: '' })
      setMessage('✅ Password changed successfully.')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || err.message || 'Could not change password.'))
    }
  }

  return (
    <div className="max-w-3xl space-y-5 text-gray-900 dark:text-gray-100">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h2>
        <p className="text-gray-500 dark:text-gray-400">Manage your details and password.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${
          message.includes('✅')
            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={saveProfile} className="rounded-2xl bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-[#2a2a4a] p-6 shadow-sm space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Account details</h3>
        <label className="block text-sm text-gray-700 dark:text-gray-300 font-medium">
          Username
          <input disabled value={user?.username || ''} className="mt-1 w-full rounded-lg bg-gray-100 dark:bg-[#10101d] px-3 py-2 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#2a2a4a]" />
        </label>
        <label className="block text-sm text-gray-700 dark:text-gray-300 font-medium">
          Full name *
          <input required value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} className="mt-1 w-full rounded-lg bg-white dark:bg-[#10101d] border border-gray-300 dark:border-[#2a2a4a] px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        </label>
        <label className="block text-sm text-gray-700 dark:text-gray-300 font-medium">
          Email *
          <input required type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} className="mt-1 w-full rounded-lg bg-white dark:bg-[#10101d] border border-gray-300 dark:border-[#2a2a4a] px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        </label>
        <button className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 transition-colors">
          Save profile
        </button>
      </form>

      <form onSubmit={savePassword} className="rounded-2xl bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-[#2a2a4a] p-6 shadow-sm space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Change password</h3>
        {[
          ['old_password', 'Current password'],
          ['new_password', 'New password'],
          ['confirm', 'Confirm new password']
        ].map(([key, label]) => (
          <label className="block text-sm text-gray-700 dark:text-gray-300 font-medium" key={key}>
            {label} *
            <input required type="password" minLength="6" value={password[key]} onChange={e => setPassword({ ...password, [key]: e.target.value })} className="mt-1 w-full rounded-lg bg-white dark:bg-[#10101d] border border-gray-300 dark:border-[#2a2a4a] px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </label>
        ))}
        <button className="rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium px-4 py-2 transition-colors">
          Change password
        </button>
      </form>
    </div>
  )
}

export default Profile