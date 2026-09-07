import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api, { booksAPI, studentsAPI, subscriptionsAPI } from '../services/api'
import Pagination from '../components/common/Pagination'
import {
  Plus, Pencil, Trash2, CheckCircle2, XCircle, Download, Upload,
  Palmtree as TreePalm, DatabaseBackup, Layers, Ticket, AlertCircle,
  RefreshCw, Info,
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

function LibraryLocationsPanel({ canEdit }) {
  const [cupboards, setCupboards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Cupboard Modal
  const [showCupboardModal, setShowCupboardModal] = useState(false)
  const [editingCupboard, setEditingCupboard] = useState(null)
  const [cupboardForm, setCupboardForm] = useState({
    cupboard_code: '',
    cupboard_name: '',
    description: '',
    is_active: true
  })

  // Shelf Modal
  const [showShelfModal, setShowShelfModal] = useState(false)
  const [editingShelf, setEditingShelf] = useState(null)
  const [shelfForm, setShelfForm] = useState({
    cupboard_id: '',
    shelf_code: '',
    shelf_name: '',
    description: '',
    is_active: true
  })

  const [saving, setSaving] = useState(false)

  const loadLocations = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await booksAPI.getCupboards({ include_inactive: true })
      setCupboards(res.data || [])
    } catch (err) {
      setError(err.data?.error || err.response?.data?.error || err.message || 'Failed to load library locations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLocations()
  }, [])

  const handleOpenAddCupboard = () => {
    setEditingCupboard(null)
    setCupboardForm({
      cupboard_code: '',
      cupboard_name: '',
      description: '',
      is_active: true
    })
    setShowCupboardModal(true)
  }

  const handleOpenEditCupboard = (cupboard) => {
    setEditingCupboard(cupboard)
    setCupboardForm({
      cupboard_code: cupboard.cupboard_code || '',
      cupboard_name: cupboard.cupboard_name || '',
      description: cupboard.description || '',
      is_active: cupboard.is_active ?? true
    })
    setShowCupboardModal(true)
  }

  const handleSaveCupboard = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError('')
      if (editingCupboard) {
        await booksAPI.updateCupboard(editingCupboard.cupboard_id, cupboardForm)
      } else {
        await booksAPI.createCupboard(cupboardForm)
      }
      setShowCupboardModal(false)
      loadLocations()
    } catch (err) {
      setError(err.data?.error || err.response?.data?.error || err.message || 'Failed to save cupboard')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleCupboard = async (cupboard) => {
    try {
      setError('')
      if (cupboard.is_active) {
        if (!window.confirm(`Deactivate cupboard "${cupboard.cupboard_name}"?`)) return
        await booksAPI.deleteCupboard(cupboard.cupboard_id)
      } else {
        await booksAPI.activateCupboard(cupboard.cupboard_id)
      }
      loadLocations()
    } catch (err) {
      setError(err.data?.error || err.response?.data?.error || err.message || 'Action failed')
    }
  }

  const handleOpenAddShelf = (cupboardId = null) => {
    setEditingShelf(null)
    setShelfForm({
      cupboard_id: cupboardId ? String(cupboardId) : (cupboards[0]?.cupboard_id ? String(cupboards[0].cupboard_id) : ''),
      shelf_code: '',
      shelf_name: '',
      description: '',
      is_active: true
    })
    setShowShelfModal(true)
  }

  const handleOpenEditShelf = (shelf) => {
    setEditingShelf(shelf)
    setShelfForm({
      cupboard_id: String(shelf.cupboard_id),
      shelf_code: shelf.shelf_code || '',
      shelf_name: shelf.shelf_name || '',
      description: shelf.description || '',
      is_active: shelf.is_active ?? true
    })
    setShowShelfModal(true)
  }

  const handleSaveShelf = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError('')
      if (editingShelf) {
        await booksAPI.updateShelf(editingShelf.shelf_id, shelfForm)
      } else {
        await booksAPI.createShelf(shelfForm)
      }
      setShowShelfModal(false)
      loadLocations()
    } catch (err) {
      setError(err.data?.error || err.response?.data?.error || err.message || 'Failed to save shelf')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleShelf = async (shelf) => {
    try {
      setError('')
      if (shelf.is_active) {
        if (!window.confirm(`Deactivate shelf "${shelf.shelf_name}"?`)) return
        await booksAPI.deleteShelf(shelf.shelf_id)
      } else {
        await booksAPI.activateShelf(shelf.shelf_id)
      }
      loadLocations()
    } catch (err) {
      setError(err.data?.error || err.response?.data?.error || err.message || 'Action failed')
    }
  }

  // Filter cupboards & their shelves
  const filteredCupboards = cupboards.filter((c) => {
    if (statusFilter === 'ACTIVE' && !c.is_active) return false
    if (statusFilter === 'INACTIVE' && c.is_active) return false

    if (!search.trim()) return true
    const term = search.toLowerCase()
    const matchCupboard =
      c.cupboard_name?.toLowerCase().includes(term) ||
      c.cupboard_code?.toLowerCase().includes(term) ||
      c.description?.toLowerCase().includes(term)
    const matchShelf = (c.shelves || []).some(
      (s) =>
        s.shelf_name?.toLowerCase().includes(term) ||
        s.shelf_code?.toLowerCase().includes(term) ||
        s.description?.toLowerCase().includes(term)
    )
    return matchCupboard || matchShelf
  })

  const totalShelvesCount = cupboards.reduce((acc, c) => acc + (c.shelves?.length || 0), 0)

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 flex items-center gap-2">
          <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> {error}
        </div>
      )}

      {/* Control bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-[#292944] dark:bg-[#17172a] sm:flex-row sm:items-end">
        <label className="flex-1 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
          Search Locations
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cupboard or shelf..."
            className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm normal-case dark:border-gray-700 dark:bg-[#10101d]"
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
          Status
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm normal-case dark:border-gray-700 dark:bg-[#10101d] sm:w-40"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>
        {canEdit && (
          <div className="flex gap-2">
            <Button icon={Plus} onClick={handleOpenAddCupboard}>
              Add Cupboard
            </Button>
            <Button icon={Plus} variant="secondary" onClick={() => handleOpenAddShelf()}>
              Add Shelf
            </Button>
          </div>
        )}
      </div>

      {/* Stats ribbon */}
      <div className="flex items-center gap-4 px-1 text-xs text-gray-500 dark:text-gray-400">
        <span>Total Cupboards: <strong className="text-gray-800 dark:text-gray-200">{cupboards.length}</strong></span>
        <span>•</span>
        <span>Total Shelves: <strong className="text-gray-800 dark:text-gray-200">{totalShelvesCount}</strong></span>
      </div>

      {loading ? (
        <LoadingState message="Loading library locations..." />
      ) : filteredCupboards.length === 0 ? (
        <EmptyState
          title="No locations found"
          description={search ? "No cupboards or shelves match your search." : "No cupboards configured yet. Click 'Add Cupboard' to get started."}
          actionLabel={canEdit && !search ? "Add First Cupboard" : undefined}
          onAction={canEdit && !search ? handleOpenAddCupboard : undefined}
        />
      ) : (
        <div className="space-y-4">
          {filteredCupboards.map((cupboard) => (
            <div
              key={cupboard.cupboard_id}
              className={`rounded-2xl border transition-all ${
                cupboard.is_active
                  ? 'border-gray-200 bg-white shadow-sm dark:border-[#292944] dark:bg-[#17172a]'
                  : 'border-gray-200/60 bg-gray-50/70 opacity-80 dark:border-[#292944]/50 dark:bg-[#121220]'
              } overflow-hidden`}
            >
              {/* Cupboard Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800/80 gap-3 bg-gray-50/50 dark:bg-[#141424]/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-gray-900 dark:text-white">
                        {cupboard.cupboard_name}
                      </h3>
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-gray-200/80 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold">
                        {cupboard.cupboard_code}
                      </span>
                      <Badge tone={cupboard.is_active ? 'success' : 'neutral'}>
                        {cupboard.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {cupboard.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {cupboard.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1">
                    {(cupboard.shelves || []).length} {(cupboard.shelves || []).length === 1 ? 'Shelf' : 'Shelves'}
                  </span>
                  {canEdit && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={Plus}
                        onClick={() => handleOpenAddShelf(cupboard.cupboard_id)}
                      >
                        Add Shelf
                      </Button>
                      <button
                        onClick={() => handleOpenEditCupboard(cupboard)}
                        title="Edit Cupboard"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleCupboard(cupboard)}
                        title={cupboard.is_active ? 'Deactivate Cupboard' : 'Activate Cupboard'}
                        className={`p-1.5 rounded-lg ${
                          cupboard.is_active
                            ? 'text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                            : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                        }`}
                      >
                        {cupboard.is_active ? <Trash2 className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Shelves List under Cupboard */}
              <div className="p-4">
                {(cupboard.shelves || []).length === 0 ? (
                  <div className="py-4 text-center text-xs text-gray-400 dark:text-gray-500 italic">
                    No shelves configured in this cupboard.
                    {canEdit && (
                      <button
                        onClick={() => handleOpenAddShelf(cupboard.cupboard_id)}
                        className="ml-2 font-semibold text-blue-600 dark:text-blue-400 hover:underline not-italic"
                      >
                        + Add Shelf
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(cupboard.shelves || []).map((shelf, idx) => (
                      <div
                        key={shelf.shelf_id}
                        className={`p-3 rounded-xl border flex flex-col justify-between transition-colors ${
                          shelf.is_active
                            ? 'border-gray-200/80 bg-gray-50/60 dark:border-gray-800 dark:bg-[#10101d]'
                            : 'border-gray-200/50 bg-gray-100/50 opacity-70 dark:border-gray-800/50 dark:bg-[#0c0c16]'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 text-xs font-mono font-semibold">
                                #{idx + 1}
                              </span>
                              <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                                {shelf.shelf_name}
                              </span>
                            </div>
                            <Badge tone={shelf.is_active ? 'success' : 'neutral'} className="text-[10px]">
                              {shelf.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-mono bg-white dark:bg-[#17172a] px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-800 text-[11px]">
                              {shelf.shelf_code}
                            </span>
                            {shelf.description && (
                              <span className="truncate max-w-[150px]" title={shelf.description}>
                                {shelf.description}
                              </span>
                            )}
                          </div>
                        </div>

                        {canEdit && (
                          <div className="flex justify-end gap-1 mt-2.5 pt-2 border-t border-gray-200/60 dark:border-gray-800/60">
                            <button
                              onClick={() => handleOpenEditShelf(shelf)}
                              title="Edit Shelf"
                              className="p-1 rounded text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-[#17172a]"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleToggleShelf(shelf)}
                              title={shelf.is_active ? 'Deactivate Shelf' : 'Activate Shelf'}
                              className={`p-1 rounded ${
                                shelf.is_active
                                  ? 'text-gray-400 hover:text-rose-600 hover:bg-white dark:hover:bg-[#17172a]'
                                  : 'text-gray-400 hover:text-emerald-600 hover:bg-white dark:hover:bg-[#17172a]'
                              }`}
                            >
                              {shelf.is_active ? <Trash2 className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cupboard Modal */}
      {showCupboardModal && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <form
            onSubmit={handleSaveCupboard}
            className="w-full max-w-md overflow-hidden bg-white dark:bg-[#17172a] rounded-2xl p-6 border border-gray-200 dark:border-[#292944] shadow-xl space-y-4"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {editingCupboard ? 'Edit Cupboard' : 'Add New Cupboard'}
            </h3>
            <div className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Cupboard Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cupboard 1, Fiction Bookcase"
                  value={cupboardForm.cupboard_name}
                  onChange={(e) => setCupboardForm({ ...cupboardForm, cupboard_name: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-[#10101d] dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Cupboard Code / Identifier
                </label>
                <input
                  type="text"
                  placeholder="e.g. CUP-01 (leave blank to auto-generate)"
                  value={cupboardForm.cupboard_code}
                  onChange={(e) => setCupboardForm({ ...cupboardForm, cupboard_code: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-[#10101d] dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Next to reference section, south wall"
                  value={cupboardForm.description}
                  onChange={(e) => setCupboardForm({ ...cupboardForm, description: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-[#10101d] dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="pt-1">
                <Checkbox
                  checked={cupboardForm.is_active}
                  onChange={(e) => setCupboardForm({ ...cupboardForm, is_active: e.target.checked })}
                  label="Active"
                  className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <Button type="button" variant="secondary" onClick={() => setShowCupboardModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingCupboard ? 'Update Cupboard' : 'Save Cupboard'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Shelf Modal */}
      {showShelfModal && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <form
            onSubmit={handleSaveShelf}
            className="w-full max-w-md overflow-hidden bg-white dark:bg-[#17172a] rounded-2xl p-6 border border-gray-200 dark:border-[#292944] shadow-xl space-y-4"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {editingShelf ? 'Edit Shelf' : 'Add New Shelf'}
            </h3>
            <div className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Belongs to Cupboard *
                </label>
                <select
                  required
                  value={shelfForm.cupboard_id}
                  onChange={(e) => setShelfForm({ ...shelfForm, cupboard_id: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-[#10101d] dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- Select Cupboard --</option>
                  {cupboards.map((c) => (
                    <option key={c.cupboard_id} value={c.cupboard_id}>
                      {c.cupboard_name} ({c.cupboard_code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Shelf Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shelf 1, Top Shelf"
                  value={shelfForm.shelf_name}
                  onChange={(e) => setShelfForm({ ...shelfForm, shelf_name: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-[#10101d] dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Shelf Code / Identifier
                </label>
                <input
                  type="text"
                  placeholder="e.g. SH-01 (leave blank to auto-generate)"
                  value={shelfForm.shelf_code}
                  onChange={(e) => setShelfForm({ ...shelfForm, shelf_code: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-[#10101d] dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. For beginner reading books"
                  value={shelfForm.description}
                  onChange={(e) => setShelfForm({ ...shelfForm, description: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-[#10101d] dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="pt-1">
                <Checkbox
                  checked={shelfForm.is_active}
                  onChange={(e) => setShelfForm({ ...shelfForm, is_active: e.target.checked })}
                  label="Active"
                  className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <Button type="button" variant="secondary" onClick={() => setShowShelfModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingShelf ? 'Update Shelf' : 'Save Shelf'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function SubscriptionPlansPanel({ canEdit }) {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    plan_name: '',
    plan_code: '',
    max_books: 1,
    duration_months: 3,
    subscription_fee: '',
    fixed_deposit: '',
    total_amount: '',
    is_active: true,
    description: '',
  })

  const loadPlans = async () => {
    try {
      setLoading(true)
      const res = await subscriptionsAPI.getPlans({ include_inactive: true })
      setPlans(res.data || [])
    } catch (err) {
      setMsg({ type: 'error', text: 'Error loading subscription plans.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlans()
  }, [])

  const openCreate = () => {
    setEditingPlan(null)
    setFormData({
      plan_name: '',
      plan_code: '',
      max_books: 1,
      duration_months: 3,
      subscription_fee: '',
      fixed_deposit: '',
      total_amount: '',
      is_active: true,
      description: '',
    })
    setModalOpen(true)
  }

  const openEdit = (plan) => {
    setEditingPlan(plan)
    setFormData({
      plan_name: plan.plan_name || '',
      plan_code: plan.plan_code || '',
      max_books: plan.max_books || 1,
      duration_months: plan.duration_months || 3,
      subscription_fee: String(plan.subscription_fee ?? ''),
      fixed_deposit: String(plan.fixed_deposit ?? ''),
      total_amount: String(plan.total_amount ?? ''),
      is_active: Boolean(plan.is_active),
      description: plan.description || '',
    })
    setModalOpen(true)
  }

  const handleFeeOrDepositChange = (field, value) => {
    const next = { ...formData, [field]: value }
    const fee = parseFloat(field === 'subscription_fee' ? value : next.subscription_fee) || 0
    const dep = parseFloat(field === 'fixed_deposit' ? value : next.fixed_deposit) || 0
    next.total_amount = (fee + dep).toFixed(2)
    setFormData(next)
  }

  const subFeeNum = parseFloat(formData.subscription_fee) || 0
  const fixDepNum = parseFloat(formData.fixed_deposit) || 0
  const totAmtNum = parseFloat(formData.total_amount) || 0
  const isSumValid = Math.abs(totAmtNum - (subFeeNum + fixDepNum)) < 0.01

  const handleSave = async (e) => {
    e.preventDefault()
    if (!formData.plan_name.trim()) {
      setMsg({ type: 'error', text: 'Plan Name is required.' })
      return
    }
    if (!isSumValid) {
      setMsg({
        type: 'error',
        text: `Total Amount (₹${totAmtNum.toFixed(2)}) must equal Subscription Fee (₹${subFeeNum.toFixed(2)}) + Fixed Deposit (₹${fixDepNum.toFixed(2)}) = ₹${(subFeeNum + fixDepNum).toFixed(2)}.`,
      })
      return
    }

    try {
      setSaving(true)
      const payload = {
        ...formData,
        max_books: parseInt(formData.max_books) || 1,
        duration_months: parseInt(formData.duration_months) || 3,
        subscription_fee: subFeeNum,
        fixed_deposit: fixDepNum,
        total_amount: totAmtNum,
      }

      if (editingPlan) {
        await subscriptionsAPI.updatePlan(editingPlan.subscription_plan_id, payload)
        setMsg({ type: 'success', text: `Plan "${formData.plan_name}" updated successfully!` })
      } else {
        await subscriptionsAPI.createPlan(payload)
        setMsg({ type: 'success', text: `Plan "${formData.plan_name}" created successfully!` })
      }
      setModalOpen(false)
      loadPlans()
      setTimeout(() => setMsg(null), 4000)
    } catch (err) {
      setMsg({ type: 'error', text: err.data?.error || err.response?.data?.error || 'Error saving plan.' })
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (plan) => {
    try {
      await subscriptionsAPI.updatePlan(plan.subscription_plan_id, {
        is_active: !plan.is_active,
        subscription_fee: plan.subscription_fee,
        fixed_deposit: plan.fixed_deposit,
        total_amount: plan.total_amount,
      })
      loadPlans()
      setMsg({ type: 'success', text: `Plan "${plan.plan_name}" status updated.` })
      setTimeout(() => setMsg(null), 3000)
    } catch (err) {
      setMsg({ type: 'error', text: 'Could not change plan status.' })
    }
  }

  const handleDelete = async (plan) => {
    if (!window.confirm(`Are you sure you want to delete "${plan.plan_name}"?`)) return
    try {
      await subscriptionsAPI.deletePlan(plan.subscription_plan_id)
      loadPlans()
      setMsg({ type: 'success', text: `Plan "${plan.plan_name}" deleted.` })
      setTimeout(() => setMsg(null), 3000)
    } catch (err) {
      setMsg({ type: 'error', text: err.data?.error || err.response?.data?.error || 'Cannot delete plan in use.' })
    }
  }

  const filtered = plans.filter((p) => {
    const matchSearch = (p.plan_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.plan_code || '').toLowerCase().includes(search.toLowerCase())
    if (filterActive === 'ACTIVE') return matchSearch && p.is_active
    if (filterActive === 'INACTIVE') return matchSearch && !p.is_active
    return matchSearch
  })

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'}`}>
          {msg.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
          {msg.text}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#1a1a2e] p-4 rounded-2xl border border-gray-200 dark:border-[#2a2a4a] shadow-sm">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="Search plans by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-xs px-3.5 py-2 rounded-xl border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>

        {canEdit && (
          <Button variant="primary" icon={Plus} onClick={openCreate}>
            Add Subscription Plan
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingState label="Loading subscription plans…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No subscription plans found"
          description="Create configurable subscription plans with separated Subscription Fee and Fixed Deposit amounts."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-[#2a2a4a] bg-white dark:bg-[#1a1a2e] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-600 dark:bg-[#0f0f1a] dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3">Plan Name</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Max Books</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3 text-right">Subscription Fee</th>
                  <th className="px-4 py-3 text-right">Fixed Deposit</th>
                  <th className="px-4 py-3 text-right">Total Amount</th>
                  <th className="px-4 py-3">Status</th>
                  {canEdit && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#2a2a4a]">
                {filtered.map((p) => (
                  <tr key={p.subscription_plan_id} className="hover:bg-gray-50/50 dark:hover:bg-[#151528] transition-colors">
                    <td className="px-4 py-3.5 font-bold text-gray-900 dark:text-white">
                      <div>{p.plan_name}</div>
                      {p.description && <div className="text-xs font-normal text-gray-500 dark:text-gray-400 mt-0.5">{p.description}</div>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{p.plan_code || '—'}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{p.max_books} book{p.max_books > 1 ? 's' : ''}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{p.duration_months} month{p.duration_months > 1 ? 's' : ''}</td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-600 dark:text-blue-400">
                      ₹{Number(p.subscription_fee || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      ₹{Number(p.fixed_deposit || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                      ₹{Number(p.total_amount || p.price || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={p.is_active ? 'success' : 'neutral'}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(p)}
                            title="Edit Plan"
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-[#2a2a4a] dark:hover:text-blue-400 transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleStatus(p)}
                            title={p.is_active ? 'Deactivate' : 'Activate'}
                            className={`p-1.5 rounded-lg text-xs font-semibold ${p.is_active ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'} transition-colors`}
                          >
                            {p.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p)}
                            title="Delete Plan"
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Subscription Plan Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#1a1a2e] border border-gray-200 dark:border-[#2a2a4a] max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-[#2a2a4a]">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Ticket className="h-5 w-5 text-blue-500" />
                {editingPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-[#2a2a4a] text-gray-600 dark:text-gray-300"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.plan_name}
                    onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                    placeholder="e.g. Caterpillar"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Plan Code
                  </label>
                  <input
                    type="text"
                    value={formData.plan_code}
                    onChange={(e) => setFormData({ ...formData, plan_code: e.target.value })}
                    placeholder="e.g. CAT"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Max Books *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.max_books}
                    onChange={(e) => setFormData({ ...formData, max_books: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                    Duration (months) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.duration_months}
                    onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Financial Breakdown Inputs */}
              <div className="rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  <Info className="h-4 w-4" /> Financial Configuration
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                      Subscription Fee (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={formData.subscription_fee}
                      onChange={(e) => handleFeeOrDepositChange('subscription_fee', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-[10px] text-gray-500">School revenue</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                      Fixed Deposit (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={formData.fixed_deposit}
                      onChange={(e) => handleFeeOrDepositChange('fixed_deposit', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-[10px] text-gray-500">Refundable balance</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                      Total Amount (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={formData.total_amount}
                      onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                      placeholder="0.00"
                      className={`w-full px-3 py-2 rounded-xl border ${isSumValid ? 'border-gray-300 dark:border-[#2a2a4a]' : 'border-rose-500 ring-1 ring-rose-500'} bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-blue-500`}
                    />
                    <span className="text-[10px] text-gray-500">Fee + Deposit</span>
                  </div>
                </div>

                {/* Validation Banner */}
                {isSumValid ? (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/40 p-2 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Equation verified: Total ₹{totAmtNum.toFixed(2)} = Fee ₹{subFeeNum.toFixed(2)} + Deposit ₹{fixDepNum.toFixed(2)}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-100/70 dark:bg-rose-950/40 p-2 rounded-lg">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Total Amount must equal ₹{(subFeeNum + fixDepNum).toFixed(2)} (Fee ₹{subFeeNum.toFixed(2)} + Deposit ₹{fixDepNum.toFixed(2)})</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional plan description..."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Active (Available for subscription)</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200 dark:border-[#2a2a4a]">
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={saving || !isSumValid}>
                  {saving ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function MasterData() {
  const { hasPermission, user } = useAuth()
  const [activeTab, setActiveTab] = useState('levels')

  const canEdit = user?.role === 'ADMIN' || hasPermission('book.edit') || hasPermission('programme.edit') || hasPermission('subscription.edit') || hasPermission('subscription.create')

  return (
    <div className="space-y-4">
      <PageHeader
        title="Master Data"
        description="Configure book levels, categories, academic programmes, library locations, subscription plans, and database JSON backup export."
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
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'plans'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            <Ticket className="h-3.5 w-3.5" aria-hidden="true" /> Subscription Plans
          </span>
        </button>
        <button
          onClick={() => setActiveTab('locations')}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'locations'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" aria-hidden="true" /> Library Locations
          </span>
        </button>
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
      ) : activeTab === 'plans' ? (
        <SubscriptionPlansPanel canEdit={canEdit} />
      ) : activeTab === 'locations' ? (
        <LibraryLocationsPanel canEdit={canEdit} />
      ) : (
        <MasterDataPanel key={activeTab} tabKey={activeTab} config={TABS[activeTab]} canEdit={canEdit} />
      )}
    </div>
  )
}

export default MasterData
