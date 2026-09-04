import React from 'react'

function Card({ className = '', padding = 'p-5', children, ...rest }) {
  return (
    <div
      className={`rounded-2xl bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-[#2a2a4a] shadow-sm ${padding} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, description, action, className = '' }) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-3 ${className}`}>
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export default Card
