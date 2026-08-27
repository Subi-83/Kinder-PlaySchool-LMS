import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { useAppSettings } from '../context/AppSettingsContext'

function BookConditionReview({ notice, onSaved, onError }) {
  const [condition, setCondition] = useState(notice.current_condition || 'GOOD')
  const [status, setStatus] = useState(notice.current_status || 'AVAILABLE')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const response = await api.post(`/audit/book-condition-reviews/${notice.record_id}`, { condition, status, notes })
      onSaved(response.data?.message || 'Book condition review saved.')
    } catch (error) {
      onError(error.response?.data?.error || 'Could not save the book condition review.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/20 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Condition
        <select value={condition} onChange={(event) => setCondition(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-[#393954] dark:bg-[#10101d]">
          {['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'].map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Status
        <select value={status} disabled={notice.current_status === 'ISSUED'} onChange={(event) => setStatus(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:opacity-60 dark:border-[#393954] dark:bg-[#10101d]">
          {['AVAILABLE', 'ISSUED', 'DAMAGED', 'LOST', 'RESERVED'].map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 sm:col-span-2 lg:col-span-1">Review notes
        <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional notes" className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-[#393954] dark:bg-[#10101d]" />
      </label>
      <div className="flex items-end">
        <button disabled={saving} className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Complete Review'}</button>
      </div>
    </form>
  )
}

function Notifications() {
  const { membersLabel } = useAppSettings()
  const tabs = ['MEMBERS', 'Books', 'Library', 'Deposit', 'Holiday', 'Users']
  const [activeTab, setActiveTab] = useState('MEMBERS')
  const [data, setData] = useState({ notifications: [], pending_count: 0 })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [holidayName, setHolidayName] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('ALL')

  const load = async () => {
    try {
      const response = await api.get('/audit/notifications')
      setData(response.data || { notifications: [], pending_count: 0 })
    } catch (error) {
      setMessage(error.response?.data?.error || 'Could not load notifications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const decideDelete = async (notice, decision) => {
    try {
      const response = await api.post(`/audit/delete-requests/${notice.audit_id}/${decision}`)
      setMessage(response.data?.message || 'Request updated.')
      await load()
    } catch (error) {
      setMessage(error.response?.data?.error || 'Could not process request.')
    }
  }

  const decideDepositCorrection = async (notice, decision) => {
    try {
      const response = await api.post(`/audit/deposit-corrections/${notice.audit_id}/${decision}`)
      setMessage(response.data?.message || 'Deposit correction updated.')
      await load()
    } catch (error) {
      setMessage(error.response?.data?.error || 'Could not process the deposit correction.')
    }
  }

  const answerHoliday = async (isHoliday) => {
    try {
      const response = await api.post('/audit/daily-holiday', {
        is_holiday: isHoliday,
        holiday_name: holidayName || 'Official Holiday'
      })
      setMessage(response.data?.message || 'Holiday status saved.')
      setHolidayName('')
      await load()
    } catch (error) {
      setMessage(error.response?.data?.error || 'Could not save today’s holiday status.')
    }
  }

  if (loading) return <p className="py-16 text-center text-gray-500">Loading notifications…</p>

  const belongsToTab = (notice) => {
    const action = notice.action || ''
    const module = notice.module || ''
    if (activeTab === 'MEMBERS') return module === 'Student'
    if (activeTab === 'Books') return ['Book', 'BookCopy'].includes(module) && action !== 'BOOK_CONDITION_REVIEW'
    if (activeTab === 'Library') return module === 'Library' || action === 'BOOK_CONDITION_REVIEW' || ['RETURN_BOOK', 'RECORD_DAMAGE_LOSS'].includes(action)
    if (activeTab === 'Deposit') return module === 'Deposit' || action.startsWith('DEPOSIT_')
    if (activeTab === 'Holiday') return module === 'Holiday' || action.includes('HOLIDAY')
    return module === 'User' || action.includes('APPROVED') || action.includes('REJECTED')
  }
  const matchesFilters = (notice) => {
    const query = search.trim().toLowerCase()
    const searchable = [notice.action, notice.details, notice.username, notice.module, notice.record_id, notice.book_title, notice.barcode].filter(Boolean).join(' ').toLowerCase()
    if (query && !searchable.includes(query)) return false
    if (typeFilter === 'PENDING' && !notice.requires_approval) return false
    if (typeFilter === 'REVIEW' && notice.action !== 'BOOK_CONDITION_REVIEW') return false
    if (typeFilter === 'SYSTEM' && notice.username !== 'System') return false
    if (dateFilter !== 'ALL') {
      const created = new Date(String(notice.created_at || '').replace(' ', 'T'))
      if (Number.isNaN(created.getTime())) return false
      const days = Number(dateFilter)
      const cutoff = new Date()
      cutoff.setHours(0, 0, 0, 0)
      cutoff.setDate(cutoff.getDate() - (days - 1))
      if (created < cutoff) return false
    }
    return true
  }
  const visibleNotifications = data.notifications.filter(belongsToTab).filter(matchesFilters)

  const reviewSaved = async (text) => {
    setMessage(text)
    await load()
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Notifications</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Approvals, deposit activity, edited values, and annual book-condition reminders.</p>
      </div>
      {message && <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 p-3 text-sm">{message}</div>}
      <div className="flex gap-2 overflow-x-auto border-b border-gray-200 dark:border-[#292944]">
        {tabs.map((tab) => {
          const count = data.notifications.filter((notice) => {
            if (tab === 'MEMBERS') return notice.module === 'Student'
            if (tab === 'Books') return ['Book', 'BookCopy'].includes(notice.module) && notice.action !== 'BOOK_CONDITION_REVIEW'
            if (tab === 'Library') return notice.module === 'Library' || notice.action === 'BOOK_CONDITION_REVIEW'
            if (tab === 'Deposit') return notice.module === 'Deposit' || notice.action.startsWith('DEPOSIT_')
            if (tab === 'Holiday') return notice.module === 'Holiday' || notice.action.includes('HOLIDAY')
            return notice.module === 'User' || notice.action.includes('APPROVED') || notice.action.includes('REJECTED')
          }).length
          return <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 ${activeTab === tab ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500'}`}>{tab === 'MEMBERS' ? membersLabel : tab} {count > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-[#292944] text-[10px]">{count}</span>}</button>
        })}
      </div>
      <div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-[#292944] dark:bg-[#17172a] md:grid-cols-[1fr_180px_180px]">
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Search notifications
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${activeTab.toLowerCase()}...`} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-[#393954] dark:bg-[#10101d]" />
        </label>
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Type
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-[#393954] dark:bg-[#10101d]">
            <option value="ALL">All types</option>
            <option value="PENDING">Pending approval</option>
            <option value="REVIEW">Condition review</option>
            <option value="SYSTEM">System notification</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Date
          <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-[#393954] dark:bg-[#10101d]">
            <option value="ALL">All dates</option>
            <option value="1">Today</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </label>
      </div>
      <div className="rounded-2xl border border-gray-200 dark:border-[#292944] bg-white dark:bg-[#17172a] overflow-hidden">
        {visibleNotifications.length === 0 ? <p className="p-10 text-center text-gray-500">No {activeTab.toLowerCase()} notifications match the selected filters.</p> : visibleNotifications.map((notice) => (
          <div key={`${notice.action}-${notice.audit_id || notice.record_id}`} className="p-5 border-b last:border-b-0 border-gray-200 dark:border-[#292944]">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div><h3 className="font-bold text-gray-900 dark:text-white">{notice.action.replaceAll('_', ' ')}</h3><p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{notice.details}</p><p className="mt-1 text-xs text-gray-400">By {notice.username || 'System'} · {notice.created_at || 'Current'}</p></div>
              <div className="flex gap-2 shrink-0">
                {notice.requires_approval && notice.action === 'DEPOSIT_CORRECTION_REQUEST' && <><button onClick={() => decideDepositCorrection(notice, 'approve')} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold">Approve Correction</button><button onClick={() => decideDepositCorrection(notice, 'reject')} className="px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-[#292944] text-xs font-bold">Reject</button></>}
                {notice.requires_approval && notice.action !== 'DEPOSIT_CORRECTION_REQUEST' && <><button onClick={() => decideDelete(notice, 'approve')} className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold">Approve Delete</button><button onClick={() => decideDelete(notice, 'reject')} className="px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-[#292944] text-xs font-bold">Reject</button></>}
              </div>
            </div>
            {notice.action === 'BOOK_CONDITION_REVIEW' && <BookConditionReview notice={notice} onSaved={reviewSaved} onError={setMessage} />}
            {notice.requires_holiday_confirmation && (
              <div className="mt-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-4">
                <p className="text-xs text-amber-800 dark:text-amber-300 mb-2">Calendar currently marks today as: <strong>{notice.configured_holiday ? 'Holiday' : 'Working day'}</strong></p>
                <input value={holidayName} onChange={(event) => setHolidayName(event.target.value)} placeholder="Holiday name (required only for Yes)" className="w-full sm:w-80 rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-[#10101d] px-3 py-2 text-sm" />
                <div className="flex gap-2 mt-3"><button onClick={() => answerHoliday(true)} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold">Yes, Today Is Holiday</button><button onClick={() => answerHoliday(false)} className="px-4 py-2 rounded-lg bg-gray-700 text-white text-xs font-bold">No, Working Day</button></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Notifications
