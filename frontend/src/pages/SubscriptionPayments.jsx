import React, { useEffect, useState } from 'react'
import api from '../services/api'
import Pagination from '../components/common/Pagination'
import { useAuth } from '../context/AuthContext'

function SubscriptionPayments() {
  const { user, hasPermission } = useAuth()
  const canEdit = user?.role === 'ADMIN' || hasPermission('subscription.payment.edit')
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
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const visible = rows.slice((page - 1) * pageSize, page * pageSize)

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

  return <div className="space-y-5">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-2xl font-bold">Subscription Payments</h2><p className="text-sm text-gray-500">Subscription fees are managed separately and never change deposit balances.</p></div><label className="text-xs font-bold uppercase">Academic Year<select value={yearId} onChange={(e) => setYearId(e.target.value)} className="mt-1 block rounded-xl border bg-white px-3 py-2 dark:border-gray-700 dark:bg-[#17172a]">{years.map((year) => <option key={year.academic_year_id} value={year.academic_year_id}>{year.year_name || year.year_code}</option>)}</select></label></div>
    {message && <div className="rounded-xl bg-blue-50 p-3 text-sm dark:bg-blue-950/30">{message}</div>}
    <div className="rounded-2xl border bg-white dark:border-[#292944] dark:bg-[#17172a]">{loading ? <p className="p-12 text-center text-gray-500">Loading payments...</p> : <><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-100 text-left text-xs uppercase dark:bg-[#22223a]"><tr><th className="p-3">Member</th><th className="p-3">Plan</th><th className="p-3">Academic Year</th><th className="p-3">Cost Paid</th><th className="p-3">Payment</th><th className="p-3 text-right">Action</th></tr></thead><tbody>{visible.map((row) => <tr key={row.subscription_id} className="border-t dark:border-[#292944]"><td className="p-3 font-semibold">{row.student_name}<div className="text-xs text-gray-500">{row.student_uid}</div></td><td className="p-3">{row.plan?.plan_name}</td><td className="p-3">{row.academic_year?.year_code || '-'}</td><td className="p-3 font-bold">₹{Number(row.amount_paid || 0).toFixed(2)}</td><td className="p-3">{row.payment_method || '-'}<div className="text-xs text-gray-500">{row.payment_date || '-'}</div></td><td className="p-3 text-right"><button onClick={() => openEdit(row)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white">Edit Payment</button></td></tr>)}</tbody></table></div><div className="p-4"><Pagination currentPage={page} totalPages={totalPages} totalItems={rows.length} perPage={pageSize} onPageChange={setPage} itemLabel="payments" /></div></>}</div>
    {editing && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><form onSubmit={save} className="w-full max-w-lg space-y-3 rounded-2xl bg-white p-6 dark:bg-[#17172a]"><h3 className="text-lg font-bold">Edit Subscription Payment</h3><input required type="number" min="0" step="0.01" value={form.amount_paid} onChange={(e) => setForm({...form, amount_paid:e.target.value})} placeholder="Amount paid" className="w-full rounded-xl border px-3 py-2 dark:bg-[#10101d]"/><input type="date" value={form.payment_date} onChange={(e) => setForm({...form, payment_date:e.target.value})} className="w-full rounded-xl border px-3 py-2 dark:bg-[#10101d]"/><input value={form.payment_method} onChange={(e) => setForm({...form, payment_method:e.target.value})} placeholder="Payment method" className="w-full rounded-xl border px-3 py-2 dark:bg-[#10101d]"/><input value={form.payment_proof_url} onChange={(e) => setForm({...form, payment_proof_url:e.target.value})} placeholder="Payment proof reference (optional)" className="w-full rounded-xl border px-3 py-2 dark:bg-[#10101d]"/><div className="flex gap-2"><button className="rounded-xl bg-blue-600 px-4 py-2 text-white">Save</button><button type="button" onClick={() => setEditing(null)} className="rounded-xl bg-gray-200 px-4 py-2 dark:bg-[#292944]">Cancel</button></div></form></div>}
  </div>
}
export default SubscriptionPayments
