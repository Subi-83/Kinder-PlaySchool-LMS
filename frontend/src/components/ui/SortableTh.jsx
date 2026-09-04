import React from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

// A <th> whose label is a click target for sorting. Pass the same
// `className` you already had on the plain <th> (padding, width,
// alignment, the isVisible()/'hidden' column-filter class if this table
// has one) — SortableTh renders the <th> itself, so replace the whole
// element rather than nesting this inside another <th>.
//
//   <SortableTh className="px-4 py-3 ... uppercase tracking-wider" sortKey="student_name" direction={directionFor('student_name')} onSort={requestSort}>
//     Name
//   </SortableTh>
//
// A column with no meaningful order (e.g. "Actions") should stay a
// plain <th>, not a SortableTh.
function SortableTh({ children, sortKey, direction, onSort, align = 'left', className = '' }) {
  const Icon = direction === 'asc' ? ChevronUp : direction === 'desc' ? ChevronDown : ChevronsUpDown

  return (
    <th className={className} aria-sort={direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none'}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`group inline-flex items-center gap-1 font-medium uppercase tracking-wider text-inherit hover:text-gray-700 dark:hover:text-gray-200 transition-colors ${
          align === 'right' ? 'flex-row-reverse' : ''
        }`}
      >
        <span>{children}</span>
        <Icon
          className={`h-3.5 w-3.5 shrink-0 transition-colors ${
            direction ? 'text-primary-main dark:text-blue-400' : 'text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500'
          }`}
          aria-hidden="true"
        />
      </button>
    </th>
  )
}

export default SortableTh
