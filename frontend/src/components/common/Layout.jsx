import React, { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

function AdminLoginPrompts({ user, loginPromptKey }) {
  const [step, setStep] = useState(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [backupInterval, setBackupInterval] = useState(7)

  useEffect(() => {
    if (String(user?.role || '').toUpperCase() !== 'ADMIN') return
    if (!loginPromptKey && sessionStorage.getItem('show_admin_login_prompts') !== 'true') return

    // Consume immediately so React StrictMode or a page change cannot open it twice.
    sessionStorage.removeItem('show_admin_login_prompts')
    let active = true
    api.get('/settings/backup-reminder-status')
      .then((backupResult) => {
        if (!active) return
        const backupData = backupResult?.data || {}
        const isBackupDue = Boolean(backupData?.backup_due)
        setBackupInterval(Number(backupData?.reminder_days || 7))
        setStep(isBackupDue ? 'backup' : null)
      })
      .catch(() => {})
    return () => { active = false }
  }, [user?.role, loginPromptKey])

  const [statusMsg, setStatusMsg] = useState(null)
  const [backupResult, setBackupResult] = useState(null)

  const handleBackupNow = async () => {
    setBusy(true)
    setMessage('Creating backup...')
    setStatusMsg({ type: 'info', text: 'Creating backup (JSON + SQL) and sending to admin email...' })
    try {
      const response = await api.post('/settings/backup/run')
      const data = response.data || {}
      setBackupResult(data)
      if (data.email_sent) {
        setStatusMsg({ type: 'success', text: 'Backup completed successfully and sent to admin email.' })
      } else {
        setStatusMsg({ type: 'warning', text: 'Backup generated successfully, but email delivery failed.' })
      }
    } catch (error) {
      setStatusMsg({
        type: 'error',
        text: error.response?.data?.message || error.response?.data?.error || 'Failed to create backup.'
      })
    } finally {
      setBusy(false)
    }
  }

  const downloadBackup = async () => {
    setBusy(true)
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
    } catch (error) {
      setStatusMsg({ type: 'error', text: error.response?.data?.error || 'Could not download the backup.' })
    } finally {
      setBusy(false)
    }
  }

  if (step !== 'backup') return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-[#393954] dark:bg-[#17172a]">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Database Backup Reminder</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Your {backupInterval}-day backup reminder is due. Creating a backup generates both a complete JSON archive and a native SQL dump, then automatically emails them to registered administrators.
        </p>
        {statusMsg && (
          <div className={`mt-3 p-3 rounded-xl text-xs font-semibold ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : statusMsg.type === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
              : statusMsg.type === 'info'
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}>
            {statusMsg.text}
          </div>
        )}
        {backupResult && (
          <div className="mt-3 text-xs text-gray-500 space-y-1">
            <p><strong>JSON:</strong> {backupResult.json_file}</p>
            <p><strong>SQL:</strong> {backupResult.sql_file}</p>
            {backupResult.recipients && <p><strong>Recipients:</strong> {backupResult.recipients.join(', ')}</p>}
          </div>
        )}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button disabled={busy} onClick={() => setStep(null)} className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-bold text-gray-700 dark:border-[#393954] dark:text-gray-200">
            {statusMsg?.type === 'success' ? 'Close' : 'Later'}
          </button>
          <button disabled={busy} onClick={downloadBackup} className="rounded-xl border border-blue-200 dark:border-blue-800 px-4 py-2.5 text-sm font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30">
            Download JSON
          </button>
          <button disabled={busy} onClick={handleBackupNow} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60 hover:bg-blue-700">
            {busy ? 'Creating backup…' : 'Backup Now'}
          </button>
        </div>
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
