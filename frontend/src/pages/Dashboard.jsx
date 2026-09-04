import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  GraduationCap, Sparkles, BookOpen, CheckCircle2, BookOpenCheck, AlarmClock,
  ArrowUpRight, ArrowDownRight, AlertTriangle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { useAppSettings } from '../context/AppSettingsContext'
import StatCard from '../components/ui/StatCard'
import Card, { CardHeader } from '../components/ui/Card'
import { LoadingState } from '../components/ui/LoadingState'
import Badge from '../components/ui/Badge'

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

  if (loading) return <LoadingState label="Loading dashboard…" />

  const cards = [
    { label: membersLabel, value: stats.total_students, icon: GraduationCap, tone: 'blue', to: '/students' },
    { label: 'Active memberships', value: stats.active_members, icon: Sparkles, tone: 'violet', to: '/subscriptions' },
    { label: 'Books in library', value: stats.total_books - stats.lost, icon: BookOpen, tone: 'amber', to: '/books' },
    { label: 'Available now', value: stats.available, icon: CheckCircle2, tone: 'emerald', to: '/books' },
    { label: 'Currently issued', value: stats.active_issues, icon: BookOpenCheck, tone: 'cyan', to: '/library' },
    { label: 'Overdue', value: stats.overdue, icon: AlarmClock, tone: 'rose', to: '/library' },
    { label: 'Today issues', value: stats.today_issues, icon: ArrowUpRight, tone: 'indigo', to: '/library' },
    { label: 'Today returns', value: stats.today_returns, icon: ArrowDownRight, tone: 'green', to: '/library' },
  ]
  const max = Math.max(stats.available || 0, stats.issued || 0, stats.damaged || 0, stats.lost || 0, 1)
  const openAlertCount = alerts.overdue_books.length + alerts.low_deposits.length

  return (
    <div className="space-y-6 text-gray-900 dark:text-gray-100">
      {/* Welcome / primary actions */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 dark:from-[#20234b] dark:via-[#1b1d3a] dark:to-[#162b42] p-6 text-white shadow-md">
        <p className="text-blue-100 dark:text-blue-300 text-sm font-semibold uppercase tracking-wider">Library command center</p>
        <h2 className="mt-1 text-3xl font-bold">Good day, {user?.full_name || 'Administrator'}.</h2>
        <p className="mt-2 text-blue-50 dark:text-gray-300">Everything important, at a glance. Click any stat card below to go directly to its section.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          {[
            ['/students', `Add ${memberLabel}`],
            ['/books', 'Add book'],
            ['/library', 'Issue / return'],
            ['/reports', 'Open reports']
          ].map(([path, label]) => (
            <Link key={path} to={path} className="rounded-lg bg-white/15 hover:bg-white/25 text-white px-4 py-2 text-sm font-medium transition-colors">
              {label}
            </Link>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => <StatCard key={card.label} {...card} />)}
      </div>

      {/* Learning / operational progress */}
      <Card>
        <CardHeader
          title="Book availability"
          action={<Link to="/books" className="text-xs font-medium text-primary-main dark:text-blue-400 hover:underline">Manage inventory →</Link>}
        />
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
                <span className="font-medium text-gray-900 dark:text-white tabular-nums">{value || 0}</span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-100 dark:bg-[#10101d]">
                <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${((value || 0) / max) * 100}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent activity / attention needed */}
      <Card>
        <CardHeader
          title={`${memberLabel} warnings`}
          description={`Overdue books and deposits below each ${memberLabel.toLowerCase()}'s warning limit.`}
          action={<Badge tone={openAlertCount > 0 ? 'warning' : 'success'}>{openAlertCount} open</Badge>}
        />
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
      </Card>
    </div>
  )
}

export default Dashboard
