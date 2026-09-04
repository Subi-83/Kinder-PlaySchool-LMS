import React from 'react'
import { Link } from 'react-router-dom'

const TONE_STYLES = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
  green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
}

// Key-metric tile for dashboards and report summaries. Optionally a
// link so the whole card is a shortcut into the relevant section.
function StatCard({ label, value, icon: Icon, tone = 'blue', to, hint }) {
  const Wrapper = to ? Link : 'div'
  return (
    <Wrapper
      to={to}
      className={`group rounded-2xl bg-white dark:bg-[#1a1a2e] p-4 sm:p-5 border border-gray-200 dark:border-[#2a2a4a] shadow-sm transition-all ${to ? 'hover:border-primary-main/60 dark:hover:border-blue-500/60 hover:shadow-md cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{value ?? 0}</p>
          {hint && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 truncate">{hint}</p>}
        </div>
        {Icon && (
          <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONE_STYLES[tone] || TONE_STYLES.blue}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
      </div>
    </Wrapper>
  )
}

export default StatCard
