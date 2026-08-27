import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import StudentSearchInput from '../components/StudentSearchInput'
import Pagination from '../components/common/Pagination'
import { useAppSettings } from '../context/AppSettingsContext'

function Deposits() {
  const { user, hasPermission } = useAuth()
  const { memberLabel, membersLabel } = useAppSettings()
  const [deposits, setDeposits] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showLowDeposits, setShowLowDeposits] = useState(false)
  const [correction, setCorrection] = useState(null)
  const [correctionTransactions, setCorrectionTransactions] = useState([])
  const [correctionForm, setCorrectionForm] = useState({ transaction_id: '', corrected_amount: '', reason: '' })
  const [submittingCorrection, setSubmittingCorrection] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [topUpData, setTopUpData] = useState({
    amount: '',
    description: 'Deposit payment'
  })

  const canTopUp = hasPermission('deposit.topup') || user?.role === 'ADMIN'

  const loadData = async () => {
    try {
      setLoading(true)
      const depositsRes = await api.get('/deposits')
      const eligibleDepositStudents = depositsRes.data || []
      setDeposits(eligibleDepositStudents)
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

  useEffect(() => {
    loadData()
  }, [])

  const handleTopUp = async (e) => {
    e.preventDefault()
    if (!selectedStudent || !topUpData.amount || parseFloat(topUpData.amount) <= 0) {
      setMessage('Please select a student and enter a valid deposit amount.')
      return
    }
    try {
      await api.post('/deposits/topup', {
        student_id: selectedStudent.student_id,
        amount: parseFloat(topUpData.amount),
        description: topUpData.description
      })
      setMessage(`✅ Deposit recorded successfully! Updated deposit account for ${selectedStudent.student_name}.`)
      setTopUpData({ amount: '', description: 'Deposit payment' })
      setSelectedStudent(null)
      await loadData()
      setTimeout(() => setMessage(''), 4000)
    } catch (err) {
      setMessage('❌ ' + (err.data?.error || err.response?.data?.error || err.message || 'Error recording deposit'))
    }
  }

  const openCorrection = async (account) => {
    setCorrection(account)
    setCorrectionForm({ transaction_id: '', corrected_amount: '', reason: '' })
    try {
      const response = await api.get(`/deposits/transactions/${account.student_id}`)
      setCorrectionTransactions((response.data || []).filter((item) => ['TOP_UP', 'INITIAL_DEPOSIT'].includes(item.transaction_type)))
    } catch (err) {
      setMessage('❌ Could not load deposit payment history.')
      setCorrection(null)
    }
  }

  const submitCorrection = async (event) => {
    event.preventDefault()
    try {
      setSubmittingCorrection(true)
      const response = await api.post('/deposits/correction-request', correctionForm)
      setMessage(`✅ ${response.data?.message || 'Correction request submitted.'}`)
      setCorrection(null)
    } catch (err) {
      setMessage('❌ ' + (err.response?.data?.error || 'Could not submit correction request.'))
    } finally {
      setSubmittingCorrection(false)
    }
  }

  const lowDepositAccounts = deposits.filter((d) => d.is_low_balance)
  const configuredWarningThreshold = Number(deposits[0]?.warning_threshold || 0)
  const totalPages = Math.max(1, Math.ceil(deposits.length / pageSize))
  const paginatedDeposits = deposits.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading library deposits...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {correction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <form onSubmit={submitCorrection} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-[#17172a]">
            <div><h3 className="text-lg font-bold text-gray-900 dark:text-white">Correct Mistaken Deposit</h3><p className="text-sm text-gray-500">{correction.student_name} ({correction.student_uid}) · Current balance ₹{Number(correction.current_balance).toFixed(2)}</p></div>
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
            {correctionTransactions.length === 0 && <p className="text-sm text-amber-600">No deposit payments are available to correct.</p>}
            <div className="flex gap-2"><button disabled={submittingCorrection || correctionTransactions.length === 0} className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{submittingCorrection ? 'Submitting...' : 'Request Admin Approval'}</button><button type="button" onClick={() => setCorrection(null)} className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-bold dark:bg-[#292944]">Cancel</button></div>
          </form>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Library Deposit Management</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Record deposit payments and monitor {memberLabel.toLowerCase()} balances for members with Library Access.
          </p>
        </div>
      </div>

      {/* Low Deposit Warning Banner */}
      {lowDepositAccounts.length > 0 && (
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 shadow-sm overflow-hidden">
          <button type="button" onClick={() => setShowLowDeposits((current) => !current)} aria-expanded={showLowDeposits} aria-controls="low-deposit-details" className="flex w-full items-start gap-3 p-4 text-left hover:bg-amber-100/60 dark:hover:bg-amber-950/70 transition-colors">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                Low Deposit Warning ({lowDepositAccounts.length} {lowDepositAccounts.length === 1 ? memberLabel : membersLabel})
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">{showLowDeposits ? `Hide affected ${membersLabel}` : `Click to view affected ${membersLabel}`}</p>
            </div>
            <span className={`text-lg text-amber-800 dark:text-amber-300 transition-transform ${showLowDeposits ? 'rotate-180' : ''}`} aria-hidden="true">⌄</span>
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
          className={`p-4 rounded-xl text-sm font-semibold shadow-sm ${
            message.includes('✅')
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top-up / Deposit Form Section */}
        <div className="bg-white dark:bg-[#17172a] rounded-2xl p-6 border border-gray-200 dark:border-[#292944] shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>💳</span> Record Deposit Payment
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
                <div className="font-bold text-gray-900 dark:text-white flex justify-between items-center">
                  <span>{selectedStudent.student_name} ({selectedStudent.student_uid})</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold">
                    ✓ Library Access Enabled
                  </span>
                </div>
                <div className="text-gray-500 dark:text-gray-400 flex justify-between pt-1">
                  <span>Current Balance: ₹{Number(selectedStudent.deposit_balance || 0).toFixed(2)}</span>
                  {selectedStudent.outstanding_balance > 0 ? (
                    <span className="text-rose-500 font-bold">Unpaid Fine: ₹{Number(selectedStudent.outstanding_balance).toFixed(2)}</span>
                  ) : (
                    <span className="text-emerald-500 font-semibold">No Debt</span>
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

            <button
              type="submit"
              disabled={!canTopUp || !selectedStudent}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {canTopUp ? 'Record Deposit Payment' : '⛔ No Permission'}
            </button>
          </form>
        </div>

        {/* Financial Overview Card */}
        <div className="bg-white dark:bg-[#17172a] rounded-2xl p-6 border border-gray-200 dark:border-[#292944] shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>📊</span> Deposit Overview Metrics
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-600 dark:text-gray-400">Total Library Access {membersLabel}</span>
                <span className="font-bold text-gray-900 dark:text-white">{deposits.length}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-600 dark:text-gray-400">Total Liquid Deposit Balance</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{deposits.reduce((sum, d) => sum + Number(d.current_balance || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-600 dark:text-gray-400">Total Outstanding Unpaid Fines</span>
                <span className="font-bold text-rose-500">
                  ₹{deposits.reduce((sum, d) => sum + Number(d.outstanding_balance || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600 dark:text-gray-400">Low Balance Warnings (≤₹{configuredWarningThreshold.toFixed(2)})</span>
                <span className={`font-bold ${lowDepositAccounts.length > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {lowDepositAccounts.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deposits Table */}
      <div className="bg-white dark:bg-[#17172a] rounded-2xl border border-gray-200 dark:border-[#292944] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-[#292944] flex justify-between items-center">
          <h4 className="font-bold text-gray-900 dark:text-white text-base">📋 {memberLabel} Library Deposit Accounts</h4>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Only showing members with Library Access enabled</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 dark:bg-[#22223a] text-gray-700 dark:text-gray-300 font-bold text-xs uppercase">
              <tr>
                <th className="px-4 py-3">{memberLabel} ID</th>
                <th className="px-4 py-3">{memberLabel} Name</th>
                <th className="px-4 py-3">Library Access</th>
                <th className="px-4 py-3">Subscription Status</th>
                <th className="px-4 py-3">Deposit Amount</th>
                <th className="px-4 py-3">Deposit Balance / Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#292944]">
              {paginatedDeposits.map((d) => (
                <tr key={d.deposit_account_id} className="hover:bg-blue-50/20 dark:hover:bg-[#19192e] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
                    {d.student_uid}
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                    {d.student_name}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      ✓ Enabled
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span
                      className={`px-2.5 py-1 rounded-full font-bold ${
                        d.subscription_status === 'ACTIVE'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : d.subscription_status === 'EXPIRED'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {d.subscription_status === 'ACTIVE' ? 'Active' : d.subscription_status === 'EXPIRED' ? 'Expired' : 'Not Subscribed'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{Number(d.current_balance || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold ${
                        d.is_low_balance
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {d.is_low_balance ? '⚠️ Low Deposit Warning' : '✓ Healthy'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canTopUp && (
                      <><button
                        onClick={() => {
                          setSelectedStudent({
                            student_id: d.student_id,
                            student_uid: d.student_uid,
                            student_name: d.student_name,
                            deposit_balance: d.current_balance,
                            outstanding_balance: d.outstanding_balance
                          })
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-lg font-semibold hover:bg-blue-100 text-xs transition-colors"
                      >
                        + Record Payment
                      </button>
                      <button onClick={() => openCorrection(d)} className="ml-2 px-3 py-1 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-semibold text-xs">Correct Mistake</button></>
                    )}
                  </td>
                </tr>
              ))}
              {deposits.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No deposit accounts found for {membersLabel} with Library Access.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 border-t border-gray-200 dark:border-[#292944]">
          <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={deposits.length} perPage={pageSize} onPageChange={setCurrentPage} itemLabel="accounts" />
        </div>
      </div>
    </div>
  )
}

export default Deposits
