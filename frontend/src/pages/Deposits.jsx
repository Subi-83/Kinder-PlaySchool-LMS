import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import StudentSearchInput from '../components/StudentSearchInput'

function Deposits() {
  const { user, hasPermission } = useAuth()
  const [deposits, setDeposits] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
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

  const lowDepositAccounts = deposits.filter((d) => d.is_low_balance)

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Library Deposit Management</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Record deposit payments and monitor student library balances for students with Library Access.
          </p>
        </div>
      </div>

      {/* Low Deposit Warning Banner */}
      {lowDepositAccounts.length > 0 && (
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                Low Deposit Warning ({lowDepositAccounts.length} Student{lowDepositAccounts.length > 1 ? 's' : ''})
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                The following students have library deposits at or below the ₹300 borrowing threshold:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {lowDepositAccounts.map((d) => (
                  <span
                    key={d.deposit_account_id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-200/60 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100 text-xs font-semibold"
                  >
                    <span>{d.student_name} ({d.student_uid})</span>
                    <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">₹{Number(d.current_balance).toFixed(2)}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
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
              label="Select Student"
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
                <span className="text-gray-600 dark:text-gray-400">Total Library Access Students</span>
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
                <span className="text-gray-600 dark:text-gray-400">Low Balance Warnings (≤₹300)</span>
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
          <h4 className="font-bold text-gray-900 dark:text-white text-base">📋 Students Library Deposit Accounts</h4>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Only showing Library Access enabled students</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 dark:bg-[#22223a] text-gray-700 dark:text-gray-300 font-bold text-xs uppercase">
              <tr>
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Library Access</th>
                <th className="px-4 py-3">Subscription Status</th>
                <th className="px-4 py-3">Deposit Amount</th>
                <th className="px-4 py-3">Deposit Balance / Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#292944]">
              {deposits.map((d) => (
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
                      <button
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
                    )}
                  </td>
                </tr>
              ))}
              {deposits.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No deposit accounts found for students with Library Access.
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

export default Deposits
