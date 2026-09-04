import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Pagination from '../components/common/Pagination'
import {
  ChevronLeft, ChevronRight, Plus, PartyPopper, CalendarDays, Pencil, Trash2, X,
  CheckCircle2, XCircle, RefreshCw, Lightbulb, Search, Save,
} from 'lucide-react'
import { Button, IconButton, Badge, EmptyState, LoadingState, PageHeader, Checkbox, SortableTh, useSortableData } from '../components/ui'

// Category colors for badges
const CATEGORY_COLORS = {
  'General': 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  'Library': 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  'Charges': 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  'Deposit': 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  'Security': 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
  'Backup': 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  'API': 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
  'Other': 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
}

// Prettify setting keys
const SETTING_LABELS = {
  'school_name': 'School Name',
  'school_address': 'School Address',
  'school_phone': 'School Phone',
  'school_email': 'School Email',
  'currency': 'Currency Code',
  'date_format': 'Date Display Format',
  'time_format': 'Time Display Format',
  'issue_period_days': 'Default Issue Period (Days)',
  'barcode_lookup_enabled': 'Barcode / ISBN Lookup',
  'holiday_adjustment': 'Automatic Holiday Due Adjustment',
  'late_fine_per_day': 'Late Fine Per Day',
  'damage_small': 'Small Damage Charge',
  'damage_large': 'Large Damage Charge',
  'damage_default': 'Default Damage Charge',
  'lost_book_charge': 'Lost Book Replacement Charge',
  'min_deposit': 'Minimum Account Deposit',
  'low_deposit_threshold': 'Low Deposit Warning Threshold',
  'deposit_topup_min': 'Minimum Top-up Amount',
  'session_timeout_minutes': 'Session Timeout (Minutes)',
  'max_login_attempts': 'Max Login Attempts Before Lockout',
  'lockout_duration_minutes': 'Lockout Duration (Minutes)',
  'backup_enabled': 'Automatic Scheduled Backups',
  'backup_frequency': 'Backup Frequency',
  'backup_retention_days': 'Backup Retention Period (Days)',
  'backup_time': 'Daily Backup Time',
  'backup_reminder_days': 'Backup Popup Interval (Days)',
  'backup_last_export_date': 'Last Backup Date',
  'open_library_api_url': 'Open Library API URL',
  'open_library_api_timeout': 'Open Library Timeout (Seconds)',
}

// ============================================================
// HOLIDAY CALENDAR COMPONENT
// ============================================================

