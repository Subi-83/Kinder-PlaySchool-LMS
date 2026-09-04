import React, { useState, useEffect, useRef } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import api from '../services/api'

export default function BookSearchInput({ onSelectBook, selectedBook, availableOnly = true, label = 'Select Book' }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (selectedBook) {
      setQuery(`${selectedBook.title} - [Book ID: ${selectedBook.barcode}${selectedBook.isbn ? ' | ISBN: ' + selectedBook.isbn : ''}]`)
    }
  }, [selectedBook])

  const searchBooks = async (q) => {
    setLoading(true)
    try {
      const res = await api.get(`/books/copies/search?q=${encodeURIComponent(q)}&available_only=${availableOnly}`)
      setResults(res.data || [])
      setIsOpen(true)
    } catch (err) {
      console.error('Failed to search books:', err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const val = e.target.value
    setQuery(val)
    if (!val.trim()) {
      setResults([])
      setIsOpen(false)
      if (onSelectBook) onSelectBook(null)
      return
    }
    searchBooks(val)
  }

  const handleSelect = (copy) => {
    setQuery(`${copy.title} - [Book ID: ${copy.barcode}${copy.isbn ? ' | ISBN: ' + copy.isbn : ''}]`)
    setIsOpen(false)
    if (onSelectBook) onSelectBook(copy)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    if (onSelectBook) onSelectBook(null)
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.trim() && results.length > 0) setIsOpen(true)
            else if (!query.trim()) searchBooks('')
          }}
          placeholder="Search by Book ID (100001), ISBN Code, Title, Author..."
          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-primary-main" aria-hidden="true" />
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden="true" />
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#17172a] shadow-xl divide-y divide-gray-100 dark:divide-gray-800">
          {results.length === 0 ? (
            <div className="p-3 text-xs text-gray-500 dark:text-gray-400 text-center">No available books found</div>
          ) : (
            results.map((copy) => (
              <div
                key={copy.book_copy_id}
                onClick={() => handleSelect(copy)}
                className="p-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900 dark:text-white">{copy.title}</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                      Book ID: {copy.barcode}
                    </span>
                    {copy.isbn && (
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                        ISBN: {copy.isbn}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>Author: {copy.author || 'Unknown'}</span>
                    <span>Level: {copy.level_name || copy.level_code || 'N/A'}</span>
                    {copy.purchase_year && <span>Purchase Year: {copy.purchase_year}</span>}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      copy.status === 'AVAILABLE'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {copy.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
