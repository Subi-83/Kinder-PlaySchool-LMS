import { useCallback, useEffect, useState } from 'react'

// Per-table column show/hide state, persisted per browser so a user's
// column choices survive a page reload. `columns` is [{ key, label,
// locked? }]; `locked` columns (e.g. an ID or an actions column) are
// always visible and can't be toggled off.
export default function useColumnVisibility(storageKey, columns, defaultHiddenKeys = []) {
  const validKeys = columns.map((c) => c.key)
  const storageId = `lms.columns.${storageKey}`

  const [hidden, setHidden] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageId) || 'null')
      if (Array.isArray(saved)) return new Set(saved.filter((key) => validKeys.includes(key)))
    } catch {
      // Ignore unavailable/blocked storage and fall back to the default.
    }
    return new Set(defaultHiddenKeys)
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(storageId, JSON.stringify(Array.from(hidden)))
    } catch {
      // Storage may be unavailable (private mode, quota) — safe to skip.
    }
  }, [storageId, hidden])

  const isVisible = useCallback((key) => !hidden.has(key), [hidden])

  const toggle = useCallback((key) => {
    const column = columns.find((c) => c.key === key)
    if (column?.locked) return
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [columns])

  const reset = useCallback(() => setHidden(new Set(defaultHiddenKeys)), [defaultHiddenKeys])

  return { isVisible, toggle, reset, hiddenCount: hidden.size }
}
