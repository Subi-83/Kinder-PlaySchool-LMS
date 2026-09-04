import React, { useEffect, useRef, useState } from 'react'
import { SlidersHorizontal, RotateCcw } from 'lucide-react'
import Checkbox from './Checkbox'

// A small "Columns" control for dense tables: click to open a checklist
// of every column, toggle any non-locked one off to declutter the row,
// "Reset" restores the table's default column set. Pair with
// `useColumnVisibility` for the show/hide state itself.
function ColumnVisibilityMenu({ columns, isVisible, onToggle, onReset, hiddenCount = 0, label = 'Columns' }) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="true"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-[#3a3a5a] bg-white dark:bg-[#1a1a2e] px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#22223c] transition-colors"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        {label}
        {hiddenCount > 0 && (
          <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-main px-1 text-[10px] font-bold text-white">
            {hiddenCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Choose visible columns"
          className="absolute right-0 z-30 mt-2 w-60 rounded-xl border border-gray-200 dark:border-[#2a2a4a] bg-white dark:bg-[#1a1a2e] shadow-lg p-2"
        >
          <div className="flex items-center justify-between px-2 pb-1.5 mb-1 border-b border-gray-100 dark:border-[#2a2a4a]">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Show columns</span>
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary-main dark:text-blue-400 hover:underline"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                Reset
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto space-y-0.5">
            {columns.map((column) => (
              <label
                key={column.key}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${
                  column.locked ? 'opacity-60' : 'hover:bg-gray-50 dark:hover:bg-[#22223c] cursor-pointer'
                }`}
              >
                <Checkbox
                  size="sm"
                  checked={isVisible(column.key)}
                  disabled={column.locked}
                  onChange={() => onToggle(column.key)}
                />
                <span className="text-gray-700 dark:text-gray-200 truncate">{column.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ColumnVisibilityMenu
