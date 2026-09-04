import { useCallback, useMemo, useState } from 'react'

// Generic client-side sort for a table's row array. Insert it between
// your existing filter step and your existing pagination slice:
//
//   const filtered = rows.filter(...)                                          // unchanged
//   const { sortedItems, sortConfig, requestSort } = useSortableData(filtered)
//   const visible = sortedItems.slice((page - 1) * pageSize, page * pageSize)   // was `filtered.slice(...)`
//
// `key` is always a plain string id for the column (used by requestSort /
// sortConfig / directionFor). For a simple field, sorting reads
// `row[key]` automatically. For a computed/nested value (e.g. a plan
// name under `row.plan.plan_name`), pass a `getValue(row, key)` resolver
// so the id can stay a plain string while the value comes from
// wherever it actually lives:
//
//   useSortableData(rows, null, (row, key) => key === 'plan_name' ? row.plan?.plan_name : row[key])
export default function useSortableData(items, initialSort = null, getValue = (row, key) => row?.[key]) {
  const [sortConfig, setSortConfig] = useState(initialSort)

  const sortedItems = useMemo(() => {
    if (!sortConfig || !sortConfig.key) return items
    const { key, direction } = sortConfig
    const factor = direction === 'asc' ? 1 : -1

    return [...items].sort((a, b) => {
      const av = getValue(a, key)
      const bv = getValue(b, key)
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor
      const an = Number(av)
      const bn = Number(bv)
      if (!Number.isNaN(an) && !Number.isNaN(bn) && av !== '' && bv !== '') return (an - bn) * factor
      return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' }) * factor
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, sortConfig])

  const requestSort = useCallback((key) => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) return { key, direction: 'asc' }
      if (prev.direction === 'asc') return { key, direction: 'desc' }
      return null
    })
  }, [])

  const directionFor = useCallback((key) => (sortConfig?.key === key ? sortConfig.direction : null), [sortConfig])

  return { sortedItems, sortConfig, requestSort, directionFor }
}
