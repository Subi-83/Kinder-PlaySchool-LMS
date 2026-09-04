import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

// Standard page-level heading used at the top of every route: an optional
// breadcrumb trail, a title + short description, and a slot for the
// page's primary action(s) on the right. Keeps every page's "top of
// page" area visually identical instead of each page hand-rolling one.
function PageHeader({ title, description, breadcrumbs = [], actions, className = '' }) {
  return (
    <div className={`mb-6 ${className}`}>
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1 text-sm text-gray-400 dark:text-gray-500">
          {breadcrumbs.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
              {crumb.to ? (
                <Link to={crumb.to} className="hover:text-primary-main dark:hover:text-blue-400 transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-gray-600 dark:text-gray-300 font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{title}</h1>
          {description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-2xl">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

export default PageHeader
