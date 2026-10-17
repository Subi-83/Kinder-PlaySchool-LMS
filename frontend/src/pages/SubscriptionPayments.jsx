import React, { useEffect, useState } from 'react'
import api from '../services/api'
import Pagination from '../components/common/Pagination'
import { useAuth } from '../context/AuthContext'
import { PageHeader, Button, IconButton, EmptyState, LoadingState, ColumnVisibilityMenu, useColumnVisibility, SortableTh, useSortableData, Modal } from '../components/ui'
import { Info, Pencil, Wallet } from 'lucide-react'

const COLUMNS = [
  { key: 'member', label: 'Member', locked: true },
  { key: 'plan', label: 'Plan' },
  { key: 'academic_year', label: 'Academic Year' },
  { key: 'cost_paid', label: 'Cost Paid' },
  { key: 'payment', label: 'Payment' },
  { key: 'action', label: 'Action', locked: true },
]

function SubscriptionPayments() {
  const { user, hasPermission } = useAuth()
  const canEdit = user?.role === 'ADMIN' || hasPermission('subscription.payment.edit')
  const { isVisible, toggle, reset, hiddenCount } = useColumnVisibility('subscription-payments', COLUMNS)
  const [years, setYears] = useState([])
  const [yearId, setYearId] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ amount_paid: '', payment_date: '', payment_method: '', payment_proof_url: '' })
  const [message, setMessage] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const load = async () => {
    try {
      setLoading(true)
      const [yearResponse, paymentResponse] = await Promise.all([
        api.get('/students/academic-years'),
        api.get('/subscriptions/student-subscriptions', { params: yearId ? { academic_year_id: yearId } : {} })
      ])
      setYears(yearResponse.data || [])
      setRows(paymentResponse.data || [])
      if (!yearId) {
        const current = (yearResponse.data || []).find((year) => year.is_current)
        if (current) setYearId(String(current.academic_year_id))
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'Could not load subscription payments.')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [yearId])
  useEffect(() => { setPage(1) }, [yearId])
  const { sortedItems: sortedRows, requestSort, directionFor } = useSortableData(rows, null, (row, key) => {
    if (key === 'member') return row.student_name
    if (key === 'plan') return row.plan?.plan_name
    if (key === 'academic_year') return row.academic_year?.year_code
    if (key === 'cost_paid') return row.amount_paid
    return row[key]
  })
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  const visible = sortedRows.slice((page - 1) * pageSize, page * pageSize)

  const openEdit = (row) => {
    if (!canEdit) return
    setEditing(row)
    setForm({ amount_paid: row.amount_paid ?? '', payment_date: row.payment_date || '', payment_method: row.payment_method || '', payment_proof_url: row.payment_proof_url || '' })
  }
  const save = async (event) => {
    event.preventDefault()
    try {
      await api.put(`/subscriptions/payments/${editing.subscription_id}`, form)
      setEditing(null); setMessage('Subscription payment updated.'); await load()
    } catch (error) { setMessage(error.response?.data?.error || 'Could not update subscription payment.') }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Subscription Payments"
        description="Subscription fees are managed separately and never change deposit balances."
        actions={
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs font-bold uppercase text-gray-600 dark:text-gray-300">Academic Year
              <select value={yearId} onChange={(e) => setYearId(e.target.value)} className="mt-1 block rounded-xl border bg-white px-3 py-2 dark:border-gray-700 dark:bg-[#17172a]">
                {years.map((year) => <option key={year.academic_year_id} value={year.academic_year_id}>{year.year_name || year.year_code}</option>)}
              </select>
            </label>
            <ColumnVisibilityMenu columns={COLUMNS} isVisible={isVisible} onToggle={toggle} onReset={reset} hiddenCount={hiddenCount} />
          </div>
        }
      />

      {message && (
        <div className="flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-sm dark:bg-blue-950/30">
          <Info className="h-4 w-4 shrink-0 text-blue-500" aria-hidden="true" />
          {message}
        </div>
      )}

      <div className="rounded-2xl border bg-white dark:border-[#292944] dark:bg-[#17172a]">
        {loading ? (
          <LoadingState label="Loading subscription payments…" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-left text-xs uppercase dark:bg-[#22223a]">
                  <tr>
                    <SortableTh sortKey="member" direction={directionFor('member')} onSort={requestSort} className={`p-3 ${isVisible('member') ? '' : 'hidden'}`}>Member</SortableTh>
                    <SortableTh sortKey="plan" direction={directionFor('plan')} onSort={requestSort} className={`p-3 ${isVisible('plan') ? '' : 'hidden'}`}>Plan</SortableTh>
                    <SortableTh sortKey="academic_year" direction={directionFor('academic_year')} onSort={requestSort} className={`p-3 ${isVisible('academic_year') ? '' : 'hidden'}`}>Academic Year</SortableTh>
                    <SortableTh sortKey="cost_paid" direction={directionFor('cost_paid')} onSort={requestSort} className={`p-3 ${isVisible('cost_paid') ? '' : 'hidden'}`}>Cost Paid</SortableTh>
                    <th className={`p-3 ${isVisible('payment') ? '' : 'hidden'}`}>Payment</th>
                    <th className={`p-3 text-right ${isVisible('action') ? '' : 'hidden'}`}>Action</th>
                  </tr>
                </thead>
                {visible.length > 0 && (
                  <tbody>
                    {visible.map((row) => (
                      <tr key={row.subscription_id} className="border-t dark:border-[#292944]">
                        <td className={`p-3 font-semibold ${isVisible('member') ? '' : 'hidden'}`}>
                          {row.student_name}
                          <div className="text-xs text-gray-500">{row.student_uid}</div>
                        </td>
                        <td className={`p-3 ${isVisible('plan') ? '' : 'hidden'}`}>{row.plan?.plan_name}</td>
                        <td className={`p-3 ${isVisible('academic_year') ? '' : 'hidden'}`}>{row.academic_year?.year_code || '-'}</td>
                        <td className={`p-3 font-bold ${isVisible('cost_paid') ? '' : 'hidden'}`}>₹{Number(row.amount_paid || 0).toFixed(2)}</td>
                        <td className={`p-3 ${isVisible('payment') ? '' : 'hidden'}`}>
                          {row.payment_method || '-'}
                          <div className="text-xs text-gray-500">{row.payment_date || '-'}</div>
                        </td>
                        <td className={`p-3 text-right ${isVisible('action') ? '' : 'hidden'}`}>
                          {canEdit ? (
                            <IconButton icon={Pencil} label="Edit payment" variant="subtle" size="sm" onClick={() => openEdit(row)} />
                          ) : (
                            <IconButton icon={Pencil} label="Edit payment" variant="subtle" size="sm" disabled className="opacity-40" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
              {visible.length === 0 && (
                <EmptyState icon={Wallet} title="No subscription payments found" description="Payment records will appear here once subscriptions are assigned." />
              )}
            </div>
            <div className="p-4">
              <Pagination currentPage={page} totalPages={totalPages} totalItems={rows.length} perPage={pageSize} onPageChange={setPage} itemLabel="payments" />
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title="Edit Subscription Payment"
        description={editing ? `${editing.student_name} (${editing.student_uid}) · Plan: ${editing.plan?.plan_name || 'N/A'}` : ''}
        size="md"
      >
        {editing && (
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">Amount Paid (₹) *</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.amount_paid}
                onChange={(e) => setForm({ ...form, amount_paid: e.target.value })}
                placeholder="Amount paid"
                className="w-full rounded-xl border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#10101d] px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">Payment Date</label>
              <input
                type="date"
                value={form.payment_date}
                onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                className="w-full rounded-xl border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#10101d] px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">Payment Method</label>
              <input
                value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                placeholder="e.g. Cash, UPI, Bank Transfer"
                className="w-full rounded-xl border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#10101d] px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1">Payment Proof Reference (Optional)</label>
              <input
                value={form.payment_proof_url}
                onChange={(e) => setForm({ ...form, payment_proof_url: e.target.value })}
                placeholder="Transaction ID, Receipt Ref..."
                className="w-full rounded-xl border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#10101d] px-3.5 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-[#2a2a4a]">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" variant="primary">Save Payment</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
export default SubscriptionPayments
