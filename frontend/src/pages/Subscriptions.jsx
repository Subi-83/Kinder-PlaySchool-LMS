import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Pagination from '../components/common/Pagination'
import { useAppSettings } from '../context/AppSettingsContext'

function Subscriptions() {
  const { user, hasPermission } = useAuth()
  const { memberLabel, membersLabel } = useAppSettings()
  const [plans, setPlans] = useState([])
  const [eligibleStudents, setEligibleStudents] = useState([])
  const [activeSubscriptions, setActiveSubscriptions] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [academicYearId, setAcademicYearId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [upgradingSubscription, setUpgradingSubscription] = useState(null)
  const [renewingSubscription, setRenewingSubscription] = useState(null)
  const [renewData, setRenewData] = useState({ plan_id: '', amount: '', payment_method: '' })
  const [upgradePlanId, setUpgradePlanId] = useState('')
  const [subscriptionsPage, setSubscriptionsPage] = useState(1)
  const [plansPage, setPlansPage] = useState(1)
  const [subscriptionTab, setSubscriptionTab] = useState('assign')
  const pageSize = 10
  const [assignData, setAssignData] = useState({
    student_id: '',
    plan_id: ''
  })
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    plan_name: '',
    plan_code: '',
    max_books: 1,
    duration_months: 3,
    price: '',
    description: ''
  })

  const canCreate = hasPermission('subscription.create') || user?.role === 'ADMIN'
  const canEdit = hasPermission('subscription.edit') || user?.role === 'ADMIN'
  const canDelete = hasPermission('subscription.delete') || user?.role === 'ADMIN'
  const canAssign = hasPermission('subscription.create') || user?.role === 'ADMIN'
  const subscriptionPages = Math.max(1, Math.ceil(activeSubscriptions.length / pageSize))
  const planPages = Math.max(1, Math.ceil(plans.length / pageSize))
  const paginatedSubscriptions = activeSubscriptions.slice((subscriptionsPage - 1) * pageSize, subscriptionsPage * pageSize)
  const paginatedPlans = plans.slice((plansPage - 1) * pageSize, plansPage * pageSize)

  useEffect(() => {
    if (subscriptionsPage > subscriptionPages) setSubscriptionsPage(subscriptionPages)
    if (plansPage > planPages) setPlansPage(planPages)
  }, [subscriptionsPage, subscriptionPages, plansPage, planPages])

  const loadData = async () => {
    try {
      setLoading(true)
      const params = academicYearId ? { academic_year_id: academicYearId } : {}
      const [plansRes, eligibleRes, subHistoryRes, yearsRes] = await Promise.all([
        api.get('/subscriptions/plans'),
        api.get('/subscriptions/eligible-students', { params }),
        api.get('/subscriptions/student-subscriptions', { params }),
        api.get('/students/academic-years')
      ])
      setPlans(plansRes.data || [])
      setEligibleStudents(eligibleRes.data || [])
      setActiveSubscriptions(subHistoryRes.data || [])
      setAcademicYears(yearsRes.data || [])
      if (!academicYearId) {
        const current = (yearsRes.data || []).find((year) => year.is_current)
        if (current) setAcademicYearId(String(current.academic_year_id))
      }
    } catch (err) {
      console.error('Error loading subscription data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [academicYearId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.put(`/subscriptions/plans/${editing}`, formData)
      } else {
        await api.post('/subscriptions/plans', formData)
      }
      setShowForm(false)
      setEditing(null)
      setFormData({
        plan_name: '',
        plan_code: '',
        max_books: 1,
        duration_months: 3,
        price: '',
        description: ''
      })
      await loadData()
      setMessage('✅ Plan saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('❌ ' + (err.data?.error || err.response?.data?.error || err.message || 'Error saving plan'))
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return
    try {
      await api.delete(`/subscriptions/plans/${id}`)
      await loadData()
      setMessage('✅ Plan deleted successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('❌ ' + (err.data?.error || err.response?.data?.error || err.message || 'Error deleting plan'))
    }
  }

  const handleAssign = async (e) => {
    e.preventDefault()
    if (!assignData.student_id || !assignData.plan_id) {
      setMessage('Please select both student and plan.')
      return
    }
    try {
      await api.post('/subscriptions/assign', { ...assignData, academic_year_id: academicYearId })
      setMessage('✅ Subscription assigned successfully!')
      setAssignData({ student_id: '', plan_id: '' })
      await loadData()
      setTimeout(() => setMessage(''), 4000)
    } catch (err) {
      setMessage('❌ ' + (err.data?.error || err.response?.data?.error || err.message || 'Error assigning subscription'))
    }
  }

  const openRenew = (subscription) => {
    const planId = subscription.plan?.subscription_plan_id || subscription.subscription_plan_id || ''
    const plan = plans.find((item) => item.subscription_plan_id === Number(planId))
    setRenewingSubscription(subscription)
    setRenewData({ plan_id: String(planId), amount: String(plan?.price ?? subscription.amount_paid ?? ''), payment_method: '' })
  }

  const handleRenew = async (e) => {
    e.preventDefault()
    if (!renewingSubscription || !renewData.plan_id || !renewData.payment_method) {
      setMessage('Please select a plan and payment method.')
      return
    }
    try {
      await api.post(`/subscriptions/renew/${renewingSubscription.subscription_id}`, {
        plan_id: Number(renewData.plan_id), amount: Number(renewData.amount), payment_method: renewData.payment_method
      })
      setRenewingSubscription(null)
      setRenewData({ plan_id: '', amount: '', payment_method: '' })
      setMessage('✅ Subscription renewed successfully!')
      await loadData()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('❌ ' + (err.data?.error || err.response?.data?.error || err.message || 'Error renewing subscription'))
    }
  }

  const handleUpgrade = async () => {
    if (!upgradingSubscription || !upgradePlanId) {
      setMessage('Please choose the plan to upgrade to.')
      return
    }
    const selectedPlan = plans.find((plan) => plan.subscription_plan_id === Number(upgradePlanId))
    if (!window.confirm(`Upgrade ${upgradingSubscription.student_name} to ${selectedPlan?.plan_name}? The new plan starts today.`)) return

    try {
      await api.post(`/subscriptions/upgrade/${upgradingSubscription.subscription_id}`, { plan_id: Number(upgradePlanId) })
      setUpgradingSubscription(null)
      setUpgradePlanId('')
      setMessage('✅ Subscription upgraded successfully!')
      await loadData()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('❌ ' + (err.data?.error || err.response?.data?.error || err.message || 'Error upgrading subscription'))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading subscriptions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Library Subscriptions</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Manage library subscription plans and assign active subscriptions to eligible {membersLabel}.
          </p>
        </div>
        <label className="text-xs font-bold uppercase text-gray-600 dark:text-gray-300">Academic Year
          <select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} className="mt-1 block rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-[#17172a]">
            {academicYears.map((year) => <option key={year.academic_year_id} value={year.academic_year_id}>{year.year_name || year.year_code}</option>)}
          </select>
        </label>
        {canCreate && (
          <button
            onClick={() => { setSubscriptionTab('plans'); setShowForm(!showForm); setEditing(null); setFormData({ plan_name: '', plan_code: '', max_books: 1, duration_months: 3, price: '', description: '' }) }}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors font-semibold shadow-sm"
          >
            {showForm ? '✕ Cancel' : '+ Add Plan'}
          </button>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-xl font-semibold shadow-sm ${message.includes('✅') ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'}`}>
          <p>{message}</p>
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1.5 dark:border-[#2a2a4a] dark:bg-[#1a1a2e]">
        {[
          ['assign', '➕ Assign Subscription'], ['records', `🎟️ ${memberLabel} Subscriptions`], ['plans', '⚙️ Subscription Plans']
        ].map(([key, label]) => (
          <button key={key} type="button" onClick={() => setSubscriptionTab(key)} className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold transition-colors ${subscriptionTab === key ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#2a2a4a]'}`}>{label}</button>
        ))}
      </div>

      {subscriptionTab === 'plans' && showForm && (
        <div className="bg-white dark:bg-[#1a1a2e] rounded-xl p-6 border border-gray-200 dark:border-[#2a2a4a] shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editing ? 'Edit Plan' : 'New Subscription Plan'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 dark:text-gray-300 mb-1">
                  Plan Name *
                </label>
                <input
                  type="text"
                  value={formData.plan_name}
                  onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 dark:text-gray-300 mb-1">
                  Plan Code
                </label>
                <input
                  type="text"
                  value={formData.plan_code}
                  onChange={(e) => setFormData({ ...formData, plan_code: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 dark:text-gray-300 mb-1">
                  Max Books Allowed *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_books}
                  onChange={(e) => setFormData({ ...formData, max_books: parseInt(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 dark:text-gray-300 mb-1">
                  Duration (months) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration_months}
                  onChange={(e) => setFormData({ ...formData, duration_months: parseInt(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 dark:text-gray-300 mb-1">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors">
                {editing ? 'Update Plan' : 'Create Plan'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditing(null) }}
                className="px-4 py-2 bg-gray-200 dark:bg-[#2a2a4a] text-gray-700 dark:text-gray-200 rounded-xl transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {subscriptionTab === 'records' && upgradingSubscription && (
        <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl p-6 border border-blue-200 dark:border-blue-900/60 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">⬆️ Upgrade Subscription</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Upgrade <span className="font-semibold text-gray-900 dark:text-white">{upgradingSubscription.student_name}</span> from <span className="font-semibold">{upgradingSubscription.plan?.plan_name}</span>. The selected plan starts today and uses its full duration and price.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <select
              value={upgradePlanId}
              onChange={(e) => setUpgradePlanId(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm font-medium"
            >
              <option value="">-- Choose Upgrade Plan --</option>
              {plans.filter((plan) => plan.is_active && plan.subscription_plan_id !== upgradingSubscription.plan?.subscription_plan_id).map((plan) => (
                <option key={plan.subscription_plan_id} value={plan.subscription_plan_id}>
                  {plan.plan_name} — ₹{plan.price} ({plan.duration_months} months, max {plan.max_books} books)
                </option>
              ))}
            </select>
            <button onClick={handleUpgrade} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors">
              Confirm Upgrade
            </button>
            <button onClick={() => { setUpgradingSubscription(null); setUpgradePlanId('') }} className="px-4 py-2 bg-gray-200 dark:bg-[#2a2a4a] text-gray-700 dark:text-gray-200 rounded-xl font-semibold transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {subscriptionTab === 'records' && renewingSubscription && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <form onSubmit={handleRenew} className="w-full max-w-lg space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-[#2a2a4a] dark:bg-[#17172a]">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Renew Subscription</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{renewingSubscription.student_name}</p>
            </div>
            <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300">Subscription Plan
              <select required value={renewData.plan_id} onChange={(e) => {
                const plan = plans.find((item) => item.subscription_plan_id === Number(e.target.value))
                setRenewData({ ...renewData, plan_id: e.target.value, amount: String(plan?.price ?? '') })
              }} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-[#2a2a4a] dark:bg-[#0f0f1a]">
                <option value="">-- Choose Plan --</option>
                {plans.filter((plan) => plan.is_active).map((plan) => <option key={plan.subscription_plan_id} value={plan.subscription_plan_id}>{plan.plan_name} - ₹{plan.price}</option>)}
              </select>
            </label>
            <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300">Amount Paid
              <input required type="number" min="0" step="0.01" value={renewData.amount} onChange={(e) => setRenewData({ ...renewData, amount: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-[#2a2a4a] dark:bg-[#0f0f1a]" />
            </label>
            <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300">Payment Method
              <select required value={renewData.payment_method} onChange={(e) => setRenewData({ ...renewData, payment_method: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-[#2a2a4a] dark:bg-[#0f0f1a]">
                <option value="">-- Select Payment Method --</option>
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="CHEQUE">Cheque</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setRenewingSubscription(null); setRenewData({ plan_id: '', amount: '', payment_method: '' }) }} className="rounded-xl bg-gray-200 px-4 py-2 font-semibold text-gray-700 dark:bg-[#292944] dark:text-gray-200">Cancel</button>
              <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700">Confirm Renewal</button>
            </div>
          </form>
        </div>
      )}

      {/* Assign Subscription Section */}
      {subscriptionTab === 'assign' && canAssign && (
        <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl p-6 border border-gray-200 dark:border-[#2a2a4a] shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>📋</span> Assign New Subscription
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Only displaying {membersLabel} with Library Access who have NO active subscription
            </span>
          </div>

          <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 dark:text-gray-300 mb-1">
                Select {memberLabel} ({eligibleStudents.length} Eligible)
              </label>
              <select
                value={assignData.student_id}
                onChange={(e) => setAssignData({ ...assignData, student_id: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                required
              >
                <option value="">-- Choose {memberLabel} --</option>
                {eligibleStudents.map(s => (
                  <option key={s.student_id} value={s.student_id}>
                    {s.student_uid} - {s.student_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 dark:text-gray-300 mb-1">
                Select Subscription Plan
              </label>
              <select
                value={assignData.plan_id}
                onChange={(e) => setAssignData({ ...assignData, plan_id: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                required
              >
                <option value="">-- Choose Plan --</option>
                {plans.filter(p => p.is_active).map(p => (
                  <option key={p.subscription_plan_id} value={p.subscription_plan_id}>
                    {p.plan_name} - ₹{p.price} ({p.duration_months} month{p.duration_months > 1 ? 's' : ''}, max {p.max_books} books)
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={eligibleStudents.length === 0}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                Assign Subscription
              </button>
            </div>
          </form>
          {eligibleStudents.length === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              ℹ️ No {membersLabel} are currently eligible for a new subscription. {membersLabel} with active subscriptions cannot be assigned duplicates until their active subscription expires.
            </p>
          )}
        </div>
      )}

      {/* Active & Past Subscriptions List */}
      {subscriptionTab === 'records' && <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-gray-200 dark:border-[#2a2a4a] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-[#2a2a4a] flex justify-between items-center">
          <h4 className="font-bold text-gray-900 dark:text-white text-base">🎟️ {memberLabel} Subscriptions Status</h4>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Records: {activeSubscriptions.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 dark:bg-[#0f0f1a] text-gray-700 dark:text-gray-300 font-bold text-xs uppercase">
              <tr>
                <th className="px-4 py-3">{memberLabel} ID</th>
                <th className="px-4 py-3">{memberLabel} Name</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Start Date</th>
                <th className="px-4 py-3">End Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#2a2a4a]">
              {paginatedSubscriptions.map((sub) => (
                <tr key={sub.subscription_id} className="hover:bg-blue-50/20 dark:hover:bg-[#0f0f1a] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
                    {sub.student_uid}
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                    {sub.student_name}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                    {sub.plan?.plan_name || 'Standard Plan'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                    {sub.start_date}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                    {sub.end_date}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span
                      className={`px-2.5 py-1 rounded-full font-bold ${
                        sub.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {sub.status === 'ACTIVE' ? '✓ Active' : 'Expired'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {sub.status === 'ACTIVE' && canAssign && (
                      <button
                        onClick={() => { setUpgradingSubscription(sub); setUpgradePlanId('') }}
                        className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-bold text-xs hover:bg-blue-100 transition-colors"
                      >
                        ⬆ Upgrade Plan
                      </button>
                    )}
                    {sub.status === 'EXPIRED' && canAssign && (
                      <button
                        onClick={() => openRenew(sub)}
                        className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg font-bold text-xs hover:bg-emerald-100 transition-colors"
                      >
                        ↻ Re-Subscribe / Renew
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {activeSubscriptions.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No active or past {memberLabel.toLowerCase()} subscriptions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 border-t border-gray-200 dark:border-[#2a2a4a]">
          <Pagination currentPage={subscriptionsPage} totalPages={subscriptionPages} totalItems={activeSubscriptions.length} perPage={pageSize} onPageChange={setSubscriptionsPage} itemLabel="subscriptions" />
        </div>
      </div>}

      {/* Plans List */}
      {subscriptionTab === 'plans' && <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-gray-200 dark:border-[#2a2a4a] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-[#2a2a4a]">
          <h4 className="font-bold text-gray-900 dark:text-white text-base">⚙️ Available Subscription Plans</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 dark:bg-[#0f0f1a] text-gray-700 dark:text-gray-300 font-bold text-xs uppercase">
              <tr>
                <th className="px-4 py-3">Plan Name</th>
                <th className="px-4 py-3">Max Books</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#2a2a4a]">
              {paginatedPlans.map(p => (
                <tr key={p.subscription_plan_id} className="hover:bg-gray-50 dark:hover:bg-[#0f0f1a]">
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{p.plan_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{p.max_books} books</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{p.duration_months} months</td>
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">₹{p.price}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className={`px-2 py-1 rounded-full font-bold ${p.is_active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'}`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {canEdit && (
                        <button
                          onClick={() => {
                            setEditing(p.subscription_plan_id)
                            setFormData({
                              plan_name: p.plan_name || '',
                              plan_code: p.plan_code || '',
                              max_books: p.max_books || 1,
                              duration_months: p.duration_months || 3,
                              price: p.price || '',
                              description: p.description || ''
                            })
                            setShowForm(true)
                          }}
                          className="px-3 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(p.subscription_plan_id)}
                          className="px-3 py-1 text-xs font-semibold bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-200 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {plans.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No subscription plans found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 border-t border-gray-200 dark:border-[#2a2a4a]">
          <Pagination currentPage={plansPage} totalPages={planPages} totalItems={plans.length} perPage={pageSize} onPageChange={setPlansPage} itemLabel="plans" />
        </div>
      </div>}
    </div>
  )
}

export default Subscriptions
