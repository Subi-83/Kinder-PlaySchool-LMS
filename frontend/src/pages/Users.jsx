import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function Users() {
  const { user, hasPermission } = useAuth()
  const [users, setUsers] = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'STAFF',
    is_active: true,
    permissions: []
  })

  const canCreate = hasPermission('user.create') || user?.role === 'ADMIN'
  const canEdit = hasPermission('user.edit') || user?.role === 'ADMIN'
  const canDelete = hasPermission('user.delete') || user?.role === 'ADMIN'

  const loadData = async () => {
    try {
      setLoading(true)
      const [usersRes, permsRes] = await Promise.all([
        api.get('/users'),
        api.get('/users/permissions')
      ])
      setUsers(usersRes.data)
      setPermissions(permsRes.data)
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.put(`/users/${editing}`, formData)
        setMessage('✅ User updated successfully!')
      } else {
        await api.post('/users', formData)
        setMessage('✅ User created successfully!')
      }
      setShowForm(false)
      setEditing(null)
      setFormData({
        username: '',
        email: '',
        password: '',
        full_name: '',
        role: 'STAFF',
        is_active: true,
        permissions: []
      })
      await loadData()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('❌ ' + (err.data?.error || err.response?.data?.error || err.message || 'Error saving user'))
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    try {
      await api.delete(`/users/${id}`)
      setMessage('✅ User deleted successfully!')
      await loadData()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('❌ ' + (err.data?.error || err.response?.data?.error || err.message || 'Error deleting user'))
    }
  }

  const togglePermission = (permCode) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permCode)
        ? prev.permissions.filter(p => p !== permCode)
        : [...prev.permissions, permCode]
    }))
  }

  const permissionsByModule = permissions.reduce((groups, permission) => {
    const module = permission.module || 'Other'
    groups[module] = [...(groups[module] || []), permission]
    return groups
  }, {})

  const setModulePermissions = (modulePermissions, enabled) => {
    const codes = modulePermissions.map((permission) => permission.permission_code)
    setFormData((prev) => ({
      ...prev,
      permissions: enabled
        ? [...new Set([...prev.permissions, ...codes])]
        : prev.permissions.filter((code) => !codes.includes(code))
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h2>
          <p className="text-gray-500 dark:text-gray-400">Manage system users and permissions</p>
        </div>
        {canCreate && (
          <button
            onClick={() => { setShowForm(!showForm); setEditing(null); setFormData({ username: '', email: '', password: '', full_name: '', role: 'STAFF', is_active: true, permissions: [] }) }}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            {showForm ? '✕ Cancel' : '+ Add User'}
          </button>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'} border`}>
          <p className={`${message.includes('✅') ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
            {message}
          </p>
        </div>
      )}

      {showForm && (
        <div className="bg-white dark:bg-[#1a1a2e] rounded-xl p-6 border border-gray-200 dark:border-[#2a2a4a] shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editing ? 'Edit User' : 'New User'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password {editing && '(leave blank to keep)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required={!editing}
                  minLength="6"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            {formData.role === 'STAFF' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  What can this staff member do?
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Choose the screens and actions they need. You can select a whole section or individual actions.</p>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {Object.entries(permissionsByModule).map(([module, modulePermissions]) => {
                    const allSelected = modulePermissions.every((permission) => formData.permissions.includes(permission.permission_code))
                    return (
                      <section key={module} className="rounded-xl border border-gray-200 dark:border-[#2a2a4a] overflow-hidden">
                        <div className="flex items-center justify-between gap-3 px-3 py-2 bg-gray-50 dark:bg-[#0f0f1a]">
                          <div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">{module}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{modulePermissions.length} available actions</p>
                          </div>
                          <button type="button" onClick={() => setModulePermissions(modulePermissions, !allSelected)} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200">
                            {allSelected ? 'Clear section' : 'Allow all'}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 p-3">
                          {modulePermissions.map((permission) => (
                            <label key={permission.permission_id} className="flex items-start gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.permissions.includes(permission.permission_code)}
                                onChange={() => togglePermission(permission.permission_code)}
                                className="mt-0.5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                              />
                              <span>
                                <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">{permission.permission_name}</span>
                                {permission.description && <span className="block text-xs text-gray-500 dark:text-gray-400">{permission.description}</span>}
                              </span>
                            </label>
                          ))}
                        </div>
                      </section>
                    )
                  })}
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button type="submit" className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                {editing ? 'Update User' : 'Create User'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditing(null) }}
                className="px-4 py-2 bg-gray-200 dark:bg-[#2a2a4a] hover:bg-gray-300 dark:hover:bg-[#3a3a5a] text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-[#1a1a2e] rounded-xl border border-gray-200 dark:border-[#2a2a4a] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#0f0f1a]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Username</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Login</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#2a2a4a]">
              {users.map(u => (
                <tr key={u.user_id} className="hover:bg-gray-50 dark:hover:bg-[#0f0f1a]">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{u.username}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{u.email}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{u.last_login || 'Never'}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      {canEdit && u.user_id !== 1 && (
                        <button
                          onClick={() => { setEditing(u.user_id); setFormData({ ...u, password: '', permissions: u.permissions || [] }); setShowForm(true) }}
                          className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          Edit
                        </button>
                      )}
                      {canDelete && u.user_id !== 1 && u.user_id !== user?.user_id && (
                        <button
                          onClick={() => handleDelete(u.user_id)}
                          className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ✅ MAKE SURE THIS IS AT THE BOTTOM - DEFAULT EXPORT
export default Users
