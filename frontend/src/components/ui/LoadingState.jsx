import React from 'react'
import { Loader2 } from 'lucide-react'

// Full-section loading placeholder (spinner + label) for pages/panels
// that load data on mount. For tables prefer <TableSkeleton>.
export function LoadingState({ label = 'Loading…', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 text-gray-400 dark:text-gray-500 ${className}`}>
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

// Skeleton rows for a table that is mid-fetch, so the layout doesn't
// jump once data arrives.
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-gray-100 dark:border-[#2a2a4a] last:border-0">
          {Array.from({ length: columns }).map((__, colIndex) => (
            <td key={colIndex} className="px-4 py-3.5">
              <div className="h-3.5 rounded bg-gray-100 dark:bg-white/5 animate-pulse" style={{ width: `${55 + ((colIndex * 13) % 35)}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}

export default LoadingState
