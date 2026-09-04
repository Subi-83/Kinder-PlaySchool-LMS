import React, { useState, useEffect } from 'react'
import {
  Plus, X, Pencil, Trash2, CheckCircle2, XCircle, ShieldCheck, ShieldAlert, Lock,
  Search, GraduationCap, BookOpen, ClipboardList, Library, Wallet, BarChart3,
  Users as UsersIcon, Settings, FolderKanban, ScrollText, User as UserIcon
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Pagination from '../components/common/Pagination'
import { PageHeader, Button, Badge, EmptyState, LoadingState, Checkbox, ColumnVisibilityMenu, useColumnVisibility, SortableTh, useSortableData } from '../components/ui'

const USER_COLUMNS = [
  { key: 'username', label: 'Username', locked: true },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'last_login', label: 'Last Login' },
  { key: 'actions', label: 'Actions', locked: true },
]

function Users() {
  const { user, hasPermission } = useAuth()
  const [users, setUsers] = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [message, setMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'STAFF',
    is_active: true,
    permissions: []
  })
  const [selectedTab, setSelectedTab] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const { isVisible, toggle, reset, hiddenCount } = useColumnVisibility('users', USER_COLUMNS)

  const canCreate = hasPermission('user.create') || user?.role === 'ADMIN'
  const canEdit = hasPermission('user.edit') || user?.role === 'ADMIN'
  const canDelete = hasPermission('user.delete') || user?.role === 'ADMIN'
  const isAdmin = user?.role === 'ADMIN'

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

  useEffect(() => {
    setCurrentPage(1)
  }, [users.length])

  const { sortedItems: sortedUsers, requestSort, directionFor } = useSortableData(users, null, (row, key) => {
    if (key === 'status') return row.is_active ? 1 : 0
    return row[key]
  })
  const totalItems = users.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.put(`/users/${editing}`, formData)
        setMessage({ type: 'success', text: 'User updated successfully!' })
      } else {
        await api.post('/users', formData)
        setMessage({ type: 'success', text: 'User created successfully!' })
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
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: err.data?.error || err.response?.data?.error || err.message || 'Error saving user' })
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    try {
      await api.delete(`/users/${id}`)
      setMessage({ type: 'success', text: 'User deleted successfully!' })
      await loadData()
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: err.data?.error || err.response?.data?.error || err.message || 'Error deleting user' })
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
    const codes = modulePermissions
      .map((permission) => permission.permission_code)
    setFormData((prev) => ({
      ...prev,
      permissions: enabled
        ? [...new Set([...prev.permissions, ...codes])]
        : prev.permissions.filter((code) => !codes.includes(code))
    }))
  }

  const getModuleIcon = (moduleName) => {
    const name = (moduleName || '').toLowerCase()
    if (name.includes('student')) return GraduationCap
    if (name.includes('book')) return BookOpen
    if (name.includes('sub')) return ClipboardList
    if (name.includes('lib')) return Library
    if (name.includes('dep')) return Wallet
    if (name.includes('rep')) return BarChart3
    if (name.includes('user')) return UsersIcon
    if (name.includes('set')) return Settings
    if (name.includes('master') || name.includes('prog')) return FolderKanban
    if (name.includes('audit')) return ScrollText
    return ShieldAlert
  }

  const filteredModules = Object.entries(permissionsByModule).reduce((acc, [module, modulePerms]) => {
    if (selectedTab !== 'ALL' && module !== selectedTab) return acc

    const matched = modulePerms.filter(p =>
      !searchQuery ||
      p.permission_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.permission_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (matched.length > 0) {
      acc[module] = matched
    }
    return acc
  }, {})

  if (loading) {
    return <LoadingState label="Loading users…" />
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Users"
        description="Manage system users and permissions"
        actions={canCreate && (
          <Button
            variant={showForm ? 'secondary' : 'primary'}
            icon={showForm ? X : Plus}
            onClick={() => {
              setShowForm(!showForm)
              setEditing(null)
              setFormData({ username: '', email: '', password: '', full_name: '', role: 'STAFF', is_active: true, permissions: [] })
            }}
          >
            {showForm ? 'Cancel' : 'Add User'}
          </Button>
        )}
      />

      {message && (
        <div className={`flex items-start gap-2 p-4 rounded-lg border ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          {message.type === 'success'
            ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-green-700 dark:text-green-400" aria-hidden="true" />
            : <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-700 dark:text-red-400" aria-hidden="true" />}
          <p className={message.type === 'success' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
            {message.text}
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
              <div className="mt-6 border-t border-gray-200 dark:border-[#2a2a4a] pt-5 space-y-4">
                {/* Header & Global Control Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 p-4 rounded-xl border border-blue-500/20 dark:border-blue-500/30">
                  <div>
                    <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" /> Staff Module Permissions
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                      Permissions are granted individually by an administrator. New staff users receive no permissions by default.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold text-xs rounded-full border border-blue-500/20">
                      {formData.permissions.length} of {permissions.length} Granted
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      icon={CheckCircle2}
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        permissions: permissions.map(p => p.permission_code)
                      }))}
                    >
                      Allow All
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      icon={XCircle}
                      onClick={() => setFormData(prev => ({ ...prev, permissions: [] }))}
                    >
                      Clear All
                    </Button>
                  </div>
                </div>

                {/* Module Category Filter Tabs & Quick Search */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setSelectedTab('ALL')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                        selectedTab === 'ALL'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-[#1a1a2e] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2a2a4a]'
                      }`}
                    >
                      All Modules ({Object.keys(permissionsByModule).length})
                    </button>
                    {Object.entries(permissionsByModule).map(([mod, modPerms]) => {
                      const count = modPerms.filter(p => formData.permissions.includes(p.permission_code)).length
                      const ModuleIcon = getModuleIcon(mod)
                      return (
                        <button
                          key={mod}
                          type="button"
                          onClick={() => setSelectedTab(mod)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                            selectedTab === mod
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-gray-100 dark:bg-[#1a1a2e] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2a2a4a]'
                          }`}
                        >
                          <ModuleIcon className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{mod}</span>
                          {count > 0 && (
                            <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                              selectedTab === mod ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                            }`}>
                              {count}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  <div className="relative min-w-[200px]">
                    <input
                      type="text"
                      placeholder="Filter permissions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-gray-50 dark:bg-[#0f0f1a] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600"
                        aria-label="Clear filter"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Module Cards Responsive Grid - NO nested scroll container */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                  {Object.entries(filteredModules).map(([module, modulePermissions]) => {
                    const selectedInModule = modulePermissions.filter(p => formData.permissions.includes(p.permission_code)).length
                    const editableInModule = modulePermissions
                    const allEditableSelected = editableInModule.length > 0 &&
                      editableInModule.every(p => formData.permissions.includes(p.permission_code))
                    const ModuleIcon = getModuleIcon(module)

                    return (
                      <div
                        key={module}
                        className={`rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                          selectedInModule > 0
                            ? 'border-blue-300 dark:border-blue-800/60 bg-white dark:bg-[#16162a] shadow-sm'
                            : 'border-gray-200 dark:border-[#2a2a4a] bg-gray-50/50 dark:bg-[#0f0f1a]/50 opacity-90'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-gray-100/70 dark:bg-[#1a1a2e] rounded-t-xl border-b border-gray-200 dark:border-[#2a2a4a]">
                            <div className="flex items-center gap-2">
                              <ModuleIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                              <div>
                                <h5 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                  {module}
                                </h5>
                                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                  {selectedInModule} / {modulePermissions.length} selected
                                </span>
                              </div>
                            </div>

                            {editableInModule.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setModulePermissions(modulePermissions, !allEditableSelected)}
                                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                                  allEditableSelected
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200'
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200'
                                }`}
                              >
                                {allEditableSelected ? 'Clear Section' : 'Select All'}
                              </button>
                            )}
                          </div>

                          <div className="p-3 space-y-2">
                            {modulePermissions.map((permission) => {
                              const isChecked = formData.permissions.includes(permission.permission_code)
                              const locked = false
                              return (
                                <div
                                  key={permission.permission_id}
                                  onClick={() => togglePermission(permission.permission_code)}
                                  className={`group p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-all duration-150 ${
                                    locked
                                      ? 'cursor-not-allowed opacity-70 border-gray-200 dark:border-[#2a2a4a] bg-gray-100 dark:bg-[#1a1a2e]'
                                      : 'cursor-pointer ' + (
                                        isChecked
                                          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 dark:border-blue-600/80 shadow-xs'
                                          : 'border-gray-200 dark:border-[#2a2a4a] bg-white dark:bg-[#121225] hover:border-gray-300 dark:hover:border-gray-600'
                                      )
                                  }`}
                                  title={locked ? 'Default Staff permission — cannot be changed here' : ''}
                                >
                                  <Checkbox
                                    checked={isChecked}
                                    disabled={locked}
                                    onChange={() => {}}
                                    size="sm"
                                    className="mt-0.5 pointer-events-none"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className={`text-xs font-semibold flex items-center gap-1 ${
                                        isChecked ? 'text-blue-900 dark:text-blue-200' : 'text-gray-800 dark:text-gray-200'
                                      } ${locked ? 'text-gray-500 dark:text-gray-400' : ''}`}>
                                        {locked && <Lock className="h-3 w-3" aria-hidden="true" title="Default permission" />}
                                        {permission.permission_name}
                                      </span>
                                      {isChecked && !locked && (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                                      )}
                                    </div>
                                    {permission.description && (
                                      <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5 leading-tight">
                                        {permission.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {Object.keys(filteredModules).length === 0 && (
                    <div className="col-span-full">
                      <EmptyState
                        icon={Search}
                        title="No matching permissions found"
                        description={`No permissions match "${searchQuery}".`}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button type="submit" variant="primary">
                {editing ? 'Update User' : 'Create User'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setShowForm(false); setEditing(null) }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-[#1a1a2e] rounded-xl border border-gray-200 dark:border-[#2a2a4a] shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-end gap-3 px-4 py-3 border-b border-gray-200 dark:border-[#2a2a4a]">
          <ColumnVisibilityMenu
            columns={USER_COLUMNS}
            isVisible={isVisible}
            onToggle={toggle}
            onReset={reset}
            hiddenCount={hiddenCount}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#0f0f1a]">
              <tr>
                <SortableTh sortKey="username" direction={directionFor('username')} onSort={requestSort}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 ${isVisible('username') ? '' : 'hidden'}`}>
                  Username
                </SortableTh>
                <SortableTh sortKey="email" direction={directionFor('email')} onSort={requestSort}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 ${isVisible('email') ? '' : 'hidden'}`}>
                  Email
                </SortableTh>
                <SortableTh sortKey="role" direction={directionFor('role')} onSort={requestSort}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 ${isVisible('role') ? '' : 'hidden'}`}>
                  Role
                </SortableTh>
                <SortableTh sortKey="status" direction={directionFor('status')} onSort={requestSort}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 ${isVisible('status') ? '' : 'hidden'}`}>
                  Status
                </SortableTh>
                <SortableTh sortKey="last_login" direction={directionFor('last_login')} onSort={requestSort}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 ${isVisible('last_login') ? '' : 'hidden'}`}>
                  Last Login
                </SortableTh>
                <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${isVisible('actions') ? '' : 'hidden'}`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#2a2a4a]">
              {paginatedUsers.map(u => (
                <tr key={u.user_id} className="hover:bg-gray-50 dark:hover:bg-[#0f0f1a]">
                  <td className={`px-4 py-3 text-sm font-medium text-gray-900 dark:text-white ${isVisible('username') ? '' : 'hidden'}`}>{u.username}</td>
                  <td className={`px-4 py-3 text-sm text-gray-500 dark:text-gray-400 ${isVisible('email') ? '' : 'hidden'}`}>{u.email}</td>
                  <td className={`px-4 py-3 text-sm ${isVisible('role') ? '' : 'hidden'}`}>
                    <Badge tone={u.role === 'ADMIN' ? 'primary' : 'info'} icon={u.role === 'ADMIN' ? ShieldCheck : UserIcon}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className={`px-4 py-3 text-sm ${isVisible('status') ? '' : 'hidden'}`}>
                    <Badge tone={u.is_active ? 'success' : 'danger'} icon={u.is_active ? CheckCircle2 : XCircle}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className={`px-4 py-3 text-sm text-gray-500 dark:text-gray-400 ${isVisible('last_login') ? '' : 'hidden'}`}>{u.last_login || 'Never'}</td>
                  <td className={`px-4 py-3 text-sm ${isVisible('actions') ? '' : 'hidden'}`}>
                    <div className="flex gap-2">
                      {canEdit && u.user_id !== 1 && (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={Pencil}
                          onClick={() => {
                            setEditing(u.user_id)
                            setFormData({ ...u, password: '', permissions: u.permissions || [] })
                            setShowForm(true)
                          }}
                        >
                          Edit
                        </Button>
                      )}
                      {canDelete && u.user_id !== 1 && u.user_id !== user?.user_id && (
                        <Button
                          size="sm"
                          variant="danger"
                          icon={Trash2}
                          onClick={() => handleDelete(u.user_id)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <EmptyState icon={UsersIcon} title="No users found" description="Add a user to get started." />
          )}
        </div>

        {users.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-[#2a2a4a]">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              perPage={pageSize}
              onPageChange={setCurrentPage}
              itemLabel="users"
            />
          </div>
        )}
      </div>
    </div>
  )
}

// MAKE SURE THIS IS AT THE BOTTOM - DEFAULT EXPORT
export default Users
