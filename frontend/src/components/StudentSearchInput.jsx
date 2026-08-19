import React, { useState, useEffect, useRef } from 'react'
import api from '../services/api'

export default function StudentSearchInput({ onSelectStudent, selectedStudent, libraryOnly = true, label = 'Select Student' }) {
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
    if (selectedStudent) {
      setQuery(`${selectedStudent.student_name} (${selectedStudent.student_uid || selectedStudent.student_id})`)
    }
  }, [selectedStudent])

  const searchStudents = async (q) => {
    setLoading(true)
    try {
      const res = await api.get(`/students/search?q=${encodeURIComponent(q)}&library_only=${libraryOnly}`)
      setResults(res.data || [])
      setIsOpen(true)
    } catch (err) {
      console.error('Failed to search students:', err)
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
      if (onSelectStudent) onSelectStudent(null)
      return
    }
    searchStudents(val)
  }

  const handleSelect = (student) => {
    setQuery(`${student.student_name} (${student.student_uid || student.student_id})`)
    setIsOpen(false)
    if (onSelectStudent) onSelectStudent(student)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    if (onSelectStudent) onSelectStudent(null)
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
            else if (!query.trim()) searchStudents('')
          }}
          placeholder="Search by Student Name, STU ID, Roll No, Phone..."
          className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] px-4 py-2.5 pr-10 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
        {loading ? (
          <div className="absolute right-3 top-3 h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        ) : (
          <svg
            className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#17172a] shadow-xl divide-y divide-gray-100 dark:divide-gray-800">
          {results.length === 0 ? (
            <div className="p-3 text-xs text-gray-500 dark:text-gray-400 text-center">No students found</div>
          ) : (
            results.map((stu) => {
              const activeSub = stu.active_subscription
              const isEligible = stu.library_access && activeSub
              return (
                <div
                  key={stu.student_id}
                  onClick={() => handleSelect(stu)}
                  className="p-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-900 dark:text-white">{stu.student_name}</span>
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        {stu.student_uid}
                      </span>
                      {stu.current_enrollment?.roll_number && (
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          [{stu.current_enrollment.roll_number}]
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>School: {stu.school_name || 'N/A'}</span>
                      <span>Grade: {stu.current_enrollment?.grade || 'N/A'}</span>
                      <span>Deposit: ₹{Number(stu.deposit_balance || 0).toFixed(2)}</span>
                      {stu.outstanding_balance > 0 && (
                        <span className="text-red-500 font-bold">Unpaid: ₹{Number(stu.outstanding_balance).toFixed(2)}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    {isEligible ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Active Sub ({stu.current_books_issued}/{stu.max_books_allowed})
                      </span>
                    ) : !stu.library_access ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                        No Access
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        No Active Sub
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
