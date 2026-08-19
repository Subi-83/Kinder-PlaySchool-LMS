import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import StudentSearchInput from '../components/StudentSearchInput'
import BookSearchInput from '../components/BookSearchInput'

function Library() {
  const { user, hasPermission } = useAuth()
  const [issues, setIssues] = useState([])
  const [history, setHistory] = useState([])
  const [students, setStudents] = useState([])
  const [message, setMessage] = useState('')

  // Selected entities for forms
  const [selectedIssueStudent, setSelectedIssueStudent] = useState(null)
  const [selectedIssueBook, setSelectedIssueBook] = useState(null)
  const [selectedFilterStudent, setSelectedFilterStudent] = useState(null)

  // Issue Form state
  const todayStr = new Date().toISOString().split('T')[0]
  const [issueForm, setIssueForm] = useState({
    issue_date: todayStr,
    admin_approved_low_deposit: false
  })

  // Return Form state
  const [selectedReturnStudent, setSelectedReturnStudent] = useState(null)
  const [studentActiveIssues, setStudentActiveIssues] = useState([])
  const [selectedReturnIssue, setSelectedReturnIssue] = useState(null)
  const [returnForm, setReturnForm] = useState({
    return_date: todayStr,
    holiday_days: 0,
    condition: 'GOOD',
    is_damaged: false,
    is_lost: false,
    notes: ''
  })

  // Barcode scanner inputs
  const [issueBarcode, setIssueBarcode] = useState('')
  const [returnBarcode, setReturnBarcode] = useState('')

  const canIssue = user?.role === 'ADMIN' || hasPermission('book.issue')
  const canReturn = user?.role === 'ADMIN' || hasPermission('book.return')
  const lowDepositThreshold = 300
  const selectedStudentHasLowDeposit = selectedIssueStudent && Number(selectedIssueStudent.deposit_balance || 0) <= lowDepositThreshold
  const canApproveLowDeposit = user?.role === 'ADMIN'

  const load = async () => {
    try {
      const [activeRes, historyRes, studentsRes] = await Promise.all([
        api.get('/library/issues/active'),
        api.get('/library/issues'),
        api.get('/students/')
      ])
      setIssues(activeRes.data || [])
      setHistory(historyRes.data || [])
      setStudents(studentsRes.data || [])
    } catch (e) {
      setMessage(e.data?.error || e.message || 'Could not load library data.')
    }
  }

  useEffect(() => {
    load()
  }, [])

  // When return student is selected, update active issues for that student
  useEffect(() => {
    if (selectedReturnStudent) {
      const studentIssues = issues.filter(
        (i) => String(i.student_id) === String(selectedReturnStudent.student_id)
      )
      setStudentActiveIssues(studentIssues)
      if (studentIssues.length > 0) {
        setSelectedReturnIssue(studentIssues[0])
      } else {
        setSelectedReturnIssue(null)
      }
    } else {
      setStudentActiveIssues([])
      setSelectedReturnIssue(null)
    }
  }, [selectedReturnStudent, issues])

  // Filter history
  const filteredHistory = useMemo(() => {
    if (!selectedFilterStudent) return history
    return history.filter((i) => String(i.student_id) === String(selectedFilterStudent.student_id))
  }, [history, selectedFilterStudent])

  const filteredActive = useMemo(() => {
    if (!selectedFilterStudent) return issues
    return issues.filter((i) => String(i.student_id) === String(selectedFilterStudent.student_id))
  }, [issues, selectedFilterStudent])

  // Handle Book ID / ISBN search or scan for issue
  const handleIssueBarcodeScan = async (code) => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    try {
      const res = await api.get(`/books/copies/search?q=${encodeURIComponent(trimmed)}&available_only=true`)
      const found = (res.data || []).find((c) => 
        (c.barcode || '').toUpperCase() === trimmed || 
        (c.isbn || '').toUpperCase() === trimmed
      ) || res.data?.[0]
      if (found) {
        setSelectedIssueBook(found)
        setMessage(`✅ Matched Book: "${found.title}" (Book ID: ${found.barcode}${found.isbn ? ' | ISBN: ' + found.isbn : ''})`)
        setTimeout(() => setMessage(''), 4000)
      } else {
        setMessage(`❌ No available book found for Book ID or ISBN "${trimmed}".`)
      }
    } catch (err) {
      setMessage('❌ Failed to search book by Book ID / ISBN.')
    }
  }

  // Handle Book ID / ISBN scan for return
  const handleReturnBarcodeScan = (code) => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    const matchedIssue = issues.find((i) => 
      (i.book_barcode || '').toUpperCase() === trimmed ||
      (i.book_isbn || '').toUpperCase() === trimmed
    )
    if (matchedIssue) {
      const stu = students.find((s) => String(s.student_id) === String(matchedIssue.student_id))
      if (stu) setSelectedReturnStudent(stu)
      setSelectedReturnIssue(matchedIssue)
      setMessage(`✅ Matched active issue: "${matchedIssue.book_title}" for ${matchedIssue.student_name} (Book ID: ${matchedIssue.book_barcode}${matchedIssue.book_isbn ? ' | ISBN: ' + matchedIssue.book_isbn : ''})`)
      setTimeout(() => setMessage(''), 4000)
    } else {
      setMessage(`❌ No active issued book found for Book ID or ISBN "${trimmed}".`)
    }
  }

  // Submit Issue
  const submitIssue = async (e) => {
    e.preventDefault()
    if (!selectedIssueStudent) {
      setMessage('❌ Please select a student.')
      return
    }
    if (!selectedIssueStudent.library_access) {
      setMessage(`❌ Student ${selectedIssueStudent.student_name} does not have library borrowing privileges enabled. Please enable Library Access in Student Management.`)
      return
    }
    if (!selectedIssueStudent.active_subscription) {
      setMessage(`❌ Student ${selectedIssueStudent.student_name} does not have an active library subscription plan. Please assign a subscription plan.`)
      return
    }
    if (!selectedIssueBook) {
      setMessage('❌ Please select an available book copy.')
      return
    }
    if (selectedStudentHasLowDeposit && !issueForm.admin_approved_low_deposit) {
      setMessage(`❌ ${selectedIssueStudent.student_name}'s deposit is ₹${Number(selectedIssueStudent.deposit_balance || 0).toFixed(2)}. Top up above ₹300 or request administrator approval.`)
      return
    }

    try {
      await api.post('/library/issues', {
        student_id: selectedIssueStudent.student_id,
        book_copy_id: selectedIssueBook.book_copy_id,
        issue_date: issueForm.issue_date,
        admin_approved_low_deposit: issueForm.admin_approved_low_deposit
      })
      setMessage(`✅ Book "${selectedIssueBook.title}" issued to ${selectedIssueStudent.student_name} successfully!`)
      setSelectedIssueBook(null)
      setIssueBarcode('')
      load()
      setTimeout(() => setMessage(''), 4000)
    } catch (err) {
      setMessage('❌ ' + (err.data?.error || err.message || 'Could not issue book.'))
    }
  }

  // Calculate return details dynamically
  const returnCalculation = useMemo(() => {
    if (!selectedReturnIssue) return null
    const issueDate = new Date(selectedReturnIssue.issue_date)
    const dueDate = new Date(selectedReturnIssue.due_date)
    const returnDate = new Date(returnForm.return_date)

    const rawOverdueDays = Math.max(0, Math.floor((returnDate - dueDate) / (1000 * 60 * 60 * 24)))
    const holidayDays = Math.max(0, parseInt(returnForm.holiday_days || 0, 10))
    const effectiveOverdueDays = Math.max(0, rawOverdueDays - holidayDays)
    const lateFine = effectiveOverdueDays * 5.0 // ₹5/day default

    let damageCharge = 0.0
    const cond = returnForm.condition
    if (returnForm.is_lost || cond === 'LOST') {
      damageCharge = 300.0
    } else if (cond === 'SMALL_DAMAGED' || cond === 'SMALL') {
      damageCharge = 100.0
    } else if (cond === 'LARGE_DAMAGED' || cond === 'LARGE') {
      damageCharge = 200.0
    } else if (returnForm.is_damaged || cond === 'DAMAGED' || cond === 'POOR') {
      damageCharge = 100.0
    }

    const totalCharge = lateFine + damageCharge
    const studentDeposit = selectedReturnStudent ? Number(selectedReturnStudent.deposit_balance || 0) : 0
    const amountDeducted = Math.min(studentDeposit, totalCharge)
    const outstandingPayable = Math.max(0, totalCharge - studentDeposit)

    return {
      issueDate: selectedReturnIssue.issue_date,
      dueDate: selectedReturnIssue.due_date,
      rawOverdueDays,
      holidayDays,
      effectiveOverdueDays,
      lateFine,
      damageCharge,
      totalCharge,
      studentDeposit,
      amountDeducted,
      outstandingPayable
    }
  }, [selectedReturnIssue, returnForm, selectedReturnStudent])

  // Submit Return
  const submitReturn = async (e) => {
    e.preventDefault()
    if (!selectedReturnIssue) {
      setMessage('❌ Please select an active issue record to return.')
      return
    }

    try {
      const res = await api.post('/library/returns', {
        issue_id: selectedReturnIssue.issue_id,
        return_date: returnForm.return_date,
        holiday_days: returnForm.holiday_days,
        condition: returnForm.condition,
        is_damaged: returnForm.is_damaged,
        is_lost: returnForm.is_lost,
        notes: returnForm.notes
      })
      const data = res.data || {}
      let msg = `✅ Book returned successfully.`
      if (data.amount_deducted > 0) msg += ` Deducted ₹${data.amount_deducted.toFixed(2)} from deposit.`
      if (data.outstanding_payable > 0) msg += ` Outstanding payable: ₹${data.outstanding_payable.toFixed(2)}.`
      setMessage(msg)
      setSelectedReturnIssue(null)
      setSelectedReturnStudent(null)
      setReturnBarcode('')
      load()
      setTimeout(() => setMessage(''), 5000)
    } catch (err) {
      setMessage('❌ ' + (err.data?.error || err.message || 'Could not return book.'))
    }
  }

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>📚 Library Management Engine</span>
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Level-based book issuing, custom return dates, automated fine & damage calculations with deposit deduction.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold shadow-sm transition-all ${
            message.includes('✅')
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}
        >
          {message}
        </div>
      )}

      {/* Forms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ISSUE BOOK FORM */}
        <form onSubmit={submitIssue} className="p-6 rounded-2xl border border-gray-200 dark:border-[#292944] bg-white dark:bg-[#17172a] space-y-4 shadow-sm">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              Issue Book to Student
            </h3>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
              📷 Scanner Ready
            </span>
          </div>

          {/* Book Search & Scan Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
              Book ID / ISBN Quick Search & Scan
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                disabled={!canIssue}
                placeholder="Enter or scan Book ID (100001) or ISBN..."
                value={issueBarcode}
                onChange={(e) => {
                  setIssueBarcode(e.target.value)
                  handleIssueBarcodeScan(e.target.value)
                }}
                className="flex-1 rounded-xl bg-blue-50/50 dark:bg-[#10101d] border border-blue-200 dark:border-blue-900/50 px-3.5 py-2 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => handleIssueBarcodeScan(issueBarcode)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
              >
                Scan / Find
              </button>
            </div>
          </div>

          {/* Student Search Autocomplete */}
          <StudentSearchInput
            label="Search Student"
            libraryOnly={true}
            selectedStudent={selectedIssueStudent}
            onSelectStudent={(stu) => setSelectedIssueStudent(stu)}
          />

          {/* Student Borrowing Eligibility Summary Badge */}
          {selectedIssueStudent && (
            <div className="rounded-xl bg-gray-50 dark:bg-[#10101d] p-3.5 text-xs border border-gray-200 dark:border-gray-800 space-y-2">
              <div className="flex justify-between items-center font-bold">
                <span className="text-gray-900 dark:text-white text-sm">{selectedIssueStudent.student_name}</span>
                {selectedIssueStudent.library_access && selectedIssueStudent.active_subscription ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    ✓ Eligible to Borrow
                  </span>
                ) : !selectedIssueStudent.library_access ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                    🚫 Access Disabled
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                    ⚠️ No Active Plan
                  </span>
                )}
              </div>

              {!selectedIssueStudent.library_access && (
                <div className="text-rose-600 dark:text-rose-400 font-semibold text-[11px] bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900">
                  ❌ Student borrowing access is turned OFF. Book issuing is blocked until Library Access is enabled in Student Management.
                </div>
              )}

              {selectedIssueStudent.library_access && !selectedIssueStudent.active_subscription && (
                <div className="text-amber-600 dark:text-amber-400 font-semibold text-[11px] bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900">
                  ⚠️ Student has no active library subscription plan. Please assign a plan to allow book issuing.
                </div>
              )}

              <div className="text-gray-500 dark:text-gray-400 flex flex-wrap gap-3 pt-0.5">
                <span>Plan: <strong>{selectedIssueStudent.active_subscription?.plan?.plan_name || 'None'}</strong></span>
                <span>
                  Books Issued: <strong>{selectedIssueStudent.current_books_issued} / {selectedIssueStudent.max_books_allowed || 0}</strong>
                </span>
                <span>Deposit: <strong>₹{Number(selectedIssueStudent.deposit_balance || 0).toFixed(2)}</strong></span>
              </div>
              {selectedStudentHasLowDeposit && (
                <div className="text-amber-700 dark:text-amber-300 font-semibold text-[11px] bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900">
                  ⚠️ Deposit is ₹{Number(selectedIssueStudent.deposit_balance || 0).toFixed(2)} (≤₹300). Borrowing is blocked until the deposit is topped up or an administrator approves this issue.
                </div>
              )}
            </div>
          )}

          {/* Book Copy Search Autocomplete */}
          <BookSearchInput
            label="Search Available Book Copy (by Book ID or ISBN)"
            availableOnly={true}
            selectedBook={selectedIssueBook}
            onSelectBook={(copy) => setSelectedIssueBook(copy)}
          />

          {/* Issue Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Issue Date
            </label>
            <input
              type="date"
              value={issueForm.issue_date}
              onChange={(e) => setIssueForm({ ...issueForm, issue_date: e.target.value })}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#10101d] px-3.5 py-2.5 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {selectedStudentHasLowDeposit && canApproveLowDeposit && (
            <label className="flex items-start gap-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-900 dark:text-amber-200">
              <input
                type="checkbox"
                checked={issueForm.admin_approved_low_deposit}
                onChange={(e) => setIssueForm({ ...issueForm, admin_approved_low_deposit: e.target.checked })}
                className="mt-0.5 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
              />
              <span><strong>Administrator approval</strong><br />Approve this one book issue despite the low deposit. This approval is recorded in Audit Logs.</span>
            </label>
          )}

          <button
            disabled={!canIssue || !selectedIssueStudent || !selectedIssueStudent.library_access || !selectedIssueStudent.active_subscription || !selectedIssueBook || (selectedStudentHasLowDeposit && !issueForm.admin_approved_low_deposit)}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm & Issue Book
          </button>
        </form>

        {/* RETURN BOOK FORM */}
        <form onSubmit={submitReturn} className="p-6 rounded-2xl border border-gray-200 dark:border-[#292944] bg-white dark:bg-[#17172a] space-y-4 shadow-sm">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Return & Deduction Engine
            </h3>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
              📷 Scanner Ready
            </span>
          </div>

          {/* Return Book ID / ISBN Scan */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
              Book ID / ISBN Quick Return Scan
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                disabled={!canReturn}
                placeholder="Scan or enter Book ID (100001) or ISBN..."
                value={returnBarcode}
                onChange={(e) => {
                  setReturnBarcode(e.target.value)
                  handleReturnBarcodeScan(e.target.value)
                }}
                className="flex-1 rounded-xl bg-emerald-50/50 dark:bg-[#10101d] border border-emerald-200 dark:border-emerald-900/50 px-3.5 py-2 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleReturnBarcodeScan(returnBarcode)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
              >
                Scan / Find
              </button>
            </div>
          </div>

          {/* Select Student for Return */}
          <StudentSearchInput
            label="1. Select Student Returning Book"
            libraryOnly={true}
            selectedStudent={selectedReturnStudent}
            onSelectStudent={(stu) => setSelectedReturnStudent(stu)}
          />

          {/* Active Issued Books Selection */}
          {selectedReturnStudent && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                2. Select Book Currently Held
              </label>
              {studentActiveIssues.length === 0 ? (
                <div className="p-3 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200">
                  This student has no active issued books.
                </div>
              ) : (
                <select
                  value={selectedReturnIssue?.issue_id || ''}
                  onChange={(e) => {
                    const iss = studentActiveIssues.find((x) => String(x.issue_id) === String(e.target.value))
                    setSelectedReturnIssue(iss || null)
                  }}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#10101d] p-2.5 text-sm font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {studentActiveIssues.map((i) => (
                    <option key={i.issue_id} value={i.issue_id}>
                      [Book ID: {i.book_barcode}{i.book_isbn ? ' | ISBN: ' + i.book_isbn : ''}] {i.book_title} (Issued: {i.issue_date} | Due: {i.due_date})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Return Date & Non-chargeable Holiday Days Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Actual Return Date
              </label>
              <input
                type="date"
                value={returnForm.return_date}
                onChange={(e) => setReturnForm({ ...returnForm, return_date: e.target.value })}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#10101d] px-3.5 py-2 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Holidays (Non-chargeable Days)
              </label>
              <input
                type="number"
                min="0"
                value={returnForm.holiday_days}
                onChange={(e) => setReturnForm({ ...returnForm, holiday_days: e.target.value })}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#10101d] px-3.5 py-2 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Book Condition & Damage Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Returned Book Condition
              </label>
              <select
                value={returnForm.condition}
                onChange={(e) => setReturnForm({ ...returnForm, condition: e.target.value })}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#10101d] p-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="GOOD">Good Condition (No Charge)</option>
                <option value="SMALL_DAMAGED">Small Damage (₹100)</option>
                <option value="LARGE_DAMAGED">Large Damage (₹200)</option>
                <option value="LOST">Lost Book (₹300)</option>
              </select>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={returnForm.is_damaged}
                  onChange={(e) => setReturnForm({ ...returnForm, is_damaged: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                Damaged
              </label>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={returnForm.is_lost}
                  onChange={(e) => setReturnForm({ ...returnForm, is_lost: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                Lost Book
              </label>
            </div>
          </div>

          {/* Calculated Fine & Financial Breakdown Summary */}
          {returnCalculation && (
            <div className="rounded-xl bg-slate-50 dark:bg-[#10101d] p-3.5 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="font-bold text-gray-900 dark:text-white flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                <span>Calculated Charges Breakdown</span>
                <span>Total: ₹{returnCalculation.totalCharge.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-gray-600 dark:text-gray-300">
                <div>Due Date: <strong>{returnCalculation.dueDate}</strong></div>
                <div>Raw Late Days: <strong>{returnCalculation.rawOverdueDays} days</strong></div>
                <div>Holidays Excluded: <strong>{returnCalculation.holidayDays} days</strong></div>
                <div>Charged Late Days: <strong>{returnCalculation.effectiveOverdueDays} days</strong></div>
                <div>Late Return Fine: <strong>₹{returnCalculation.lateFine.toFixed(2)}</strong></div>
                <div>Damage / Lost Charge: <strong>₹{returnCalculation.damageCharge.toFixed(2)}</strong></div>
              </div>
              <div className="pt-1 border-t border-slate-200 dark:border-slate-800 flex justify-between font-semibold">
                <span>Deducted from Deposit: <strong className="text-emerald-600">₹{returnCalculation.amountDeducted.toFixed(2)}</strong></span>
                {returnCalculation.outstandingPayable > 0 && (
                  <span className="text-rose-500 font-bold">
                    Unpaid Outstanding: ₹{returnCalculation.outstandingPayable.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          )}

          <button
            disabled={!canReturn || !selectedReturnIssue}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Process Return & Fine Deduction
          </button>
        </form>
      </div>

      {/* Student Filter & Master Table */}
      <div className="p-5 rounded-2xl border border-gray-200 dark:border-[#292944] bg-white dark:bg-[#17172a] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Book Issues & Return Records</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">View complete transaction history per student.</p>
          </div>

          <div className="w-full md:w-80">
            <StudentSearchInput
              label="Filter Table by Student"
              libraryOnly={false}
              selectedStudent={selectedFilterStudent}
              onSelectStudent={(stu) => setSelectedFilterStudent(stu)}
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#292944] bg-white dark:bg-[#10101d]">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 dark:bg-[#22223a] text-gray-700 dark:text-gray-300 font-bold text-xs uppercase">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Book ID & Title</th>
                <th className="px-4 py-3">Issued / Due</th>
                <th className="px-4 py-3">Returned On</th>
                <th className="px-4 py-3">Status / Deductions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#292944]">
              {filteredHistory.map((i) => (
                <tr key={i.issue_id} className="hover:bg-blue-50/20 dark:hover:bg-[#19192e] transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-gray-900 dark:text-white">{i.student_name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{i.student_uid}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-white">{i.book_title}</div>
                    <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">ID: {i.book_barcode}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">
                    <div>Issued: {i.issue_date}</div>
                    <div className="text-gray-500">Due: {i.due_date}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">
                    {i.return_details?.return_date || <span className="text-amber-500 font-semibold">Currently Held</span>}
                    {i.return_details?.condition_returned && (
                      <div className="text-gray-500">Condition: {i.return_details.condition_returned}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full font-bold ${
                        i.status === 'ACTIVE'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : i.status === 'OVERDUE'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {i.status}
                    </span>
                    {i.return_details && (
                      <div className="mt-1 text-gray-500 dark:text-gray-400">
                        Fine: ₹{i.return_details.fine_amount} | Damage: ₹{i.return_details.damage_charge}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No issue or return records found for this selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Library
