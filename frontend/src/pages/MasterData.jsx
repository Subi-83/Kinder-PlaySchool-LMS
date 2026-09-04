import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api, { booksAPI, studentsAPI } from '../services/api'
import Pagination from '../components/common/Pagination'
import {
  Plus, Pencil, Trash2, CheckCircle2, XCircle, Download, Upload,
  TreePalm, DatabaseBackup,
} from 'lucide-react'
import { Button, Badge, EmptyState, LoadingState, PageHeader, Checkbox, ColumnVisibilityMenu, useColumnVisibility, SortableTh, useSortableData } from '../components/ui'

const TABS = {
  levels: {
    label: 'Book Levels',
    idKey: 'level_id',
    load: () => api.get('/books/levels', { params: { include_inactive: true } }),
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
    load: () => api.get('/books/categories', { params: { include_inactive: true } }),
    create: (data) => booksAPI.createCategory(data),
    update: (id, data) => booksAPI.updateCategory(id, data),
    remove: (id) => booksAPI.deleteCategory(id),
    columns: [
      { key: 'category_id', label: 'Category ID' },
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
    load: () => api.get('/students/programmes', { params: { include_inactive: true } }),
    create: (data) => studentsAPI.createProgramme(data),
    update: (id, data) => studentsAPI.updateProgramme(id, data),
    remove: (id) => studentsAPI.deleteProgramme(id),
    destroy: (id) => studentsAPI.deleteProgrammePermanent(id),
    columns: [
      { key: 'programme_code', label: 'Code' },
      { key: 'programme_name', label: 'Name' },
      { key: 'grade_level', label: 'Age Group' },
      { key: 'is_active', label: 'Active', type: 'bool' },
    ],
    fields: [
      { key: 'programme_code', label: 'Code', required: true },
      { key: 'programme_name', label: 'Name', required: true },
      { key: 'grade_level', label: 'Age Group' },
      { key: 'description', label: 'Description' },
    ],
  },
  academicYears: {
    label: 'Academic Years',
    idKey: 'academic_year_id',
    load: () => api.get('/students/academic-years', { params: { include_inactive: true } }),
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
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(holidays.length / pageSize))
  const paginatedHolidays = holidays.slice((currentPage - 1) * pageSize, currentPage * pageSize)

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
      setMsg('Error loading system settings.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleUpdateSetting = async (key, value) => {
    try {
      await api.put(`/settings/${key}`, { setting_value: value })
      setMsg(`Setting "${key}" updated to ${value}`)
      loadSettings()
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setMsg('Failed to update setting.')
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
      setMsg('Holiday(s) created successfully!')
      setHolidayForm({ holiday_name: '', from_date: '', to_date: '', description: '' })
      loadSettings()
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setMsg('Failed to create holiday.')
    }
  }

  const handleDeleteHoliday = async (id) => {
    try {
      await api.delete(`/settings/holidays/${id}`)
      setMsg('Holiday deleted.')
      loadSettings()
      setTimeout(() => setMsg(''), 3000)
    } catch (err) {
      setMsg('Failed to delete holiday.')
    }
  }

  if (loading) return <LoadingState label="Loading system settings…" />

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
        <h4 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
          <TreePalm className="h-4 w-4 text-emerald-500" aria-hidden="true" /> Non-chargeable Official Holidays
        </h4>

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
            <Button type="submit" size="sm" icon={Plus}>Add Holiday</Button>
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
              {paginatedHolidays.map((h) => (
                <tr key={h.holiday_id} className="text-gray-900 dark:text-white">
                  <td className="p-3 font-semibold">{h.holiday_name}</td>
                  <td className="p-3 font-mono">{h.holiday_date}</td>
                  <td className="p-3">
                    {canEdit && (
                      <button onClick={() => handleDeleteHoliday(h.holiday_id)} className="inline-flex items-center gap-1 text-rose-500 hover:underline font-bold">
                        <Trash2 className="h-3 w-3" aria-hidden="true" /> Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {holidays.length === 0 && (
                <tr>
                  <td colSpan="3" className="p-0">
                    <EmptyState title="No holidays registered" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={holidays.length} perPage={pageSize} onPageChange={setCurrentPage} itemLabel="holidays" />
        </div>
      </div>
    </div>
  )
}

function DataBackupPanel() {
  const [downloading, setDownloading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [backupFile, setBackupFile] = useState(null)
  const [msg, setMsg] = useState('')

  const handleExportBackup = async () => {
    try {
      setDownloading(true)
      setMsg(null)
      const res = await api.get('/settings/export-backup')
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `library_management_full_backup_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      setMsg({ type: 'success', text: 'Full database backup exported and downloaded successfully!' })
    } catch (err) {
      setMsg({ type: 'error', text: 'Failed to export database backup.' })
    } finally {
      setDownloading(false)
    }
  }

  const handleImportBackup = async () => {
    if (!backupFile) return setMsg({ type: 'error', text: 'Select a JSON backup file first.' })
    if (!window.confirm('Restore this backup? Current application data will be replaced. Administrators and permissions are preserved.')) return
    const body = new FormData()
    body.append('file', backupFile)
    try {
      setImporting(true)
      setMsg(null)
      const response = await api.post('/settings/import-backup', body, { headers: { 'Content-Type': 'multipart/form-data' } })
      setMsg({ type: 'success', text: response.data?.message || 'Backup restored successfully.' })
      setBackupFile(null)
      window.dispatchEvent(new Event('app-settings-updated'))
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to restore backup.' })
    } finally {
      setImporting(false)
    }
  }

  const handleCompleteReset = async () => {
    const confirmation = window.prompt('This permanently clears all library data and master records.\n\nAdministrators, permissions, and settings are preserved.\n\nType RESET ALL DATA to continue:')
    if (confirmation !== 'RESET ALL DATA') return
    try {
      setResetting(true)
      setMsg(null)
      const response = await api.post('/settings/complete-reset', { confirmation })
      setMsg({ type: 'success', text: response.data?.message || 'Complete reset finished.' })
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Complete reset failed.' })
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="p-8 rounded-2xl bg-white dark:bg-[#17172a] border border-gray-200 dark:border-[#292944] shadow-sm space-y-6 max-w-2xl">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <DatabaseBackup className="h-5 w-5" aria-hidden="true" /> Data Backup & System Migration
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Export all system data including students, books, subscription plans, issue records, deposit transactions, and settings into a standardized JSON file. This backup can be migrated to another software or restored at any time.
      </p>

      {msg && (
        <div className={`p-3.5 rounded-xl font-bold text-xs flex items-center gap-2 ${
          msg.type === 'error'
            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
        }`}>
          {msg.type === 'error'
            ? <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            : <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />}
          {msg.text}
        </div>
      )}

      <section className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
        <h4 className="font-bold">1. Export Backup</h4><p className="mb-3 text-xs text-gray-500">Download a complete raw-v2 JSON backup before resetting or moving data.</p>
        <Button variant="success" icon={Download} loading={downloading} onClick={handleExportBackup}>
          {downloading ? 'Generating JSON Export...' : 'Download Full Database Backup (JSON)'}
        </Button>
      </section>
      <section className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
        <h4 className="font-bold">2. Import / Restore Backup</h4><p className="mb-3 text-xs text-gray-500">Select a raw-v2 JSON backup. Existing application data will be replaced after confirmation.</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input type="file" accept=".json,application/json" onChange={(e) => setBackupFile(e.target.files?.[0] || null)} className="min-w-0 flex-1 rounded-xl border bg-white p-2 text-xs dark:border-gray-700 dark:bg-[#10101d]"/>
          <Button icon={Upload} loading={importing} disabled={!backupFile} onClick={handleImportBackup}>
            {importing ? 'Restoring...' : 'Import Backup'}
          </Button>
        </div>
      </section>
      <section className="rounded-xl border border-rose-300 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/20">
        <h4 className="font-bold text-rose-700 dark:text-rose-300">3. Complete Reset</h4><p className="mb-3 text-xs text-rose-600 dark:text-rose-400">Permanently clears all library data and master records. Administrators, permissions, and system settings are preserved.</p>
        <Button variant="danger" icon={Trash2} loading={resetting} onClick={handleCompleteReset}>
          {resetting ? 'Resetting...' : 'Complete Reset'}
        </Button>
      </section>
    </div>
  )
}

function MasterDataPanel({ tabKey, config, canEdit }) {
  const itemName = config.label === 'Book Categories' ? 'Book Category' : config.label.slice(0, -1)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm(config.fields))
  const [editingId, setEditingId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const filteredRows = rows.filter((row) => {
    if (statusFilter === 'ACTIVE' && !row.is_active) return false
    if (statusFilter === 'INACTIVE' && row.is_active) return false
    const query = search.trim().toLowerCase()
    if (!query) return true
    return config.columns.some((column) => String(row[column.key] ?? '').toLowerCase().includes(query))
  })
  const { sortedItems: sortedRows, requestSort, directionFor } = useSortableData(filteredRows)
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  const paginatedRows = sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const menuColumns = canEdit
    ? [...config.columns.map((c) => ({ key: c.key, label: c.label })), { key: 'actions', label: 'Actions', locked: true }]
    : config.columns.map((c) => ({ key: c.key, label: c.label }))
  const showColumnsMenu = config.columns.length >= 5
  const { isVisible, toggle, reset, hiddenCount } = useColumnVisibility(`master-data-${tabKey}`, menuColumns)

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
    setCurrentPage(1)
    load()
  }, [tabKey])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const resetForm = () => {
    setForm(emptyForm(config.fields))
    setEditingId(null)
    setShowModal(false)
  }

  // const handleImportBackup = async () => {
  //   if (!backupFile) return setMsg('Select a JSON backup file first.')
  //   if (!window.confirm('Restore this backup? Current application data will be replaced. Administrators and permissions are preserved.')) return
  //   const body = new FormData()
  //   body.append('file', backupFile)
  //   try {
  //     setImporting(true)
  //     setMsg('')
  //     const response = await api.post('/settings/import-backup', body, { headers: { 'Content-Type': 'multipart/form-data' } })
  //     setMsg(`${response.data?.message || 'Backup restored successfully.'}`)
  //     setBackupFile(null)
  //     window.dispatchEvent(new Event('app-settings-updated'))
  //   } catch (err) {
  //     setMsg(err.response?.data?.error || 'Failed to restore backup.')
  //   } finally {
  //     setImporting(false)
  //   }
  // }

  // const handleCompleteReset = async () => {
  //   const confirmation = window.prompt('This permanently clears all library data and master records.\n\nAdministrators, permissions, and settings are preserved.\n\nType RESET ALL DATA to continue:')
  //   if (confirmation !== 'RESET ALL DATA') {
  //     if (confirmation !== null) setMsg('Reset cancelled: confirmation text did not match.')
  //     return
  //   }
  //   try {
  //     setResetting(true)
  //     setMsg('')
  //     const response = await api.post('/settings/complete-reset', { confirmation })
  //     setMsg(`${response.data?.message || 'Complete reset finished.'}`)
  //   } catch (err) {
  //     setMsg(err.response?.data?.error || 'Complete reset failed.')
  //   } finally {
  //     setResetting(false)
  //   }
  // }

  const handleImportBackup = async () => {
    if (!backupFile) return setMsg('Select a JSON backup file first.')
    if (!window.confirm('Restore this backup? Current application data will be replaced. Administrators and permissions are preserved.')) return
    const body = new FormData()
    body.append('file', backupFile)
    try {
      setImporting(true); setMsg('')
      const response = await api.post('/settings/import-backup', body, { headers: { 'Content-Type': 'multipart/form-data' } })
      setMsg(`${response.data?.message || 'Backup restored successfully.'}`)
      setBackupFile(null)
      window.dispatchEvent(new Event('app-settings-updated'))
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to restore backup.')
    } finally { setImporting(false) }
  }

  const handleCompleteReset = async () => {
    const confirmation = window.prompt('This permanently clears all library data and master records.\n\nAdministrators, permissions, and settings are preserved.\n\nType RESET ALL DATA to continue:')
    if (confirmation !== 'RESET ALL DATA') {
      if (confirmation !== null) setMsg('Reset cancelled: confirmation text did not match.')
      return
    }
    try {
      setResetting(true); setMsg('')
      const response = await api.post('/settings/complete-reset', { confirmation })
      setMsg(`${response.data?.message || 'Complete reset finished.'}`)
    } catch (err) {
      setMsg(err.response?.data?.error || 'Complete reset failed.')
    } finally { setResetting(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
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
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (row) => {
    setEditingId(row[config.idKey])
    const next = {}
    config.fields.forEach((f) => {
      next[f.key] = row[f.key] ?? (f.type === 'bool' ? false : '')
    })
    setForm(next)
    setShowModal(true)
  }

  const handleActivate = async (row) => {
    try {
      setError('')
      await config.update(row[config.idKey], { is_active: true })
      await load()
    } catch (err) {
      setError(err.data?.error || err.response?.data?.error || err.message || 'Activation failed')
    }
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

  const handlePermanentDelete = async (row) => {
    const label = row[config.columns[1]?.key] || row[config.columns[0]?.key]
    if (!window.confirm(`Permanently delete "${label}"? This cannot be undone and is allowed only when no records reference it.`)) return
    try {
      setError('')
      await config.destroy(row[config.idKey])
      await load()
    } catch (err) {
      setError(err.data?.error || err.response?.data?.error || err.message || 'Permanent delete failed')
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 flex items-center gap-2">
          <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> {error}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-[#292944] dark:bg-[#17172a] sm:flex-row sm:items-end">
        <label className="flex-1 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Search
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${config.label.toLowerCase()}...`} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm normal-case dark:border-gray-700 dark:bg-[#10101d]" />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm normal-case dark:border-gray-700 dark:bg-[#10101d] sm:w-44">
            <option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
          </select>
        </label>
        {showColumnsMenu && (
          <ColumnVisibilityMenu columns={menuColumns} isVisible={isVisible} onToggle={toggle} onReset={reset} hiddenCount={hiddenCount} />
        )}
        {canEdit && (
          <Button icon={Plus} onClick={() => { resetForm(); setShowModal(true) }}>
            Add {itemName}
          </Button>
        )}
      </div>

      {showModal && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
        <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto bg-white dark:bg-[#17172a] rounded-2xl p-6 border border-gray-200 dark:border-[#292944] shadow-xl">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {editingId ? `Edit ${itemName}` : `Add ${itemName}`}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {config.fields.map((f) => (
              <div key={f.key} className={f.type === 'bool' ? 'flex items-end' : ''}>
                {f.type === 'bool' ? (
                  <Checkbox
                    checked={!!form[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })}
                    label={f.label}
                    className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300"
                  />
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
            <Button loading={saving} type="submit">
              {editingId ? 'Update' : 'Add'}
            </Button>
            <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
          </div>
        </form>
        </div>
      )}

      <div className="bg-white dark:bg-[#17172a] rounded-2xl border border-gray-200 dark:border-[#292944] shadow-sm overflow-x-auto">
        {loading ? <LoadingState label={`Loading ${config.label}…`} /> : <>
        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-[#22223a] text-left text-gray-700 dark:text-gray-300 font-bold text-xs uppercase">
            <tr>
              {config.columns.map((c) => (
                <SortableTh
                  key={c.key}
                  sortKey={c.key}
                  direction={directionFor(c.key)}
                  onSort={requestSort}
                  className={`px-4 py-3 whitespace-nowrap ${isVisible(c.key) ? '' : 'hidden'}`}
                >
                  {c.label}
                </SortableTh>
              ))}
              {canEdit && <th className={`px-4 py-3 text-right ${isVisible('actions') ? '' : 'hidden'}`}>Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-[#292944]">
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={config.columns.length + 1} className="p-0">
                  <EmptyState title={`No ${config.label.toLowerCase()} found`} description="No records match your search and filter." />
                </td>
              </tr>
            )}
            {paginatedRows.map((row) => (
              <tr key={row[config.idKey]} className="text-gray-900 dark:text-white hover:bg-blue-50/20 dark:hover:bg-[#19192e] transition-colors">
                {config.columns.map((c) => (
                  <td key={c.key} className={`px-4 py-3 whitespace-nowrap text-xs font-semibold ${isVisible(c.key) ? '' : 'hidden'}`}>
                    {c.type === 'bool' ? (
                      <Badge tone={row[c.key] ? 'success' : 'neutral'}>{row[c.key] ? 'Yes' : 'No'}</Badge>
                    ) : (row[c.key] ?? '—')}
                  </td>
                ))}
                {canEdit && (
                  <td className={`px-4 py-3 text-right space-x-3 whitespace-nowrap text-xs font-semibold ${isVisible('actions') ? '' : 'hidden'}`}>
                    <button onClick={() => handleEdit(row)} className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
                      <Pencil className="h-3 w-3" aria-hidden="true" /> Edit
                    </button>
                    {row.is_active
                      ? <button onClick={() => handleDelete(row)} className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:underline">
                          <XCircle className="h-3 w-3" aria-hidden="true" /> Deactivate
                        </button>
                      : <button onClick={() => handleActivate(row)} className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline">
                          <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Activate
                        </button>}
                    {config.destroy && (
                      <button onClick={() => handlePermanentDelete(row)} className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-300 hover:underline">
                        <Trash2 className="h-3 w-3" aria-hidden="true" /> Delete
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-4 border-t border-gray-200 dark:border-[#292944]">
          <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredRows.length} perPage={pageSize} onPageChange={setCurrentPage} itemLabel={config.label.toLowerCase()} />
        </div>
        </>}
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
      <PageHeader
        title="Master Data"
        description="Configure book levels, categories, academic programmes, and database JSON backup export."
      />

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
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'backup'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            <DatabaseBackup className="h-3.5 w-3.5" aria-hidden="true" /> Data Backup & Export
          </span>
        </button>
      </div>

      {activeTab === 'backup' ? (
        <DataBackupPanel />
      ) : (
        <MasterDataPanel key={activeTab} tabKey={activeTab} config={TABS[activeTab]} canEdit={canEdit} />
      )}
    </div>
  )
}

export default MasterData
