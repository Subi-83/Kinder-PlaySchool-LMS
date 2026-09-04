import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import StudentSearchInput from '../components/StudentSearchInput'
import Pagination from '../components/common/Pagination'
import { useAppSettings } from '../context/AppSettingsContext'
import { PageHeader, Button, Badge, StatCard, EmptyState, LoadingState, ColumnVisibilityMenu, useColumnVisibility, SortableTh, useSortableData } from '../components/ui'
import {
  CheckCircle2, XCircle, AlertTriangle, ChevronDown, Users, PiggyBank, ReceiptText,
  ShieldAlert, Undo2, Wallet, ClipboardList, BadgeIndianRupee, Pencil, Lock
} from 'lucide-react'

const DEPOSIT_ACCOUNT_COLUMNS = [
  { key: 'member_id', label: 'Member ID' },
  { key: 'member_name', label: 'Member Name', locked: true },
  { key: 'library_access', label: 'Library Access' },
  { key: 'subscription_status', label: 'Subscription Status' },
  { key: 'deposit_amount', label: 'Deposit Amount' },
  { key: 'deposit_status', label: 'Deposit Balance / Status' },
  { key: 'actions', label: 'Actions', locked: true },
]

function Deposits() {
  const { user, hasPermission } = useAuth()
  const { memberLabel, membersLabel } = useAppSettings()
  const { isVisible, toggle, reset, hiddenCount } = useColumnVisibility('deposits-accounts', DEPOSIT_ACCOUNT_COLUMNS)
  const [deposits, setDeposits] = useState([])
  const [refundDue, setRefundDue] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [academicYearId, setAcademicYearId] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showLowDeposits, setShowLowDeposits] = useState(false)
  const [showRefundDue, setShowRefundDue] = useState(false)
  const [correction, setCorrection] = useState(null)
  const [correctionTransactions, setCorrectionTransactions] = useState([])
  const [correctionForm, setCorrectionForm] = useState({ transaction_id: '', corrected_amount: '', reason: '' })
  const [submittingCorrection, setSubmittingCorrection] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [depositTab, setDepositTab] = useState('payment')
  const pageSize = 10
  const [topUpData, setTopUpData] = useState({
    amount: '',
    description: 'Deposit payment'
  })

  const canTopUp = hasPermission('deposit.topup') || user?.role === 'ADMIN'
  const canRefund = hasPermission('deposit.refund') || user?.role === 'ADMIN'

  const loadData = async () => {
    try {
      setLoading(true)
      const [depositsRes, refundRes, yearsRes] = await Promise.all([
        api.get('/deposits', { params: academicYearId ? { academic_year_id: academicYearId } : {} }),
        api.get('/deposits/refund-due', { params: academicYearId ? { academic_year_id: academicYearId } : {} }),
        api.get('/students/academic-years')
      ])
      setAcademicYears(yearsRes.data || [])
      if (!academicYearId) {
        const current = (yearsRes.data || []).find((year) => year.is_current)
        if (current) setAcademicYearId(String(current.academic_year_id))
      }
      const eligibleDepositStudents = depositsRes.data || []
      setDeposits(eligibleDepositStudents)
      setRefundDue(refundRes.data || [])
      // Clear stale selections (for example, after Library Access is disabled).
      setSelectedStudent((current) => (
        current && !eligibleDepositStudents.some((account) => account.student_id === current.student_id)
          ? null
          : current
      ))
    } catch (err) {
      console.error('Error loading deposits:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [academicYearId])

  useEffect(() => {
    setCurrentPage(1)
    setSelectedStudent(null)
    setShowLowDeposits(false)
    setShowRefundDue(false)
  }, [academicYearId])

  const handleTopUp = async (e) => {
    e.preventDefault()
    if (!selectedStudent || !topUpData.amount || parseFloat(topUpData.amount) <= 0) {
      setMessage({ type: 'error', text: 'Please select a student and enter a valid deposit amount.' })
      return
    }
    try {
      await api.post('/deposits/topup', {
        student_id: selectedStudent.student_id,
        amount: parseFloat(topUpData.amount),
        description: topUpData.description
        ,academic_year_id: academicYearId
      })
      setMessage({ type: 'success', text: `Deposit recorded successfully! Updated deposit account for ${selectedStudent.student_name}.` })
      setTopUpData({ amount: '', description: 'Deposit payment' })
      setSelectedStudent(null)
      await loadData()
      setTimeout(() => setMessage(null), 4000)
    } catch (err) {
      setMessage({ type: 'error', text: err.data?.error || err.response?.data?.error || err.message || 'Error recording deposit' })
    }
  }

  const openCorrection = async (account) => {
    setCorrection(account)
    setCorrectionForm({ transaction_id: '', corrected_amount: '', reason: '' })
    try {
      const response = await api.get(`/deposits/transactions/${account.student_id}`)
      setCorrectionTransactions((response.data || []).filter((item) => ['TOP_UP', 'INITIAL_DEPOSIT'].includes(item.transaction_type)))
    } catch (err) {
      setMessage({ type: 'error', text: 'Could not load deposit payment history.' })
      setCorrection(null)
    }
  }

  const submitCorrection = async (event) => {
    event.preventDefault()
    try {
      setSubmittingCorrection(true)
      const response = await api.post('/deposits/correction-request', correctionForm)
      setMessage({ type: 'success', text: response.data?.message || 'Correction request submitted.' })
      setCorrection(null)
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Could not submit correction request.' })
    } finally {
      setSubmittingCorrection(false)
    }
  }

  const refundDeposit = async (account) => {
    if (!window.confirm(`Return the complete deposit of ₹${Number(account.current_balance || 0).toFixed(2)} to ${account.student_name}?`)) return
    try {
      await api.post(`/deposits/refund/${account.student_id}`, { academic_year_id: academicYearId })
      await loadData()
    } catch (_) {
      // The common Alert.jsx displays the API error.
    }
  }

  const lowDepositAccounts = deposits.filter((d) => d.is_low_balance)
  const configuredWarningThreshold = Number(deposits[0]?.warning_threshold || 0)
  const { sortedItems: sortedDeposits, requestSort, directionFor } = useSortableData(deposits, null, (row, key) => {
    if (key === 'member_id') return row.student_uid
    if (key === 'member_name') return row.student_name
    if (key === 'deposit_amount') return Number(row.current_balance || 0)
    if (key === 'deposit_status') return row.is_low_balance ? 1 : 0
    return row[key]
  })
  const totalPages = Math.max(1, Math.ceil(sortedDeposits.length / pageSize))
  const paginatedDeposits = sortedDeposits.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const totalLiquidBalance = deposits.reduce((sum, d) => sum + Number(d.current_balance || 0), 0)
  const totalOutstandingFines = deposits.reduce((sum, d) => sum + Number(d.outstanding_balance || 0), 0)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const depositTabs = [
    { key: 'payment', label: 'Payment & Overview', icon: Wallet },
    { key: 'accounts', label: `${memberLabel} Deposit Accounts`, icon: ClipboardList },
  ]

  const subscriptionStatusTone = { ACTIVE: 'primary', PENDING: 'warning', EXPIRED: 'danger' }
  const subscriptionStatusLabel = { ACTIVE: 'Active', PENDING: 'Plan Payment Pending', EXPIRED: 'Expired' }

  if (loading) {
    return <LoadingState label="Loading library deposits…" />
  }

  return (
    <div className="space-y-6">
      {correction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <form onSubmit={submitCorrection} className="w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-[#17172a]">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Correct Mistaken Deposit</h3>
              <p className="text-sm text-gray-500">{correction.student_name} ({correction.student_uid}) · Current balance ₹{Number(correction.current_balance).toFixed(2)}</p>
            </div>
            <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300">Deposit payment
              <select required value={correctionForm.transaction_id} onChange={(e) => { const item = correctionTransactions.find((t) => String(t.transaction_id) === e.target.value); setCorrectionForm({ ...correctionForm, transaction_id: e.target.value, corrected_amount: item ? String(item.amount) : '' }) }} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-[#10101d]">
                <option value="">Select mistaken payment</option>
                {correctionTransactions.map((item) => <option key={item.transaction_id} value={item.transaction_id}>#{item.transaction_id} · ₹{Number(item.amount).toFixed(2)} · {item.created_at}</option>)}
              </select>
            </label>
            <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300">Correct amount
              <input required min="0" step="0.01" type="number" value={correctionForm.corrected_amount} onChange={(e) => setCorrectionForm({ ...correctionForm, corrected_amount: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-[#10101d]" />
            </label>
            <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300">Reason for correction
              <textarea required value={correctionForm.reason} onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-[#10101d]" rows="3" />
            </label>
            {correctionTransactions.length === 0 && (
              <p className="flex items-center gap-1.5 text-sm text-amber-600">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" /> No deposit payments are available to correct.
              </p>
            )}
            <div className="flex gap-2">
              <button disabled={submittingCorrection || correctionTransactions.length === 0} className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50">{submittingCorrection ? 'Submitting...' : 'Request Admin Approval'}</button>
              <Button type="button" variant="secondary" onClick={() => setCorrection(null)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}
      <PageHeader
        title="Library Deposit Management"
        description={`Record deposit payments and monitor balances for actively subscribed ${membersLabel.toLowerCase()}.`}
        actions={
          <label className="w-full text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300 sm:w-64">Academic Year
            <select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 shadow-sm dark:border-gray-700 dark:bg-[#17172a] dark:text-white">
              {academicYears.map((year) => <option key={year.academic_year_id} value={year.academic_year_id}>{year.year_name || year.year_code}</option>)}
            </select>
          </label>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Deposit accounts" value={deposits.length} icon={Users} tone="blue" hint="Selected academic year only" />
        <StatCard label="Low deposit" value={lowDepositAccounts.length} icon={AlertTriangle} tone="amber" hint="At or below the warning threshold" />
        <StatCard label="Refund due" value={refundDue.length} icon={Undo2} tone="rose" hint="Not enrolled this academic year" />
      </div>

      {refundDue.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-rose-300 bg-rose-50 shadow-sm dark:border-rose-800 dark:bg-rose-950/40">
          <button type="button" onClick={() => setShowRefundDue((current) => !current)} aria-expanded={showRefundDue} className="flex w-full items-start gap-3 p-4 text-left hover:bg-rose-100/70 dark:hover:bg-rose-950/70">
            <Undo2 className="h-6 w-6 text-rose-700 dark:text-rose-300 shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <h4 className="text-sm font-bold uppercase tracking-wide text-rose-900 dark:text-rose-200">Deposit Refund Due ({refundDue.length})</h4>
              <p className="mt-1 text-xs text-rose-800 dark:text-rose-300">These members have a deposit balance but are not enrolled in the selected academic year.</p>
            </div>
            <ChevronDown className={`h-5 w-5 text-rose-800 dark:text-rose-300 shrink-0 transition-transform ${showRefundDue ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {showRefundDue && <div className="border-t border-rose-200 px-4 pb-4 pt-3 dark:border-rose-800">
            <div className="flex flex-wrap gap-2">{refundDue.map((account) => <div key={account.deposit_account_id} className="flex items-center gap-2 rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-900 dark:bg-rose-900/60 dark:text-rose-100">
              <span>{account.student_name} ({account.student_uid}) · Return ₹{Number(account.current_balance || 0).toFixed(2)}{account.previous_academic_year ? ` · Last enrolled ${account.previous_academic_year}` : ''}</span>
              {canRefund && <button type="button" onClick={() => refundDeposit(account)} className="rounded-md bg-rose-700 px-2 py-1 font-bold text-white hover:bg-rose-800">Refund</button>}
            </div>)}</div>
          </div>}
        </div>
      )}

      {/* Low Deposit Warning Banner */}
      {lowDepositAccounts.length > 0 && (
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 shadow-sm overflow-hidden">
          <button type="button" onClick={() => setShowLowDeposits((current) => !current)} aria-expanded={showLowDeposits} aria-controls="low-deposit-details" className="flex w-full items-start gap-3 p-4 text-left hover:bg-amber-100/60 dark:hover:bg-amber-950/70 transition-colors">
            <AlertTriangle className="h-6 w-6 text-amber-700 dark:text-amber-300 shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                Low Deposit Warning ({lowDepositAccounts.length} {lowDepositAccounts.length === 1 ? memberLabel : membersLabel})
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">{showLowDeposits ? `Hide affected ${membersLabel}` : `Click to view affected ${membersLabel}`}</p>
            </div>
            <ChevronDown className={`h-5 w-5 text-amber-800 dark:text-amber-300 shrink-0 transition-transform ${showLowDeposits ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {showLowDeposits && (
            <div id="low-deposit-details" className="border-t border-amber-200 dark:border-amber-800 px-4 pb-4 pt-3">
              <p className="text-xs text-amber-800 dark:text-amber-300">The following {membersLabel} have library deposits at or below the configured ₹{configuredWarningThreshold.toFixed(2)} borrowing threshold:</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {lowDepositAccounts.map((d) => (
                  <span
                    key={d.deposit_account_id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-200/60 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100 text-xs font-semibold"
                  >
                    <span>{d.student_name} ({d.student_uid})</span>
                    <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">₹{Number(d.current_balance).toFixed(2)}</span>
                    <span className="font-normal text-amber-800 dark:text-amber-300">(limit ₹{Number(d.warning_threshold || 0).toFixed(2)})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {message && (
        <div
          className={`flex items-center gap-2 p-4 rounded-xl text-sm font-semibold shadow-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" /> : <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />}
          {message.text}
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1.5 dark:border-[#292944] dark:bg-[#17172a]">
        {depositTabs.map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" onClick={() => setDepositTab(key)} className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold transition-colors ${depositTab === key ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#292944]'}`}>
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {depositTab === 'payment' && <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top-up / Deposit Form Section */}
        <div className="bg-white dark:bg-[#17172a] rounded-2xl p-6 border border-gray-200 dark:border-[#292944] shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Wallet className="h-5 w-5 text-blue-500" aria-hidden="true" /> Record Deposit Payment
          </h3>

          <form onSubmit={handleTopUp} className="space-y-4">
            <StudentSearchInput
              label={`Select ${memberLabel}`}
              libraryOnly={true}
              selectedStudent={selectedStudent}
              onSelectStudent={(stu) => setSelectedStudent(stu)}
            />

            {selectedStudent && (
              <div className="rounded-xl bg-gray-50 dark:bg-[#10101d] p-3 text-xs border border-gray-200 dark:border-gray-800 space-y-1">
                <div className="font-bold text-gray-900 dark:text-white flex justify-between items-center gap-2">
                  <span>{selectedStudent.student_name} ({selectedStudent.student_uid})</span>
                  <Badge tone="success" icon={CheckCircle2}>Library Access Enabled</Badge>
                </div>
                <div className="text-gray-500 dark:text-gray-400 flex justify-between items-center pt-1">
                  <span>Current Balance: ₹{Number(selectedStudent.deposit_balance || 0).toFixed(2)}</span>
                  {selectedStudent.outstanding_balance > 0 ? (
                    <Badge tone="danger">Unpaid Fine: ₹{Number(selectedStudent.outstanding_balance).toFixed(2)}</Badge>
                  ) : (
                    <Badge tone="success">No Debt</Badge>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                Deposit Amount Paid (₹)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={topUpData.amount}
                onChange={(e) => setTopUpData({ ...topUpData, amount: e.target.value })}
                placeholder="Enter deposit amount..."
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#10101d] px-3.5 py-2.5 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                disabled={!canTopUp}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                Payment Description / Notes
              </label>
              <input
                type="text"
                value={topUpData.description}
                onChange={(e) => setTopUpData({ ...topUpData, description: e.target.value })}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#10101d] px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                disabled={!canTopUp}
              />
            </div>

            <Button type="submit" variant="primary" fullWidth size="lg" disabled={!canTopUp || !selectedStudent} icon={canTopUp ? undefined : Lock}>
              {canTopUp ? 'Record Deposit Payment' : 'No Permission'}
            </Button>
          </form>
        </div>

        {/* Financial Overview Card */}
        <div className="bg-white dark:bg-[#17172a] rounded-2xl p-6 border border-gray-200 dark:border-[#292944] shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-blue-500" aria-hidden="true" /> Deposit Overview Metrics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label={`Total Library Access ${membersLabel}`} value={deposits.length} icon={Users} tone="blue" />
              <StatCard label="Total Liquid Deposit Balance" value={`₹${totalLiquidBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={PiggyBank} tone="emerald" />
              <StatCard label="Total Outstanding Unpaid Fines" value={`₹${totalOutstandingFines.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={ShieldAlert} tone="rose" />
              <StatCard label={`Low Balance Warnings (≤₹${configuredWarningThreshold.toFixed(2)})`} value={lowDepositAccounts.length} icon={AlertTriangle} tone={lowDepositAccounts.length > 0 ? 'amber' : 'green'} />
            </div>
          </div>
        </div>
      </div>}

      {/* Deposits Table */}
      {depositTab === 'accounts' && <div className="bg-white dark:bg-[#17172a] rounded-2xl border border-gray-200 dark:border-[#292944] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-[#292944] flex justify-between items-center">
          <h4 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white text-base">
            <ClipboardList className="h-4 w-4 text-blue-500" aria-hidden="true" /> {memberLabel} Library Deposit Accounts
          </h4>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Existing balances are carried forward when members re-enrol</span>
            <ColumnVisibilityMenu columns={DEPOSIT_ACCOUNT_COLUMNS} isVisible={isVisible} onToggle={toggle} onReset={reset} hiddenCount={hiddenCount} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 dark:bg-[#22223a] text-gray-700 dark:text-gray-300 font-bold text-xs uppercase">
              <tr>
                <SortableTh sortKey="member_id" direction={directionFor('member_id')} onSort={requestSort} className={`px-4 py-3 ${isVisible('member_id') ? '' : 'hidden'}`}>{memberLabel} ID</SortableTh>
                <SortableTh sortKey="member_name" direction={directionFor('member_name')} onSort={requestSort} className={`px-4 py-3 ${isVisible('member_name') ? '' : 'hidden'}`}>{memberLabel} Name</SortableTh>
                <th className={`px-4 py-3 ${isVisible('library_access') ? '' : 'hidden'}`}>Library Access</th>
                <SortableTh sortKey="subscription_status" direction={directionFor('subscription_status')} onSort={requestSort} className={`px-4 py-3 ${isVisible('subscription_status') ? '' : 'hidden'}`}>Subscription Status</SortableTh>
                <SortableTh sortKey="deposit_amount" direction={directionFor('deposit_amount')} onSort={requestSort} className={`px-4 py-3 ${isVisible('deposit_amount') ? '' : 'hidden'}`}>Deposit Amount</SortableTh>
                <SortableTh sortKey="deposit_status" direction={directionFor('deposit_status')} onSort={requestSort} className={`px-4 py-3 ${isVisible('deposit_status') ? '' : 'hidden'}`}>Deposit Balance / Status</SortableTh>
                <th className={`px-4 py-3 text-right ${isVisible('actions') ? '' : 'hidden'}`}>Actions</th>
              </tr>
            </thead>
            {paginatedDeposits.length > 0 && (
              <tbody className="divide-y divide-gray-200 dark:divide-[#292944]">
                {paginatedDeposits.map((d) => (
                  <tr key={d.deposit_account_id} className="hover:bg-blue-50/20 dark:hover:bg-[#19192e] transition-colors">
                    <td className={`px-4 py-3 font-mono text-xs font-bold text-gray-700 dark:text-gray-300 ${isVisible('member_id') ? '' : 'hidden'}`}>
                      {d.student_uid}
                    </td>
                    <td className={`px-4 py-3 font-bold text-gray-900 dark:text-white ${isVisible('member_name') ? '' : 'hidden'}`}>
                      {d.student_name}
                    </td>
                    <td className={`px-4 py-3 text-xs ${isVisible('library_access') ? '' : 'hidden'}`}>
                      <Badge tone="success" icon={CheckCircle2}>Enabled</Badge>
                    </td>
                    <td className={`px-4 py-3 text-xs ${isVisible('subscription_status') ? '' : 'hidden'}`}>
                      <Badge tone={subscriptionStatusTone[d.subscription_status] || 'neutral'}>
                        {subscriptionStatusLabel[d.subscription_status] || 'Plan Not Selected'}
                      </Badge>
                    </td>
                    <td className={`px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400 ${isVisible('deposit_amount') ? '' : 'hidden'}`}>
                      ₹{Number(d.current_balance || 0).toFixed(2)}
                      {d.deposit_forwarded && <div className="mt-1 text-[10px] font-bold uppercase text-blue-600 dark:text-blue-300">Forwarded from previous year</div>}
                    </td>
                    <td className={`px-4 py-3 text-xs ${isVisible('deposit_status') ? '' : 'hidden'}`}>
                      <Badge tone={d.is_low_balance ? 'warning' : 'success'} icon={d.is_low_balance ? AlertTriangle : CheckCircle2}>
                        {d.is_low_balance ? 'Low Deposit Warning' : 'Healthy'}
                      </Badge>
                    </td>
                    <td className={`px-4 py-3 text-right ${isVisible('actions') ? '' : 'hidden'}`}>
                      {canTopUp && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedStudent({
                                student_id: d.student_id,
                                student_uid: d.student_uid,
                                student_name: d.student_name,
                                deposit_balance: d.current_balance,
                                outstanding_balance: d.outstanding_balance
                              })
                              setDepositTab('payment')
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-lg font-semibold hover:bg-blue-100 text-xs transition-colors"
                          >
                            <BadgeIndianRupee className="h-3.5 w-3.5" aria-hidden="true" /> Record Payment
                          </button>
                          <button onClick={() => openCorrection(d)} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-semibold text-xs">
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Correct Mistake
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
          {paginatedDeposits.length === 0 && (
            <EmptyState icon={Users} title="No deposit accounts found" description={`No actively subscribed ${membersLabel.toLowerCase()} found for this academic year.`} />
          )}
        </div>
        <div className="px-5 py-4 border-t border-gray-200 dark:border-[#292944]">
          <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={deposits.length} perPage={pageSize} onPageChange={setCurrentPage} itemLabel="accounts" />
        </div>
      </div>}
    </div>
  )
}

export default Deposits
