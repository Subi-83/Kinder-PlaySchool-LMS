import React, { useEffect, useState } from 'react'

export const showAlert = (message, type = 'success') => {
  if (message) window.dispatchEvent(new CustomEvent('app-alert', { detail: { message, type } }))
}

function Alert() {
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    const receive = (event) => {
      const id = `${Date.now()}-${Math.random()}`
      setAlerts((current) => [...current.slice(-3), { id, type: event.detail?.type || 'success', message: event.detail?.message || '' }])
      window.setTimeout(() => setAlerts((current) => current.filter((item) => item.id !== id)), 4000)
    }
    window.addEventListener('app-alert', receive)
    return () => window.removeEventListener('app-alert', receive)
  }, [])

  const styles = {
    success: 'border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200',
    warning: 'border-yellow-300 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
    error: 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200'
  }
  const icons = { success: '✓', warning: '!', error: '×' }

  return <div className="fixed right-4 top-4 z-[200] flex w-[min(92vw,380px)] flex-col gap-2" aria-live="polite">
    {alerts.map((alert) => <div key={alert.id} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${styles[alert.type] || styles.success}`}>
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-bold">{icons[alert.type] || '✓'}</span>
      <p className="min-w-0 flex-1 break-words font-medium">{alert.message}</p>
      <button type="button" onClick={() => setAlerts((current) => current.filter((item) => item.id !== alert.id))} className="text-lg leading-none opacity-70" aria-label="Close alert">×</button>
    </div>)}
  </div>
}

export default Alert
