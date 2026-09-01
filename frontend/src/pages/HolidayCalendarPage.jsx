import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { HolidayCalendar } from './Settings'

function HolidayCalendarPage() {
  const { user, hasAnyPermission } = useAuth()
  const [holidays, setHolidays] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const canEdit = user?.role === 'ADMIN' || hasAnyPermission(['holiday.create', 'holiday.edit', 'holiday.delete'])

  const loadHolidays = async () => {
    try {
      setError('')
      const response = await api.get('/settings/holidays')
      setHolidays(response.data || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load the holiday calendar.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadHolidays() }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">📅 Holiday Calendar</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage official holidays used for return dates and fine calculations.</p>
      </div>
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">{error}</div>}
      {loading
        ? <div className="flex items-center justify-center gap-3 py-20 text-gray-500"><span className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />Loading holiday calendar...</div>
        : <HolidayCalendar holidays={holidays} canEdit={canEdit} onHolidayChange={loadHolidays} />}
    </div>
  )
}

export default HolidayCalendarPage
