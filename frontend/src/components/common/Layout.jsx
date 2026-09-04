import React, { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

function AdminLoginPrompts({ user, loginPromptKey }) {
  const [step, setStep] = useState(null)
  const [holidayName, setHolidayName] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [backupDue, setBackupDue] = useState(false)
  const [backupInterval, setBackupInterval] = useState(7)

  useEffect(() => {
    if (String(user?.role || '').toUpperCase() !== 'ADMIN') return
    if (!loginPromptKey && sessionStorage.getItem('show_admin_login_prompts') !== 'true') return

    // Consume immediately so React StrictMode or a page change cannot open it twice.
    sessionStorage.removeItem('show_admin_login_prompts')
    let active = true
    Promise.allSettled([
      api.get('/audit/notifications'),
      api.get('/settings/backup-reminder-status')
    ])
      .then(([notificationResult, backupResult]) => {
        if (!active) return
        const notificationData = notificationResult.status === 'fulfilled' ? notificationResult.value.data : {}
        const backupData = backupResult.status === 'fulfilled' ? backupResult.value.data : {}
        const needsHolidayAnswer = (notificationData?.notifications || []).some(
          (notice) => notice.requires_holiday_confirmation
        )
        const isBackupDue = Boolean(backupData?.backup_due)
        setBackupDue(isBackupDue)
        setBackupInterval(Number(backupData?.reminder_days || 7))
        setStep(needsHolidayAnswer ? 'holiday' : (isBackupDue ? 'backup' : null))
      })
    return () => { active = false }
  }, [user?.role, loginPromptKey])

  const answerHoliday = async (isHoliday) => {
    if (isHoliday && !holidayName.trim()) {
      setMessage('Enter the holiday name before confirming.')
      return
    }
    setBusy(true)
    setMessage('')
    try {
      await api.post('/audit/daily-holiday', {
        is_holiday: isHoliday,
        holiday_name: holidayName.trim() || 'Official Holiday'
      })
      setStep(backupDue ? 'backup' : null)
    } catch (error) {
      setMessage(error.response?.data?.error || 'Could not save today’s holiday status.')
    } finally {
      setBusy(false)
    }
  }

  const downloadBackup = async () => {
    setBusy(true)
    setMessage('')
    try {
      const response = await api.get('/settings/export-backup')
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `library_management_full_backup_${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setStep(null)
    } catch (error) {
      setMessage(error.response?.data?.error || 'Could not download the backup.')
    } finally {
      setBusy(false)
    }
  }

  if (!step) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-[#393954] dark:bg-[#17172a]">
        {step === 'holiday' ? (
          <>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Is today a holiday?</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Confirm today’s status so issue dates, return dates, and holiday calculations remain correct.</p>
            <input value={holidayName} onChange={(event) => setHolidayName(event.target.value)} placeholder="Holiday name (required for Yes)" className="mt-4 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-[#393954] dark:bg-[#10101d] dark:text-white" />
            {message && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{message}</p>}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button disabled={busy} onClick={() => answerHoliday(false)} className="rounded-xl bg-gray-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">No, Working Day</button>
              <button disabled={busy} onClick={() => answerHoliday(true)} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">Yes, Holiday</button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Download today’s backup?</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Your {backupInterval}-day backup reminder is due. Keep a current copy of members, books, library transactions, deposits, subscriptions, holidays, and settings.</p>
            {message && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{message}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button disabled={busy} onClick={() => setStep(null)} className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-bold text-gray-700 dark:border-[#393954] dark:text-gray-200">Later</button>
              <button disabled={busy} onClick={downloadBackup} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{busy ? 'Preparing…' : 'Download Backup'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Layout() {
  const { user, loginPromptKey } = useAuth()
  // Lifted up from Sidebar so the content margin below can track the
  // sidebar's real width. Previously Sidebar toggled its own width
  // independently and Layout used a fixed `ml-16 lg:ml-64` that ignored
  // it, so collapsing/expanding the sidebar left the content margin
  // wrong (overlap or a big empty gap) instead of moving with it.
  const [collapsed, setCollapsed] = useState(false)
  // Mobile nav is a separate concern from desktop collapse: below the
  // `lg` breakpoint the sidebar renders as an off-canvas drawer instead
  // of a persistent column, so it needs its own open/close state.
  const [mobileOpen, setMobileOpen] = useState(false)

  // Notification polling lives here (not in Sidebar) so both the sidebar
  // nav badge and the header bell read one shared count instead of each
  // polling the API independently.
  const [notificationCount, setNotificationCount] = useState(0)

  useEffect(() => {
    if (user?.role !== 'ADMIN') return undefined
    let active = true
    const loadNotifications = () => {
      api.get('/audit/notifications')
        .then((response) => { if (active) setNotificationCount(response.data?.pending_count || 0) })
        .catch(() => {})
    }
    loadNotifications()
    const timer = setInterval(loadNotifications, 30000)
    return () => { active = false; clearInterval(timer) }
  }, [user?.role])

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0f0f1a]">
      <AdminLoginPrompts user={user} loginPromptKey={loginPromptKey} />
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        notificationCount={notificationCount}
      />
      <div
        className={`flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-64'}`}
      >
        <Header user={user} notificationCount={notificationCount} onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
