import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { useAppSettings } from '../context/AppSettingsContext'

function Dashboard() {
  const { user, isAuthenticated } = useAuth()
  const { memberLabel, membersLabel } = useAppSettings()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total_students: 0,
    active_members: 0,
    total_books: 0,
    available: 0,
    issued: 0,
    damaged: 0,
    lost: 0,
    active_issues: 0,
    overdue: 0,
    today_issues: 0,
    today_returns: 0,
    total_deposits: 0,
    total_fines: 0,
    total_damages: 0,
    total_balance: 0
  })
  const [alerts, setAlerts] = useState({ overdue_books: [], low_deposits: [] })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated()) return
    let isMounted = true

    async function fetchDashboardData() {
      setLoading(true)
      try {
        const results = await Promise.allSettled([
          api.get('/reports/stock'),
          api.get('/reports/members'),
          api.get('/reports/issue-return'),
          api.get('/reports/financial'),
          api.get('/reports/dashboard-alerts')
        ])

        if (!isMounted) return

        const [stockRes, membersRes, flowRes, financeRes, alertRes] = results

        const combinedStats = {}
        let hasForbidden = false

        if (stockRes.status === 'fulfilled') Object.assign(combinedStats, stockRes.value.data)
        if (membersRes.status === 'fulfilled') Object.assign(combinedStats, membersRes.value.data)
        if (flowRes.status === 'fulfilled') Object.assign(combinedStats, flowRes.value.data)
        if (financeRes.status === 'fulfilled') Object.assign(combinedStats, financeRes.value.data)

        results.forEach(res => {
          if (res.status === 'rejected' && res.reason?.response?.status === 403) {
            hasForbidden = true
          }
        })

        setStats(prev => ({ ...prev, ...combinedStats }))

        if (alertRes.status === 'fulfilled' && alertRes.value.data) {
          setAlerts(alertRes.value.data)
        }

        if (hasForbidden) {
          setError('Some dashboard reports are restricted based on your role permissions.')
        } else {
          setError('')
        }
      } catch (e) {
        if (isMounted) {
          setError(e.response?.data?.error || e.message || 'Could not load dashboard.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchDashboardData()
    return () => { isMounted = false }
  }, [isAuthenticated])

  if (loading) return <div className="h-64 grid place-items-center text-gray-500 dark:text-gray-400">Loading dashboard…</div>

  const cards = [
    [membersLabel, stats.total_students, '👩‍🎓', 'blue', '/students'],
    ['Active memberships', stats.active_members, '✨', 'violet', '/subscriptions'],
    ['Books in library', (stats.total_books - stats.lost), '📚', 'amber', '/books'],
    ['Available now', stats.available, '✅', 'emerald', '/books'],
    ['Currently issued', stats.active_issues, '📖', 'cyan', '/library'],
    ['Overdue', stats.overdue, '⏰', 'rose', '/library'],
    ['Today issues', stats.today_issues, '↗', 'indigo', '/library'],
    ['Today returns', stats.today_returns, '↙', 'green', '/library']
  ]
  const max = Math.max(stats.available || 0, stats.issued || 0, stats.damaged || 0, stats.lost || 0, 1)

  return (
    <div className="space-y-6 text-gray-900 dark:text-gray-100">
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 dark:from-[#20234b] dark:via-[#1b1d3a] dark:to-[#162b42] p-6 text-white shadow-md">
        <p className="text-blue-100 dark:text-blue-300 text-sm font-semibold uppercase tracking-wider">LIBRARY COMMAND CENTER</p>
        <h2 className="mt-1 text-3xl font-bold">Good day, {user?.full_name || 'Administrator'}.</h2>
        <p className="mt-2 text-blue-50 dark:text-gray-300">Everything important, at a glance. Click any stat card below to go directly to its section.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          {[
            ['/students', `Add ${memberLabel}`],
            ['/books', 'Add book'],
            ['/library', 'Issue / return'],
            ['/reports', 'Open reports']
          ].map(([path, label]) => (
            <Link key={path} to={path} className="rounded-lg bg-white/20 hover:bg-white/30 text-white px-4 py-2 text-sm font-medium transition-colors">
              {label}
            </Link>
          ))}
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 dark:bg-red-950/60 p-3 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(([label, value, icon, color, path]) => (
          <Link
            key={label}
            to={path}
            className="group rounded-xl bg-white dark:bg-[#1a1a2e] p-4 shadow-sm border border-gray-200 dark:border-[#2a2a4a] hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all block cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-medium transition-colors">{label}</span>
              <span className="text-xl group-hover:scale-110 transition-transform">{icon}</span>
            </div>
            <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">{value || 0}</p>
            <div className={`mt-3 h-1 rounded bg-${color}-500/60 group-hover:bg-blue-500 transition-colors`}></div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <section className="lg:col-span-3 rounded-2xl bg-white dark:bg-[#1a1a2e] p-5 border border-gray-200 dark:border-[#2a2a4a] shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white">Book availability</h3>
            <Link to="/books" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Manage inventory →</Link>
          </div>
          <div className="mt-6 space-y-4">
            {[
              ['Available', stats.available, 'bg-emerald-500'],
              ['Issued', stats.issued, 'bg-cyan-500'],
              ['Damaged', stats.damaged, 'bg-amber-500'],
              ['Lost', stats.lost, 'bg-rose-500']
            ].map(([label, value, color]) => (
              <div key={label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">{label}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{value || 0}</span>
                </div>
                <div className="h-3 rounded-full bg-gray-100 dark:bg-[#10101d]">
                  <div className={`h-3 rounded-full ${color}`} style={{ width: `${((value || 0) / max) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
      <section className="rounded-2xl bg-white dark:bg-[#1a1a2e] p-5 border border-gray-200 dark:border-[#2a2a4a] shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{memberLabel} warnings</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Overdue books and deposits below each {memberLabel.toLowerCase()}’s warning limit.</p>
          </div>
          <span className="rounded-full bg-amber-100 dark:bg-amber-950/50 px-3 py-1 text-sm font-medium text-amber-800 dark:text-amber-300">
            {alerts.overdue_books.length + alerts.low_deposits.length} open
          </span>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 overflow-hidden">
            <div className="bg-rose-50 dark:bg-rose-950/30 px-4 py-2 text-sm font-semibold text-rose-800 dark:text-rose-300">Overdue books ({alerts.overdue_books.length})</div>
            {alerts.overdue_books.length ? alerts.overdue_books.map((item) => (
              <Link key={item.issue_id} to="/library" className="block border-t border-rose-100 dark:border-rose-900/40 px-4 py-3 hover:bg-rose-50/60 dark:hover:bg-rose-950/20">
                <p className="font-medium text-gray-900 dark:text-white">{item.student_name} <span className="text-xs font-normal text-gray-500">({item.student_uid})</span></p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{item.book_title || 'Book'} · due {item.due_date} · {item.days_overdue} day(s) late</p>
              </Link>
            )) : <p className="px-4 py-5 text-sm text-gray-500 dark:text-gray-400">No overdue books.</p>}
          </div>
          <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 overflow-hidden">
            <div className="bg-amber-50 dark:bg-amber-950/30 px-4 py-2 text-sm font-semibold text-amber-800 dark:text-amber-300">Low deposits ({alerts.low_deposits.length})</div>
            {alerts.low_deposits.length ? alerts.low_deposits.map((item) => (
              <Link key={item.student_id} to="/deposits" className="block border-t border-amber-100 dark:border-amber-900/40 px-4 py-3 hover:bg-amber-50/60 dark:hover:bg-amber-950/20">
                <p className="font-medium text-gray-900 dark:text-white">{item.student_name} <span className="text-xs font-normal text-gray-500">({item.student_uid})</span></p>
                <p className="text-sm text-gray-600 dark:text-gray-300">Balance: ₹{item.current_balance.toLocaleString()} · warning at ₹{item.warning_threshold.toLocaleString()}</p>
              </Link>
            )) : <p className="px-4 py-5 text-sm text-gray-500 dark:text-gray-400">All deposit balances are healthy.</p>}
          </div>
        </div>
      </section>

      
        {/* {<section className="rounded-2xl bg-white dark:bg-[#1a1a2e] p-5 border border-gray-200 dark:border-[#2a2a4a] shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white">Financial summary</h3>
            <Link to="/deposits" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Deposits →</Link>
          </div>
          <div className="mt-5 space-y-4">
            {[
              ['Deposits', stats.total_deposits],
              ['Fine collection', stats.total_fines],
              ['Damage charges', stats.total_damages],
              ['Current balance', stats.total_balance]
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-gray-50 dark:bg-[#10101d] p-3 border border-gray-100 dark:border-[#2a2a4a]">
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">₹{Number(value || 0).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>} */}
      

      
    </div>
  )
}

export default Dashboard
