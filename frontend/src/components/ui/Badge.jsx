import React from 'react'

// Consistent status-pill styling used across tables, cards and detail views.
// tone maps to the semantic palette: neutral | primary | success | warning | danger | info
const TONE_STYLES = {
  neutral: 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300',
  primary: 'bg-primary-light text-primary-dark dark:bg-blue-900/30 dark:text-blue-300',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  danger: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
  info: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
}

function Badge({ tone = 'neutral', icon: Icon, className = '', children }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${TONE_STYLES[tone] || TONE_STYLES.neutral} ${className}`}>
      {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
      {children}
    </span>
  )
}

export default Badge