export function HolidayCalendar({ holidays, canEdit, onHolidayChange }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingHoliday, setEditingHoliday] = useState(null)
  const [filterView, setFilterView] = useState('month') // 'month' or 'year'
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [form, setForm] = useState({
    holiday_name: '',
    start_date: '',
    end_date: '',
    is_recurring: false,
    description: ''
  })
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Month navigation
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const gotoToday = () => setCurrentDate(new Date())

  // Generate calendar days
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const calendarCells = []
  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarCells.push({
      day: daysInPrevMonth - i,
      monthOffset: -1,
      dateStr: `${month === 0 ? year - 1 : year}-${String(month === 0 ? 12 : month).padStart(2, '0')}-${String(daysInPrevMonth - i).padStart(2, '0')}`
    })
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({
      day: d,
      monthOffset: 0,
      dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    })
  }
  // Next month leading days (to fill 35 or 42 grid cells)
  const totalSlots = calendarCells.length <= 35 ? 35 : 42
  const nextSlots = totalSlots - calendarCells.length
  for (let d = 1; d <= nextSlots; d++) {
    calendarCells.push({
      day: d,
      monthOffset: 1,
      dateStr: `${month === 11 ? year + 1 : year}-${String(month === 11 ? 1 : month + 2).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    })
  }

  // Map holidays by date
  const holidayMap = {}
  holidays.forEach(h => {
    // Check exact date or recurring
    const [hYear, hMonth, hDay] = h.holiday_date.split('-')
    const key = h.holiday_date
    if (!holidayMap[key]) holidayMap[key] = []
    holidayMap[key].push(h)

    // If recurring, also match against current year's month-day
    if (h.is_recurring) {
      const recurKey = `${year}-${hMonth}-${hDay}`
      if (recurKey !== key) {
        if (!holidayMap[recurKey]) holidayMap[recurKey] = []
        holidayMap[recurKey].push({ ...h, isRecurInstance: true })
      }
    }
  })

  const todayStr = new Date().toISOString().split('T')[0]

  const openAddModal = (dateStr = null) => {
    setEditingHoliday(null)
    setForm({
      holiday_name: '',
      start_date: dateStr || todayStr,
      end_date: dateStr || todayStr,
      is_recurring: false,
      description: ''
    })
    setShowModal(true)
  }

  const openEditModal = (holiday) => {
    setEditingHoliday(holiday)
    setForm({
      holiday_name: holiday.holiday_name,
      start_date: holiday.holiday_date,
      end_date: holiday.holiday_date,
      is_recurring: !!holiday.is_recurring,
      description: holiday.description || ''
    })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setStatusMessage('')
    try {
      if (editingHoliday) {
        // Updating an existing record remains a one-day edit. New records can
        // use the inclusive from/to range above.
        await api.put(`/settings/holidays/${editingHoliday.holiday_id}`, {
          ...form,
          holiday_date: form.start_date
        })
        setStatusMessage({ type: 'success', text: 'Holiday updated successfully' })
      } else {
        await api.post('/settings/holidays', form)
        setStatusMessage({ type: 'success', text: 'Holiday added successfully' })
      }
      setShowModal(false)
      onHolidayChange()
      setTimeout(() => setStatusMessage(''), 3000)
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.response?.data?.error || err.message || 'Error saving holiday' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (holiday) => {
    if (!window.confirm(`Delete holiday "${holiday.holiday_name}"?`)) return
    try {
      await api.delete(`/settings/holidays/${holiday.holiday_id}`)
      setStatusMessage({ type: 'success', text: 'Holiday deleted' })
      onHolidayChange()
      setTimeout(() => setStatusMessage(''), 3000)
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.response?.data?.error || err.message || 'Error deleting holiday' })
    }
  }

  // Filter holidays for sidebar
  const displayedHolidays = holidays.filter(h => {
    if (filterView === 'month') {
      const [hY, hM] = h.holiday_date.split('-')
      return parseInt(hM) === month + 1 || (h.is_recurring && parseInt(hM) === month + 1)
    }
    return true
  }).sort((a, b) => a.holiday_date.localeCompare(b.holiday_date))
  const holidayPages = Math.max(1, Math.ceil(displayedHolidays.length / pageSize))
  const paginatedHolidays = displayedHolidays.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [filterView, year, month])

  useEffect(() => {
    if (currentPage > holidayPages) setCurrentPage(holidayPages)
  }, [currentPage, holidayPages])

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className="space-y-6">
      {statusMessage && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
        }`}>
          {statusMessage.type === 'success'
            ? <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            : <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />}
          {statusMessage.text}
        </div>
      )}

      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1a1a2e] p-5 rounded-2xl border border-gray-200 dark:border-[#2a2a4a] shadow-sm">
        <div className="flex items-center gap-3">
          <IconButton icon={ChevronLeft} label="Previous month" variant="subtle" onClick={prevMonth} />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white min-w-[200px] text-center">
            {monthNames[month]} {year}
          </h3>
          <IconButton icon={ChevronRight} label="Next month" variant="subtle" onClick={nextMonth} />
          <button
            onClick={gotoToday}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors border border-blue-200 dark:border-blue-800"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-lg bg-gray-100 dark:bg-[#0f0f1a] p-1 border border-gray-200 dark:border-[#2a2a4a]">
            <button
              onClick={() => setFilterView('month')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                filterView === 'month'
                  ? 'bg-white dark:bg-[#1a1a2e] text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setFilterView('year')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                filterView === 'year'
                  ? 'bg-white dark:bg-[#1a1a2e] text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              All Year ({holidays.length})
            </button>
          </div>

          {canEdit && (
            <Button size="sm" icon={Plus} onClick={() => openAddModal()}>
              Add Holiday
            </Button>
          )}
        </div>
      </div>

      {/* Grid + List Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid (2 cols on desktop) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1a1a2e] rounded-2xl border border-gray-200 dark:border-[#2a2a4a] p-5 shadow-sm">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            <span className="text-red-500">Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span className="text-blue-500">Sat</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((cell, idx) => {
              const dayHolidays = holidayMap[cell.dateStr] || []
              const isToday = cell.dateStr === todayStr
              const isSelected = selectedDate === cell.dateStr
              const isCurrentMonth = cell.monthOffset === 0

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedDate(cell.dateStr)
                    if (canEdit && dayHolidays.length === 0 && isCurrentMonth) {
                      // Click blank date to add
                    }
                  }}
                  className={`min-h-[85px] sm:min-h-[95px] p-2 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                    !isCurrentMonth
                      ? 'bg-gray-50/50 dark:bg-[#131322]/50 border-gray-100 dark:border-[#20203a] opacity-40'
                      : isToday
                      ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-400 dark:border-blue-600 shadow-sm'
                      : isSelected
                      ? 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-300 dark:border-blue-700'
                      : 'bg-white dark:bg-[#171728] border-gray-100 dark:border-[#242442] hover:border-blue-300 dark:hover:border-blue-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                      isToday
                        ? 'bg-blue-600 text-white'
                        : isCurrentMonth
                        ? 'text-gray-800 dark:text-gray-200'
                        : 'text-gray-400 dark:text-gray-600'
                    }`}>
                      {cell.day}
                    </span>
                    {dayHolidays.length > 0 && (
                      <span title="School holiday">
                        <PartyPopper className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                      </span>
                    )}
                  </div>

                  <div className="mt-1 space-y-1">
                    {dayHolidays.map((h, hIdx) => (
                      <div
                        key={hIdx}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (canEdit) openEditModal(h)
                        }}
                        className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 truncate shadow-xs hover:scale-102 transition-transform"
                        title={`${h.holiday_name}${h.is_recurring ? ' (Annual Recurring)' : ''}`}
                      >
                        {h.holiday_name}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Holidays List Sidebar */}
        <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-gray-200 dark:border-[#2a2a4a] p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-blue-500" aria-hidden="true" />
                {filterView === 'month' ? `${monthNames[month]} Holidays` : `All Holidays (${year})`}
              </h4>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                {displayedHolidays.length} Days
              </span>
            </div>

            {displayedHolidays.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No holidays for this period"
                className="border border-dashed border-gray-200 dark:border-[#2a2a4a] rounded-xl py-10"
                action={canEdit ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={Plus}
                    onClick={() => openAddModal(`${year}-${String(month + 1).padStart(2, '0')}-01`)}
                  >
                    Add a holiday in {monthNames[month]}
                  </Button>
                ) : undefined}
              />
            ) : (
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {paginatedHolidays.map((h) => (
                  <div
                    key={h.holiday_id}
                    className="p-3.5 rounded-xl border border-gray-200 dark:border-[#2a2a4a] bg-gray-50/70 dark:bg-[#171728] hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="font-semibold text-sm text-gray-900 dark:text-white">
                          {h.holiday_name}
                        </h5>
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-0.5 flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" aria-hidden="true" /> {h.holiday_date}
                        </p>
                      </div>
                      {h.is_recurring && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          Annual
                        </span>
                      )}
                    </div>

                    {h.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {h.description}
                      </p>
                    )}

                    {canEdit && (
                      <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-gray-200/60 dark:border-[#242442] text-xs">
                        <button
                          onClick={() => openEditModal(h)}
                          className="inline-flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Pencil className="h-3 w-3" aria-hidden="true" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(h)}
                          className="inline-flex items-center gap-1 font-medium text-red-600 dark:text-red-400 hover:underline"
                        >
                          <Trash2 className="h-3 w-3" aria-hidden="true" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Pagination currentPage={currentPage} totalPages={holidayPages} totalItems={displayedHolidays.length} perPage={pageSize} onPageChange={setCurrentPage} itemLabel="holidays" />
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
            <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span><strong>Library Due Date Rule:</strong> When a book return date lands on a configured holiday, the system automatically extends the due date to the next working day.</span>
          </div>
        </div>
      </div>

      {/* Add / Edit Holiday Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl max-w-md w-full p-6 border border-gray-200 dark:border-[#2a2a4a] shadow-xl animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {editingHoliday ? <Pencil className="h-4 w-4" aria-hidden="true" /> : <PartyPopper className="h-4 w-4" aria-hidden="true" />}
                {editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}
              </h3>
              <IconButton icon={X} label="Close" variant="ghost" onClick={() => setShowModal(false)} />
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                  Holiday Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Independence Day, Annual Sports Day"
                  value={form.holiday_name}
                  onChange={e => setForm({ ...form, holiday_name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                  From date *
                </label>
                <input
                  type="date"
                  required
                  value={form.start_date}
                  onChange={e => setForm({ ...form, start_date: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                  To date *
                </label>
                <input
                  type="date"
                  required
                  min={form.start_date || undefined}
                  value={form.end_date}
                  onChange={e => setForm({ ...form, end_date: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Each date in this range is excluded from overdue fines.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">
                  Description / Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Additional context or school schedule notes..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-[#141424] border border-gray-200 dark:border-[#242442]">
                <Checkbox
                  checked={form.is_recurring}
                  onChange={e => setForm({ ...form, is_recurring: e.target.checked })}
                  label={<span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5"><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Recurring Holiday (Occurs annually on this calendar date)</span>}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-[#2a2a4a]">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  {editingHoliday ? 'Update Holiday' : 'Save Holiday'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// SYSTEM SETTINGS TABLE COMPONENT
// ============================================================

function SystemSettingsTable({ canEdit }) {
  const [settingsList, setSettingsList] = useState([])
  const [editedValues, setEditedValues] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingKey, setSavingKey] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [statusMessage, setStatusMessage] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const loadSettings = async () => {
    try {
      setLoading(true)
      const res = await api.get('/settings/detailed')
      const list = res.data || []
      setSettingsList(list)
      const initialMap = {}
      list.forEach(s => {
        initialMap[s.setting_key] = s.setting_value
      })
      setEditedValues(initialMap)
    } catch (err) {
      console.error('Error loading settings detailed:', err)
      // Fallback to basic /settings endpoint
      try {
        const basicRes = await api.get('/settings')
        const basicData = basicRes.data || {}
        const fallbackList = Object.entries(basicData).map(([k, v], idx) => ({
          setting_id: idx + 1,
          setting_key: k,
          setting_value: v,
          category: 'General',
          data_type: typeof v === 'boolean' ? 'BOOLEAN' : typeof v === 'number' ? 'DECIMAL' : 'STRING',
          is_editable: true,
          description: SETTING_LABELS[k] || ''
        }))
        setSettingsList(fallbackList)
        setEditedValues(basicData)
      } catch (fallbackErr) {
        setStatusMessage({ type: 'error', text: 'Failed to load settings.' })
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const categories = ['ALL', ...Array.from(new Set(settingsList.map(s => s.category || 'General')))]

  const handleValueChange = (key, val) => {
    setEditedValues(prev => ({
      ...prev,
      [key]: val
    }))
  }

  const saveSingle = async (setting) => {
    const key = setting.setting_key
    const value = editedValues[key]
    setSavingKey(key)
    setStatusMessage('')
    try {
      await api.put(`/settings/${key}`, { value })
      window.dispatchEvent(new Event('app-settings-updated'))
      setStatusMessage({ type: 'success', text: `Saved "${SETTING_LABELS[key] || key}"` })
      loadSettings()
      setTimeout(() => setStatusMessage(''), 3000)
    } catch (err) {
      setStatusMessage({ type: 'error', text: `Error saving ${key}: ${err.response?.data?.error || err.message}` })
    } finally {
      setSavingKey(null)
    }
  }

  const saveAll = async () => {
    setSaving(true)
    setStatusMessage('')
    try {
      await api.post('/settings', editedValues)
      window.dispatchEvent(new Event('app-settings-updated'))
      setStatusMessage({ type: 'success', text: 'All system settings updated successfully!' })
      loadSettings()
      setTimeout(() => setStatusMessage(''), 3500)
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update settings' })
    } finally {
      setSaving(false)
    }
  }

  // Filter list
  const filtered = settingsList.filter(s => {
    const matchesCat = selectedCategory === 'ALL' || s.category === selectedCategory
    const label = SETTING_LABELS[s.setting_key] || ''
    const matchesSearch = s.setting_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCat && matchesSearch
  })
  const { sortedItems: sortedSettings, requestSort, directionFor } = useSortableData(filtered, null, (row, key) => {
    if (key === 'name') return SETTING_LABELS[row.setting_key] || row.setting_key
    return row[key]
  })
  const totalPages = Math.max(1, Math.ceil(sortedSettings.length / pageSize))
  const paginatedSettings = sortedSettings.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  // Has changes
  const hasChanges = settingsList.some(s => String(s.setting_value) !== String(editedValues[s.setting_key]))

  if (loading) {
    return <LoadingState label="Loading system configuration table…" />
  }

  return (
    <div className="space-y-6">
      {statusMessage && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
        }`}>
          {statusMessage.type === 'success'
            ? <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            : <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />}
          {statusMessage.text}
        </div>
      )}

      {/* Filter & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1a1a2e] p-4 rounded-2xl border border-gray-200 dark:border-[#2a2a4a] shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-[#2a2a4a] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#34345c]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search setting key or name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-64 pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
          </div>

          {canEdit && hasChanges && (
            <Button size="sm" variant="success" icon={Save} loading={saving} onClick={saveAll}>
              Save All Changes
            </Button>
          )}
        </div>
      </div>

      {/* Settings Table */}
      <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-gray-200 dark:border-[#2a2a4a] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-[#151525] border-b border-gray-200 dark:border-[#2a2a4a] text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <tr>
                <SortableTh sortKey="category" direction={directionFor('category')} onSort={requestSort} className="px-5 py-3.5">Category</SortableTh>
                <SortableTh sortKey="name" direction={directionFor('name')} onSort={requestSort} className="px-5 py-3.5">Setting Name & Key</SortableTh>
                <th className="px-5 py-3.5">Description</th>
                {/* <th className="px-5 py-3.5">Data Type</th> */}
                <th className="px-5 py-3.5 min-w-[220px]">Configured Value</th>
                {canEdit && <th className="px-5 py-3.5 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#242442]">
              {paginatedSettings.map(setting => {
                const key = setting.setting_key
                const label = SETTING_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                const catClass = CATEGORY_COLORS[setting.category] || CATEGORY_COLORS['Other']
                const currentVal = editedValues[key] ?? setting.setting_value
                const isModified = String(currentVal) !== String(setting.setting_value)
                const isBool = setting.data_type === 'BOOLEAN' || typeof currentVal === 'boolean' || currentVal === 'true' || currentVal === 'false'
                const isNumber = setting.data_type === 'INTEGER' || setting.data_type === 'DECIMAL'

                return (
                  <tr
                    key={key}
                    className={`hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors ${
                      isModified ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                    }`}
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border ${catClass}`}>
                        {setting.category || 'General'}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {label}
                      </div>
                      <code className="text-[11px] font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#0f0f1a] px-1.5 py-0.5 rounded mt-0.5 inline-block">
                        {key}
                      </code>
                    </td>

                    <td className="px-5 py-4 text-xs text-gray-600 dark:text-gray-400 max-w-xs">
                      {setting.description || 'System setting configuration parameter'}
                    </td>

                    {/* <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-[#2a2a4a] text-gray-700 dark:text-gray-300 font-mono">
                        {setting.data_type || 'STRING'}
                      </span>
                    </td> */}

                    <td className="px-5 py-4">
                      {isBool ? (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={currentVal === true || currentVal === 'true'}
                            onChange={e => handleValueChange(key, e.target.checked)}
                            disabled={!canEdit || !setting.is_editable}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 dark:bg-[#2a2a4a] peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          <span className="ml-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                            {currentVal === true || currentVal === 'true' ? 'Enabled' : 'Disabled'}
                          </span>
                        </label>
                      ) : key === 'backup_reminder_days' ? (
                        <select
                          value={currentVal || 7}
                          onChange={e => handleValueChange(key, Number(e.target.value))}
                          disabled={!canEdit || !setting.is_editable}
                          className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                        >
                          {[1, 7, 14, 30, 60, 90].map(days => <option key={days} value={days}>{days} day{days === 1 ? '' : 's'}</option>)}
                        </select>
                      ) : key === 'backup_frequency' ? (
                        <select
                          value={currentVal || 'daily'}
                          onChange={e => handleValueChange(key, e.target.value)}
                          disabled={!canEdit || !setting.is_editable}
                          className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      ) : (
                        <input
                          type={isNumber ? 'number' : 'text'}
                          value={currentVal ?? ''}
                          onChange={e => handleValueChange(key, isNumber ? parseFloat(e.target.value) || 0 : e.target.value)}
                          disabled={!canEdit || !setting.is_editable}
                          step={key.includes('fine') || key.includes('charge') || key.includes('price') ? '0.01' : '1'}
                          className="w-full max-w-[200px] px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    </td>

                    {canEdit && (
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        {setting.is_editable ? (
                          <Button
                            size="sm"
                            variant={isModified ? 'primary' : 'secondary'}
                            disabled={savingKey === key || !isModified}
                            loading={savingKey === key}
                            onClick={() => saveSingle(setting)}
                          >
                            Save
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500 italic">Read-only</span>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 border-t border-gray-200 dark:border-[#2a2a4a]">
          <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} perPage={pageSize} onPageChange={setCurrentPage} itemLabel="settings" />
        </div>
      </div>
    </div>
  )
}

// ============================================================
// MAIN SETTINGS PAGE CONTAINER
// ============================================================

function MemberGroupsSettings({ canEdit }) {
  const [groups, setGroups] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ group_name: '', singular_label: 'Student', plural_label: 'Students', library_enabled: false, programmes_enabled: false, subscriptions_enabled: false })
  const load = () => api.get('/students/member-groups').then((response) => setGroups(response.data || [])).catch(() => {})
  useEffect(() => { load() }, [])
  const save = async (event) => {
    event.preventDefault(); await api.post('/students/member-groups', form); setShowAdd(false)
    setForm({ group_name: '', singular_label: 'Student', plural_label: 'Students', library_enabled: false, programmes_enabled: false, subscriptions_enabled: false }); await load()
  }
  const update = async (group, changes) => { await api.put(`/students/member-groups/${group.group_code}`, { ...group, ...changes }); await load() }
  return <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-[#292944] dark:bg-[#17172a]">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold text-gray-900 dark:text-white">Student / Member Groups</h3><p className="text-xs text-gray-500">Create separate record pages and choose whether each group uses library features.</p></div>{canEdit && <Button size="sm" icon={Plus} onClick={() => setShowAdd(!showAdd)}>Add Group</Button>}</div>
    {showAdd && <form onSubmit={save} className="mt-4 grid gap-3 rounded-xl border bg-gray-50 p-4 dark:border-[#292944] dark:bg-[#10101d] md:grid-cols-3"><input required value={form.group_name} onChange={(e) => setForm({...form,group_name:e.target.value})} placeholder="Group name" className="rounded-lg border px-3 py-2 dark:bg-[#17172a]"/><input required value={form.singular_label} onChange={(e) => setForm({...form,singular_label:e.target.value})} placeholder="Singular label" className="rounded-lg border px-3 py-2 dark:bg-[#17172a]"/><input required value={form.plural_label} onChange={(e) => setForm({...form,plural_label:e.target.value})} placeholder="Plural label" className="rounded-lg border px-3 py-2 dark:bg-[#17172a]"/><Checkbox size="sm" checked={form.library_enabled} onChange={(e) => setForm({...form,library_enabled:e.target.checked})} label="Library access" className="text-xs" /><Checkbox size="sm" checked={form.programmes_enabled} onChange={(e) => setForm({...form,programmes_enabled:e.target.checked})} label="Programmes" className="text-xs" /><Checkbox size="sm" checked={form.subscriptions_enabled} onChange={(e) => setForm({...form,subscriptions_enabled:e.target.checked})} label="Subscriptions" className="text-xs" /><Button type="submit" size="sm" variant="success">Create Group</Button></form>}
    <div className="mt-4 grid gap-3 md:grid-cols-2">{groups.map((group) => <div key={group.group_code} className="rounded-xl border p-4 dark:border-[#292944]"><div className="flex items-start justify-between"><div><div className="font-bold">{group.group_name}</div><div className="text-xs text-gray-500">{group.member_count} records · {group.group_code}</div></div><Badge tone={group.is_active ? 'success' : 'neutral'}>{group.is_active ? 'ACTIVE' : 'INACTIVE'}</Badge></div><div className="mt-3 flex flex-wrap gap-2 text-[11px]"><span>Library: {group.library_enabled ? 'Yes' : 'No'}</span><span>Programme: {group.programmes_enabled ? 'Yes' : 'No'}</span><span>Subscription: {group.subscriptions_enabled ? 'Yes' : 'No'}</span></div>{canEdit && group.group_code !== 'JK_MEMBERS' && <button onClick={() => update(group, { is_active: !group.is_active })} className="mt-3 text-xs font-bold text-blue-600">{group.is_active ? 'Deactivate' : 'Activate'}</button>}</div>)}</div>
  </div>
}

function Settings() {
  const { user, hasPermission } = useAuth()
  const canEdit = user?.role === 'ADMIN' || hasPermission('settings.view')

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Settings"
        description="Configure global library parameters, lending policies, charges, and system behaviour."
      />

      <MemberGroupsSettings canEdit={canEdit} />
      <SystemSettingsTable canEdit={canEdit} />
    </div>
  )
}

export default Settings
