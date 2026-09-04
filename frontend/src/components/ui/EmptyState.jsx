import React from 'react'
import { Inbox } from 'lucide-react'

// Consistent "nothing here" treatment for tables, lists and search
// results, instead of every page rendering its own ad-hoc message.
function EmptyState({ icon: Icon = Inbox, title = 'No records found', description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-6 py-14 ${className}`}>
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 mb-4">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export default EmptyState
