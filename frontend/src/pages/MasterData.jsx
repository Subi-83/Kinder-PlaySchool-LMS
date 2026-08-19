import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api, { booksAPI, studentsAPI } from '../services/api'

const TABS = {
  levels: {
    label: 'Book Levels',
    idKey: 'level_id',
    load: () => booksAPI.getLevels(),
    create: (data) => booksAPI.createLevel(data),
    update: (id, data) => booksAPI.updateLevel(id, data),
    remove: (id) => booksAPI.deleteLevel(id),
    columns: [
      { key: 'level_code', label: 'Code' },
      { key: 'level_name', label: 'Name' },
      { key: 'sort_order', label: 'Order' },
      { key: 'is_active', label: 'Active', type: 'bool' },
    ],
    fields: [
      { key: 'level_code', label: 'Code', required: true },
      { key: 'level_name', label: 'Name', required: true },
      { key: 'description', label: 'Description' },
      { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
    ],
  },
  categories: {
    label: 'Book Categories',
    idKey: 'category_id',
    load: () => booksAPI.getCategories(),
    create: (data) => booksAPI.createCategory(data),
    update: (id, data) => booksAPI.updateCategory(id, data),
    remove: (id) => booksAPI.deleteCategory(id),
    columns: [
      { key: 'category_code', label: 'Code' },
      { key: 'category_name', label: 'Name' },
      { key: 'is_active', label: 'Active', type: 'bool' },
    ],
    fields: [
      { key: 'category_code', label: 'Code', required: true },
      { key: 'category_name', label: 'Name', required: true },
      { key: 'description', label: 'Description' },
    ],
  },
  programmes: {
    label: 'Programmes',
    idKey: 'programme_id',
    load: () => studentsAPI.getProgrammes(),
    create: (data) => studentsAPI.createProgramme(data),
    update: (id, data) => studentsAPI.updateProgramme(id, data),
    remove: (id) => studentsAPI.deleteProgramme(id),
    columns: [
      { key: 'programme_code', label: 'Code' },
      { key: 'programme_name', label: 'Name' },
      { key: 'grade_level', label: 'Grade Level' },
      { key: 'max_books_allowed', label: 'Max Books' },
      { key: 'library_access', label: 'Library Access', type: 'bool' },
      { key: 'is_active', label: 'Active', type: 'bool' },
    ],
    fields: [
      { key: 'programme_code', label: 'Code', required: true },
      { key: 'programme_name', label: 'Name', required: true },
      { key: 'grade_level', label: 'Grade Level' },
      { key: 'max_books_allowed', label: 'Max Books Allowed', type: 'number', default: 2 },
      { key: 'library_access', label: 'Library Access', type: 'bool', default: true },
      { key: 'description', label: 'Description' },
    ],
  },
  academicYears: {
    label: 'Academic Years',
    idKey: 'academic_year_id',
    load: () => studentsAPI.getAcademicYears(),
    create: (data) => studentsAPI.createAcademicYear(data),
    update: (id, data) => studentsAPI.updateAcademicYear(id, data),
    remove: (id) => studentsAPI.deleteAcademicYear(id),
    columns: [
      { key: 'year_code', label: 'Year' },
      { key: 'start_date', label: 'Start' },
      { key: 'end_date', label: 'End' },
      { key: 'is_current', label: 'Current', type: 'bool' },
      { key: 'is_active', label: 'Active', type: 'bool' },
    ],
    fields: [
      { key: 'year_code', label: 'Year Code (e.g. 2026-27)', required: true },
      { key: 'year_name', label: 'Year Name' },
      { key: 'start_date', label: 'Start Date', type: 'date', required: true },
      { key: 'end_date', label: 'End Date', type: 'date', required: true },
      { key: 'is_current', label: 'Set as Current', type: 'bool', default: false },
    ],
  },
}

function emptyForm(fields) {
  const form = {}
  fields.forEach((f) => {
    form[f.key] = f.default ?? (f.type === 'bool' ? false : '')
  })
  return form
}

function SystemSettingsPanel({ canEdit }) {
  const [settings, setSettings] = useState({})
  const [holidays, setHolidays] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const [holidayForm, setHolidayForm] = useState({
    holiday_name: '',
    from_date: '',
    to_date: '',
    description: ''
  })

  const loadSettings = async () => {
    try {
      setLoading(true)
      const [sRes, hRes] = await Promise.all([api.get('/settings/'), api.get('/settings/holidays')])
      setSettings(sRes.data || {})
      setHolidays(hRes.data || [])
    } catch (err) {
      setMsg('❌ Error loading system settings.')
    } fontFinally: {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleUpdateSetting = async (key, value) => {
    try {
      await api.put(`/settings/${key}`, { setting_value: value })
      setMsg(`✅ Setting "${key}" updated to ${value}`)
      loadSettings()
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setMsg('❌ Failed to update setting.')
    }
  }

  const handleAddHoliday = async (e) => {
    e.preventDefault()
    if (!holidayForm.holiday_name || !holidayForm.from_date) return
    try {
      if (holidayForm.to_date && holidayForm.to_date > holidayForm.from_date) {
        // Range
        let curr = new Date(holidayForm.from_date)
        const end = new Date(holidayForm.to_date)
        while (curr <= end) {
          const dateStr = curr.toISOString().split('T')[0]
          await api.post('/settings/holidays', {
            holiday_name: holidayForm.holiday_name,
            holiday_date: dateStr,
            description: holidayForm.description
          })
          curr.setDate(curr.getDate() + 1)
        }
      } else {
        await api.post('/settings/holidays', {
          holiday_name: holidayForm.holiday_name,
          holiday_date: holidayForm.from_date,
          description: holidayForm.description
        })
      }
      setMsg('✅ Holiday(s) created successfully!')
      setHolidayForm({ holiday_name: '', from_date: '', to_date: '', description: '' })
      loadSettings()
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setMsg('❌ Failed to create holiday.')
    }
  }

  const handleDeleteHoliday = async (id) => {
    try {
      await api.delete(`/settings/holidays/${id}`)
      setMsg('✅ Holiday deleted.')
      loadSettings()
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setMsg('❌ Failed to delete holiday.')
    }
  }

  if (loading) return <p className="text-gray-400 p-6">Loading system settings...</p>

  return (
    <div className="space-y-6">
      {msg && <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 font-semibold text-sm">{msg}</div>}

      {/* System Settings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#17172a] border border-gray-200 dark:border-[#292944] shadow-sm space-y-3">
          <h4 className="font-bold text-gray-900 dark:text-white">Borrowing & Fines Configuration</h4>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-gray-600 dark:text-gray-400 mb-1 font-semibold">Default Issue Period (Days)</label>
              <input
                type="number"
                defaultValue={settings.issue_period_days || 14}
                onBlur={(e) => handleUpdateSetting('issue_period_days', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#10101d] text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-gray-600 dark:text-gray-400 mb-1 font-semibold">Late Fine (₹ per Day)</label>
              <input
                type="number"
                defaultValue={settings.late_fine_per_day || 5}
                onBlur={(e) => handleUpdateSetting('late_fine_per_day', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#10101d] text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-gray-600 dark:text-gray-400 mb-1 font-semibold">Minimum Deposit Balance Required (₹)</label>
              <input
                type="number"
                defaultValue={settings.min_deposit || 0}
                onBlur={(e) => handleUpdateSetting('min_deposit', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#10101d] text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#17172a] border border-gray-200 dark:border-[#292944] shadow-sm space-y-3">
          <h4 className="font-bold text-gray-900 dark:text-white">Damage & Lost Book Charges</h4>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-gray-600 dark:text-gray-400 mb-1 font-semibold">Small Damage Charge (₹)</label>
              <input
                type="number"
                defaultValue={settings.damage_small || 100}
                onBlur={(e) => handleUpdateSetting('damage_small', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#10101d] text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-gray-600 dark:text-gray-400 mb-1 font-semibold">Large Damage Charge (₹)</label>
              <input
                type="number"
                defaultValue={settings.damage_large || 200}
                onBlur={(e) => handleUpdateSetting('damage_large', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#10101d] text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-gray-600 dark:text-gray-400 mb-1 font-semibold">Lost Book Charge (₹)</label>
              <input
                type="number"
                defaultValue={settings.damage_lost || 300}
                onBlur={(e) => handleUpdateSetting('damage_lost', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#10101d] text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Holiday Management */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#17172a] border border-gray-200 dark:border-[#292944] shadow-sm space-y-4">
        <h4 className="font-bold text-gray-900 dark:text-white text-base">🌴 Non-chargeable Official Holidays</h4>

        {canEdit && (
          <form onSubmit={handleAddHoliday} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Holiday Name (e.g. Diwali)"
              value={holidayForm.holiday_name}
              onChange={(e) => setHolidayForm({ ...holidayForm, holiday_name: e.target.value })}
              className="px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#10101d] text-xs text-gray-900 dark:text-white"
              required
            />
            <input
              type="date"
              value={holidayForm.from_date}
              onChange={(e) => setHolidayForm({ ...holidayForm, from_date: e.target.value })}
              className="px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#10101d] text-xs text-gray-900 dark:text-white"
              required
            />
            <input
              type="date"
              placeholder="To Date (Optional range)"
              value={holidayForm.to_date}
              onChange={(e) => setHolidayForm({ ...holidayForm, to_date: e.target.value })}
              className="px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#10101d] text-xs text-gray-900 dark:text-white"
            />
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all">
              + Add Holiday
            </button>
          </form>
        )}

        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-100 dark:bg-[#22223a] text-gray-700 dark:text-gray-300 font-bold uppercase">
              <tr>
                <th className="p-3">Holiday Name</th>
                <th className="p-3">Date</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {holidays.map((h) => (
                <tr key={h.holiday_id} className="text-gray-900 dark:text-white">
                  <td className="p-3 font-semibold">{h.holiday_name}</td>
                  <td className="p-3 font-mono">{h.holiday_date}</td>
                  <td className="p-3">
                    {canEdit && (
                      <button onClick={() => handleDeleteHoliday(h.holiday_id)} className="text-rose-500 hover:underline font-bold">
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {holidays.length === 0 && (
                <tr>
                  <td colSpan="3" className="p-4 text-center text-gray-500">No holidays registered.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function DataBackupPanel() {
  const [downloading, setDownloading] = useState(false)
  const [msg, setMsg] = useState('')

  const handleExportBackup = async () => {
    try {
      setDownloading(true)
      setMsg('')
      const res = await api.get('/settings/export-backup')
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `library_management_full_backup_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      setMsg('✅ Full database backup exported and downloaded successfully!')
    } catch (err) {
      setMsg('❌ Failed to export database backup.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="p-8 rounded-2xl bg-white dark:bg-[#17172a] border border-gray-200 dark:border-[#292944] shadow-sm space-y-4 max-w-xl">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <span>💾 Data Backup & System Migration</span>
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Export all system data including students, books, subscription plans, issue records, deposit transactions, and settings into a standardized JSON file. This backup can be migrated to another software or restored at any time.
      </p>

      {msg && <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold text-xs">{msg}</div>}

      <button
        onClick={handleExportBackup}
        disabled={downloading}
        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-md disabled:opacity-50"
      >
        {downloading ? 'Generating JSON Export...' : '📥 Download Full Database Backup (JSON)'}
      </button>
    </div>
  )
}

function MasterDataPanel({ tabKey, config, canEdit }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm(config.fields))
  const [editingId, setEditingId] = useState(null)

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await config.load()
      setRows(res.data || [])
    } catch (err) {
      setError(err.data?.error || err.response?.data?.error || err.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [tabKey])

  const resetForm = () => {
    setForm(emptyForm(config.fields))
    setEditingId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editingId) {
        await config.update(editingId, form)
      } else {
        await config.create(form)
      }
      resetForm()
      load()
    } catch (err) {
      setError(err.data?.error || err.response?.data?.error || err.message || 'Save failed')
    }
  }

  const handleEdit = (row) => {
    setEditingId(row[config.idKey])
    const next = {}
    config.fields.forEach((f) => {
      next[f.key] = row[f.key] ?? (f.type === 'bool' ? false : '')
    })
    setForm(next)
  }

  const handleDelete = async (row) => {
    const label = row[config.columns[1]?.key] || row[config.columns[0]?.key]
    if (!window.confirm(`Deactivate "${label}"? This won't affect existing records that already reference it.`)) return
    try {
      await config.remove(row[config.idKey])
      load()
    } catch (err) {
      setError(err.data?.error || err.response?.data?.error || err.message || 'Delete failed')
    }
  }

  if (loading) {
    return <p className="text-gray-500 dark:text-gray-400 py-8 text-center">Loading {config.label}...</p>
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
          ❌ {error}
        </div>
      )}

      {canEdit && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#17172a] rounded-2xl p-6 border border-gray-200 dark:border-[#292944] shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {editingId ? `Edit ${config.label.slice(0, -1)}` : `Add ${config.label.slice(0, -1)}`}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {config.fields.map((f) => (
              <div key={f.key} className={f.type === 'bool' ? 'flex items-end' : ''}>
                {f.type === 'bool' ? (
                  <label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={!!form[f.key]}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    {f.label}
                  </label>
                ) : (
                  <>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                      {f.label}{f.required && ' *'}
                    </label>
                    <input
                      type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                      required={f.required}
                      value={form[f.key] ?? ''}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          [f.key]: f.type === 'number' ? e.target.value : e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#10101d] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all">
              {editingId ? 'Update' : 'Add'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="px-5 py-2.5 bg-gray-200 dark:bg-[#2a2a4a] text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl transition-all">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-[#17172a] rounded-2xl border border-gray-200 dark:border-[#292944] shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-[#22223a] text-left text-gray-700 dark:text-gray-300 font-bold text-xs uppercase">
            <tr>
              {config.columns.map((c) => (
                <th key={c.key} className="px-4 py-3 whitespace-nowrap">{c.label}</th>
              ))}
              {canEdit && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-[#292944]">
            {rows.length === 0 && (
              <tr>
                <td colSpan={config.columns.length + 1} className="px-4 py-6 text-center text-gray-400">
                  No {config.label.toLowerCase()} yet.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row[config.idKey]} className="text-gray-900 dark:text-white hover:bg-blue-50/20 dark:hover:bg-[#19192e] transition-colors">
                {config.columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 whitespace-nowrap text-xs font-semibold">
                    {c.type === 'bool' ? (row[c.key] ? 'Yes' : 'No') : (row[c.key] ?? '—')}
                  </td>
                ))}
                {canEdit && (
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap text-xs font-semibold">
                    <button onClick={() => handleEdit(row)} className="text-blue-600 dark:text-blue-400 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(row)} className="text-rose-600 dark:text-rose-400 hover:underline">Deactivate</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MasterData() {
  const { hasPermission, user } = useAuth()
  const [activeTab, setActiveTab] = useState('levels')

  const canEdit = user?.role === 'ADMIN' || hasPermission('book.edit') || hasPermission('programme.edit')

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Master Data & System Settings</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Configure book levels, categories, academic programmes, system fine rates, holidays, and database JSON backup export.
        </p>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-[#292944] overflow-x-auto">
        {Object.entries(TABS).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === key
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {cfg.label}
          </button>
        ))}
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'settings'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          ⚙️ Settings & Holidays
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'backup'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          💾 Data Backup & Export
        </button>
      </div>

      {activeTab === 'settings' ? (
        <SystemSettingsPanel canEdit={canEdit} />
      ) : activeTab === 'backup' ? (
        <DataBackupPanel />
      ) : (
        <MasterDataPanel tabKey={activeTab} config={TABS[activeTab]} canEdit={canEdit} />
      )}
    </div>
  )
}

export default MasterData
