import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Pagination from '../components/common/Pagination'
import { useAppSettings } from '../context/AppSettingsContext'
import { PageHeader, Button, IconButton, Badge, EmptyState, LoadingState, ColumnVisibilityMenu, useColumnVisibility, SortableTh, useSortableData } from '../components/ui'
import {
  Plus, X, CheckCircle2, XCircle, Ticket, Settings, PlusCircle, ArrowUpCircle,
  RotateCcw, Pencil, Trash2, ClipboardList, Info
} from 'lucide-react'

const SUBSCRIPTION_RECORD_COLUMNS = [
  { key: 'member_id', label: 'Member ID' },
  { key: 'member_name', label: 'Member Name', locked: true },
  { key: 'plan', label: 'Plan' },
  { key: 'start_date', label: 'Start Date' },
  { key: 'end_date', label: 'End Date' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', locked: true },
]

const SUBSCRIPTION_PLAN_COLUMNS = [
  { key: 'plan_name', label: 'Plan Name', locked: true },
  { key: 'max_books', label: 'Max Books' },
  { key: 'duration', label: 'Duration' },
  { key: 'price', label: 'Price' },
  { key: 'subscription_fee', label: 'Subscription Fee' },
  { key: 'fixed_deposit', label: 'Fixed Deposit' },
  { key: 'total_amount', label: 'Total Amount' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', locked: true },
]

function Subscriptions() {
  const { user, hasPermission } = useAuth()
  const { memberLabel, membersLabel } = useAppSettings()
  const { isVisible: isSubVisible, toggle: toggleSubColumn, reset: resetSubColumns, hiddenCount: hiddenSubColumns } = useColumnVisibility('subscriptions-records', SUBSCRIPTION_RECORD_COLUMNS)
  const { isVisible: isPlanVisible, toggle: togglePlanColumn, reset: resetPlanColumns, hiddenCount: hiddenPlanColumns } = useColumnVisibility('subscriptions-plans', SUBSCRIPTION_PLAN_COLUMNS)
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
  const [renewData, setRenewData] = useState({ plan_id: '', amount: '', payment_method: 'CASH' })
  const [renewBreakdown, setRenewBreakdown] = useState(null)
  const [renewBreakdownLoading, setRenewBreakdownLoading] = useState(false)
  const [upgradePlanId, setUpgradePlanId] = useState('')
  const [subscriptionsPage, setSubscriptionsPage] = useState(1)
  const [plansPage, setPlansPage] = useState(1)
  const [subscriptionTab, setSubscriptionTab] = useState('assign')
  const pageSize = 10
  const [assignData, setAssignData] = useState({
    student_id: '',
    plan_id: '',
    payment_method: 'CASH',
    notes: ''
  })
  const [assignBreakdown, setAssignBreakdown] = useState(null)
  const [assignBreakdownLoading, setAssignBreakdownLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [formData, setFormData] = useState({
    plan_name: '',
    plan_code: '',
    max_books: 1,
    duration_months: 3,
    price: '',
    subscription_fee: '',
    fixed_deposit: '',
    total_amount: '',
    description: ''
  })

  const canCreate = hasPermission('subscription.create') || user?.role === 'ADMIN'
  const canEdit = hasPermission('subscription.edit') || user?.role === 'ADMIN'
  const canDelete = hasPermission('subscription.delete') || user?.role === 'ADMIN'
  const canAssign = hasPermission('subscription.create') || user?.role === 'ADMIN'
  const {
    sortedItems: sortedSubscriptions,
    requestSort: requestSubscriptionSort,
    directionFor: subscriptionDirectionFor
  } = useSortableData(activeSubscriptions, null, (row, key) => {
    if (key === 'member_id') return row.student_uid
    if (key === 'member_name') return row.student_name
    if (key === 'plan') return row.plan?.plan_name
    return row[key]
  })
  const {
    sortedItems: sortedPlans,
    requestSort: requestPlanSort,
    directionFor: planDirectionFor
  } = useSortableData(plans, null, (row, key) => {
    if (key === 'duration') return row.duration_months
    if (key === 'status') return row.is_active
    return row[key]
  })
  const subscriptionPages = Math.max(1, Math.ceil(sortedSubscriptions.length / pageSize))
  const planPages = Math.max(1, Math.ceil(sortedPlans.length / pageSize))
  const paginatedSubscriptions = sortedSubscriptions.slice((subscriptionsPage - 1) * pageSize, subscriptionsPage * pageSize)
  const paginatedPlans = sortedPlans.slice((plansPage - 1) * pageSize, plansPage * pageSize)

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

  useEffect(() => {
    if (assignData.student_id && assignData.plan_id) {
      let cancelled = false
      setAssignBreakdownLoading(true)
      api.get('/subscriptions/calculate-breakdown', {
        params: { student_id: assignData.student_id, plan_id: assignData.plan_id }
      }).then((res) => {
        if (!cancelled) setAssignBreakdown(res.data)
      }).catch((err) => {
        console.error('Error calculating breakdown:', err)
        if (!cancelled) setAssignBreakdown(null)
      }).finally(() => {
        if (!cancelled) setAssignBreakdownLoading(false)
      })
      return () => { cancelled = true }
    } else {
      setAssignBreakdown(null)
    }
  }, [assignData.student_id, assignData.plan_id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fee = parseFloat(formData.subscription_fee) || 0
    const dep = parseFloat(formData.fixed_deposit) || 0
    const total = parseFloat(formData.total_amount) || (fee + dep)
    if (Math.abs(total - (fee + dep)) > 0.01) {
      setMessage({ type: 'error', text: `Total Amount (₹${total.toFixed(2)}) must equal Subscription Fee (₹${fee.toFixed(2)}) + Fixed Deposit (₹${dep.toFixed(2)}) = ₹${(fee + dep).toFixed(2)}` })
      return
    }
    try {
      const payload = {
        ...formData,
        subscription_fee: fee,
        fixed_deposit: dep,
        total_amount: total
      }
      if (editing) {
        await api.put(`/subscriptions/plans/${editing}`, formData)
        await api.put(`/subscriptions/plans/${editing}`, payload)
      } else {
        await api.post('/subscriptions/plans', formData)
        await api.post('/subscriptions/plans', payload)
      }
      setShowForm(false)
      setEditing(null)
      setFormData({
        plan_name: '',
        plan_code: '',
        max_books: 1,
        duration_months: 3,
        price: '',
        subscription_fee: '',
        fixed_deposit: '',
        total_amount: '',
        description: ''
      })
      await loadData()
      setMessage({ type: 'success', text: 'Plan saved successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: err.data?.error || err.response?.data?.error || err.message || 'Error saving plan' })
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return
    try {
      await api.delete(`/subscriptions/plans/${id}`)
      await loadData()
      setMessage({ type: 'success', text: 'Plan deleted successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: err.data?.error || err.response?.data?.error || err.message || 'Error deleting plan' })
    }
  }

  const handleAssign = async (e) => {
    e.preventDefault()
    if (!assignData.student_id || !assignData.plan_id) {
      setMessage({ type: 'error', text: 'Please select both student and plan.' })
      return
    }
    try {
      await api.post('/subscriptions/assign', { ...assignData, academic_year_id: academicYearId })
      setMessage({ type: 'success', text: 'Subscription assigned successfully!' })
      setAssignData({ student_id: '', plan_id: '' })
      setAssignData({ student_id: '', plan_id: '', payment_method: 'CASH', notes: '' })
      setAssignBreakdown(null)
      await loadData()
      setTimeout(() => setMessage(null), 4000)
    } catch (err) {
      setMessage({ type: 'error', text: err.data?.error || err.response?.data?.error || err.message || 'Error assigning subscription' })
    }
  }

  const openRenew = async (subscription) => {
    const planId = String(subscription.plan?.subscription_plan_id || subscription.subscription_plan_id || (plans[0]?.subscription_plan_id ?? ''))
    setRenewingSubscription(subscription)
    setRenewData({ plan_id: planId, amount: '', payment_method: 'CASH' })
    if (subscription.student_id && planId) {
      try {
        setRenewBreakdownLoading(true)
        const res = await api.get('/subscriptions/calculate-breakdown', {
          params: { student_id: subscription.student_id, plan_id: Number(planId) }
        })
        setRenewBreakdown(res.data)
        setRenewData({ plan_id: planId, amount: String(res.data.total_payable), payment_method: 'CASH' })
      } catch (err) {
        console.error('Error fetching renewal breakdown:', err)
      } finally {
        setRenewBreakdownLoading(false)
      }
    }
  }

  const handleRenewPlanChange = async (newPlanId) => {
    setRenewData((prev) => ({ ...prev, plan_id: newPlanId }))
    if (renewingSubscription?.student_id && newPlanId) {
      try {
        setRenewBreakdownLoading(true)
        const res = await api.get('/subscriptions/calculate-breakdown', {
          params: { student_id: renewingSubscription.student_id, plan_id: Number(newPlanId) }
        })
        setRenewBreakdown(res.data)
        setRenewData((prev) => ({ ...prev, amount: String(res.data.total_payable) }))
      } catch (err) {
        console.error('Error fetching renewal breakdown:', err)
      } finally {
        setRenewBreakdownLoading(false)
      }
    }
  }

  const handleRenew = async (e) => {
    e.preventDefault()
    if (!renewingSubscription || !renewData.plan_id || !renewData.payment_method) {
      setMessage({ type: 'error', text: 'Please select a plan and payment method.' })
      return
    }
    try {
      await api.post(`/subscriptions/renew/${renewingSubscription.subscription_id}`, {
        plan_id: Number(renewData.plan_id), amount: Number(renewData.amount), payment_method: renewData.payment_method
      })
      setRenewingSubscription(null)
      setRenewData({ plan_id: '', amount: '', payment_method: '' })
      setRenewBreakdown(null)
      setRenewData({ plan_id: '', amount: '', payment_method: 'CASH' })
      setMessage({ type: 'success', text: 'Subscription renewed successfully!' })
      await loadData()
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: err.data?.error || err.response?.data?.error || err.message || 'Error renewing subscription' })
    }
  }

  const handleUpgrade = async () => {
    if (!upgradingSubscription || !upgradePlanId) {
      setMessage({ type: 'error', text: 'Please choose the plan to upgrade to.' })
      return
    }
    const selectedPlan = plans.find((plan) => plan.subscription_plan_id === Number(upgradePlanId))
    if (!window.confirm(`Upgrade ${upgradingSubscription.student_name} to ${selectedPlan?.plan_name}? The new plan starts today.`)) return

    try {
      await api.post(`/subscriptions/upgrade/${upgradingSubscription.subscription_id}`, { plan_id: Number(upgradePlanId) })
      setUpgradingSubscription(null)
      setUpgradePlanId('')
      setMessage({ type: 'success', text: 'Subscription upgraded successfully!' })
      await loadData()
      setTimeout(() => setMessage(null), 3000)
    } catch (err) {
      setMessage({ type: 'error', text: err.data?.error || err.response?.data?.error || err.message || 'Error upgrading subscription' })
    }
  }

  const subscriptionTabs = [
    { key: 'assign', label: 'Assign Subscription', icon: PlusCircle },
    { key: 'records', label: `${memberLabel} Subscriptions`, icon: Ticket },
    { key: 'plans', label: 'Subscription Plans', icon: Settings },
  ]

  if (loading) {
    return <LoadingState label="Loading subscriptions…" />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Library Subscriptions"
        description={`Manage library subscription plans and assign active subscriptions to eligible ${membersLabel}.`}
        actions={
          <>
            <label className="text-xs font-bold uppercase text-gray-600 dark:text-gray-300">Academic Year
              <select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} className="mt-1 block rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-[#17172a]">
                {academicYears.map((year) => <option key={year.academic_year_id} value={year.academic_year_id}>{year.year_name || year.year_code}</option>)}
              </select>
            </label>
            {canCreate && (
              <Button
                variant="primary"
                icon={showForm ? X : Plus}
                onClick={() => { setSubscriptionTab('plans'); setShowForm(!showForm); setEditing(null); setFormData({ plan_name: '', plan_code: '', max_books: 1, duration_months: 3, price: '', description: '' }) }}
              >
                {showForm ? 'Cancel' : 'Add Plan'}
              </Button>
            )}
          </>
        }
      />

      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-xl font-semibold shadow-sm ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'}`}>
          {message.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" /> : <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />}
          <p>{message.text}</p>
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1.5 dark:border-[#2a2a4a] dark:bg-[#1a1a2e]">
        {subscriptionTabs.map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" onClick={() => setSubscriptionTab(key)} className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold transition-colors ${subscriptionTab === key ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#2a2a4a]'}`}>
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {label}
          </button>
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

            {/* Fee, Deposit, and Total Amount */}
            <div className="rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-700 dark:text-gray-300 mb-1">
                    Subscription Fee (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.subscription_fee}
                    onChange={(e) => {
                      const fee = parseFloat(e.target.value) || 0
                      const dep = parseFloat(formData.fixed_deposit) || 0
                      setFormData({ ...formData, subscription_fee: e.target.value, total_amount: (fee + dep).toFixed(2) })
                    }}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-semibold"
                    required
                  />
                  <span className="text-[10px] text-gray-500">School revenue</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-700 dark:text-gray-300 mb-1">
                    Fixed Deposit (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.fixed_deposit}
                    onChange={(e) => {
                      const dep = parseFloat(e.target.value) || 0
                      const fee = parseFloat(formData.subscription_fee) || 0
                      setFormData({ ...formData, fixed_deposit: e.target.value, total_amount: (fee + dep).toFixed(2) })
                    }}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-semibold"
                    required
                  />
                  <span className="text-[10px] text-gray-500">Refundable balance</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-700 dark:text-gray-300 mb-1">
                    Total Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-bold"
                    required
                  />
                  <span className="text-[10px] text-gray-500">Fee + Deposit</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" variant="primary">
                {editing ? 'Update Plan' : 'Create Plan'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditing(null) }}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {subscriptionTab === 'records' && upgradingSubscription && (
        <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl p-6 border border-blue-200 dark:border-blue-900/60 shadow-sm">
          <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            <ArrowUpCircle className="h-5 w-5 text-blue-500" aria-hidden="true" /> Upgrade Subscription
          </h3>
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
            <Button variant="primary" onClick={handleUpgrade}>Confirm Upgrade</Button>
            <Button variant="secondary" onClick={() => { setUpgradingSubscription(null); setUpgradePlanId('') }}>Cancel</Button>
          </div>
        </div>
      )}

      {subscriptionTab === 'records' && renewingSubscription && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <form onSubmit={handleRenew} className="w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-[#2a2a4a] dark:bg-[#17172a]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-[#2a2a4a]">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-blue-500" /> Renew Subscription
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {renewingSubscription.student_name} ({renewingSubscription.student_uid})
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setRenewingSubscription(null); setRenewBreakdown(null) }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300">
              Subscription Plan
              <select
                required
                value={renewData.plan_id}
                onChange={(e) => handleRenewPlanChange(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-[#2a2a4a] dark:bg-[#0f0f1a]"
              >
                <option value="">-- Choose Plan --</option>
                {plans.filter((plan) => plan.is_active).map((plan) => (
                  <option key={plan.subscription_plan_id} value={plan.subscription_plan_id}>
                    {plan.plan_name} — ₹{plan.total_amount || plan.price} (Fee: ₹{plan.subscription_fee || 0}, Deposit: ₹{plan.fixed_deposit || 0})
                  </option>
                ))}
              </select>
            </label>

            {/* Live Financial Breakdown Card */}
            {renewBreakdownLoading ? (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#10101d] text-center text-xs text-gray-500">
                Calculating deposit carry-forward…
              </div>
            ) : renewBreakdown ? (
              <div className="rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 p-4 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center justify-between">
                  <span>Financial Breakdown</span>
                  <Badge tone={renewBreakdown.additional_deposit_required === 0 ? 'success' : 'warning'}>
                    {renewBreakdown.additional_deposit_required === 0 ? 'Deposit Carried Forward' : 'Deposit Top-up Required'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#121224] border border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400 block">Subscription Fee</span>
                    <span className="font-bold text-gray-900 dark:text-white text-sm">₹{renewBreakdown.subscription_fee.toFixed(2)}</span>
                    <span className="text-[10px] text-gray-400 block">Non-refundable</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#121224] border border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400 block">Plan Fixed Deposit</span>
                    <span className="font-bold text-gray-900 dark:text-white text-sm">₹{renewBreakdown.fixed_deposit.toFixed(2)}</span>
                    <span className="text-[10px] text-gray-400 block">Refundable balance</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#121224] border border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400 block">Current Deposit</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">₹{renewBreakdown.current_deposit_balance.toFixed(2)}</span>
                    <span className="text-[10px] text-gray-400 block">Carried: ₹{renewBreakdown.carried_forward_deposit.toFixed(2)}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#121224] border border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400 block">Add'l Deposit Needed</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">₹{renewBreakdown.additional_deposit_required.toFixed(2)}</span>
                    <span className="text-[10px] text-gray-400 block">To meet plan deposit</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-blue-100/70 dark:bg-blue-900/40 flex justify-between items-center text-sm font-bold text-blue-950 dark:text-blue-100">
                  <span>Total Amount Payable</span>
                  <span className="text-base text-blue-700 dark:text-blue-300">₹{renewBreakdown.total_payable.toFixed(2)}</span>
                </div>

                <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                  {renewBreakdown.additional_deposit_required === 0
                    ? `Current deposit balance (₹${renewBreakdown.current_deposit_balance.toFixed(2)}) is sufficient. Deposit is carried forward at ₹0 additional charge. Only the renewal fee is payable.`
                    : `Current deposit (₹${renewBreakdown.current_deposit_balance.toFixed(2)}) is below the required ₹${renewBreakdown.fixed_deposit.toFixed(2)}. Additional deposit of ₹${renewBreakdown.additional_deposit_required.toFixed(2)} will replenish it upon renewal.`}
                </p>
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300">
                Total Payable (₹)
                <input
                  type="number"
                  readOnly
                  value={renewBreakdown ? renewBreakdown.total_payable : renewData.amount}
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-gray-50 dark:bg-[#10101d] px-3 py-2 text-sm font-bold text-gray-900 dark:text-white"
                />
              </label>

              <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300">
                Payment Method *
                <select
                  required
                  value={renewData.payment_method}
                  onChange={(e) => setRenewData({ ...renewData, payment_method: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm dark:border-[#2a2a4a] dark:bg-[#0f0f1a]"
                >
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-[#2a2a4a]">
              <Button type="button" variant="secondary" onClick={() => { setRenewingSubscription(null); setRenewBreakdown(null) }}>Cancel</Button>
              <Button type="submit" variant="success" disabled={renewBreakdownLoading || !renewData.plan_id}>Confirm Renewal</Button>
            </div>
          </form>
        </div>
      )}

      {/* Assign Subscription Section */}
      {subscriptionTab === 'assign' && canAssign && (
        <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl p-6 border border-gray-200 dark:border-[#2a2a4a] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-500" aria-hidden="true" /> Assign New Subscription
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Only displaying {membersLabel} with Library Access who have NO active subscription
            </span>
          </div>

          <form onSubmit={handleAssign} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 dark:text-gray-300 mb-1">
                  Select {memberLabel} ({eligibleStudents.length} Eligible) *
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
                  Select Subscription Plan *
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
                      {p.plan_name} — Total ₹{p.total_amount || p.price} (Fee: ₹{p.subscription_fee || 0}, Deposit: ₹{p.fixed_deposit || 0}, {p.duration_months}m)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 dark:text-gray-300 mb-1">
                  Payment Method *
                </label>
                <select
                  value={assignData.payment_method}
                  onChange={(e) => setAssignData({ ...assignData, payment_method: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                  required
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CARD">Card</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            {/* Dynamic Financial Breakdown Card for Assign */}
            {assignBreakdownLoading ? (
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#10101d] text-center text-xs text-gray-500">
                Calculating deposit carry-forward and amount payable…
              </div>
            ) : assignBreakdown ? (
              <div className="rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center justify-between">
                  <span>Subscription Payment Breakdown</span>
                  <Badge tone={assignBreakdown.additional_deposit_required === 0 ? 'success' : 'primary'}>
                    {assignBreakdown.additional_deposit_required === 0 ? 'Full Deposit Carried Forward' : 'New Deposit Collection'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white dark:bg-[#121224] border border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400 block">Subscription Fee</span>
                    <span className="font-bold text-gray-900 dark:text-white text-base">₹{assignBreakdown.subscription_fee.toFixed(2)}</span>
                    <span className="text-[10px] text-gray-400">School revenue</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-[#121224] border border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400 block">Required Deposit</span>
                    <span className="font-bold text-gray-900 dark:text-white text-base">₹{assignBreakdown.fixed_deposit.toFixed(2)}</span>
                    <span className="text-[10px] text-gray-400">Fixed for plan</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-[#121224] border border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400 block">Current Deposit</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">₹{assignBreakdown.current_deposit_balance.toFixed(2)}</span>
                    <span className="text-[10px] text-gray-400">Existing balance</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-[#121224] border border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400 block">Deposit to Pay</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400 text-base">₹{assignBreakdown.additional_deposit_required.toFixed(2)}</span>
                    <span className="text-[10px] text-gray-400">Top-up needed</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex justify-between items-center font-bold text-emerald-900 dark:text-emerald-200">
                  <span className="text-sm">Total Amount Payable (Fee + Deposit to Pay)</span>
                  <span className="text-lg text-emerald-700 dark:text-emerald-300">₹{assignBreakdown.total_payable.toFixed(2)}</span>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {assignBreakdown.current_deposit_balance > 0
                    ? `Existing balance of ₹${assignBreakdown.current_deposit_balance.toFixed(2)} will be carried forward. Remaining deposit balance after payment: ₹${assignBreakdown.deposit_balance_after.toFixed(2)}.`
                    : `Initial fixed deposit of ₹${assignBreakdown.additional_deposit_required.toFixed(2)} will be deposited into the student's library deposit account.`}
                </p>
              </div>
            ) : null}

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="success"
                size="lg"
                disabled={eligibleStudents.length === 0 || !assignData.student_id || !assignData.plan_id || assignBreakdownLoading}
              >
                Assign Subscription {assignBreakdown ? `(Pay ₹${assignBreakdown.total_payable.toFixed(2)})` : ''}
              </Button>
            </div>
          </form>
          {eligibleStudents.length === 0 && (
            <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 mt-2">
              <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              No {membersLabel} are currently eligible for a new subscription. {membersLabel} with active subscriptions cannot be assigned duplicates until their active subscription expires.
            </p>
          )}
        </div>
      )}

      {/* Active & Past Subscriptions List */}
      {subscriptionTab === 'records' && <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-gray-200 dark:border-[#2a2a4a] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-[#2a2a4a] flex justify-between items-center">
          <h4 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white text-base">
            <Ticket className="h-4 w-4 text-blue-500" aria-hidden="true" /> {memberLabel} Subscriptions Status
          </h4>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Records: {activeSubscriptions.length}</span>
            <ColumnVisibilityMenu columns={SUBSCRIPTION_RECORD_COLUMNS} isVisible={isSubVisible} onToggle={toggleSubColumn} onReset={resetSubColumns} hiddenCount={hiddenSubColumns} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 dark:bg-[#0f0f1a] text-gray-700 dark:text-gray-300 font-bold text-xs uppercase">
              <tr>
                <SortableTh sortKey="member_id" direction={subscriptionDirectionFor('member_id')} onSort={requestSubscriptionSort} className={`px-4 py-3 ${isSubVisible('member_id') ? '' : 'hidden'}`}>{memberLabel} ID</SortableTh>
                <SortableTh sortKey="member_name" direction={subscriptionDirectionFor('member_name')} onSort={requestSubscriptionSort} className={`px-4 py-3 ${isSubVisible('member_name') ? '' : 'hidden'}`}>{memberLabel} Name</SortableTh>
                <SortableTh sortKey="plan" direction={subscriptionDirectionFor('plan')} onSort={requestSubscriptionSort} className={`px-4 py-3 ${isSubVisible('plan') ? '' : 'hidden'}`}>Plan</SortableTh>
                <SortableTh sortKey="start_date" direction={subscriptionDirectionFor('start_date')} onSort={requestSubscriptionSort} className={`px-4 py-3 ${isSubVisible('start_date') ? '' : 'hidden'}`}>Start Date</SortableTh>
                <SortableTh sortKey="end_date" direction={subscriptionDirectionFor('end_date')} onSort={requestSubscriptionSort} className={`px-4 py-3 ${isSubVisible('end_date') ? '' : 'hidden'}`}>End Date</SortableTh>
                <SortableTh sortKey="status" direction={subscriptionDirectionFor('status')} onSort={requestSubscriptionSort} className={`px-4 py-3 ${isSubVisible('status') ? '' : 'hidden'}`}>Status</SortableTh>
                <th className={`px-4 py-3 text-right ${isSubVisible('actions') ? '' : 'hidden'}`}>Actions</th>
              </tr>
            </thead>
            {activeSubscriptions.length > 0 && (
              <tbody className="divide-y divide-gray-200 dark:divide-[#2a2a4a]">
                {paginatedSubscriptions.map((sub) => (
                  <tr key={sub.subscription_id} className="hover:bg-blue-50/20 dark:hover:bg-[#0f0f1a] transition-colors">
                    <td className={`px-4 py-3 font-mono text-xs font-bold text-gray-700 dark:text-gray-300 ${isSubVisible('member_id') ? '' : 'hidden'}`}>
                      {sub.student_uid}
                    </td>
                    <td className={`px-4 py-3 font-bold text-gray-900 dark:text-white ${isSubVisible('member_name') ? '' : 'hidden'}`}>
                      {sub.student_name}
                    </td>
                    <td className={`px-4 py-3 font-medium text-gray-800 dark:text-gray-200 ${isSubVisible('plan') ? '' : 'hidden'}`}>
                      {sub.plan?.plan_name || 'Standard Plan'}
                    </td>
                    <td className={`px-4 py-3 text-xs text-gray-600 dark:text-gray-400 ${isSubVisible('start_date') ? '' : 'hidden'}`}>
                      {sub.start_date}
                    </td>
                    <td className={`px-4 py-3 text-xs text-gray-600 dark:text-gray-400 ${isSubVisible('end_date') ? '' : 'hidden'}`}>
                      {sub.end_date}
                    </td>
                    <td className={`px-4 py-3 text-xs ${isSubVisible('status') ? '' : 'hidden'}`}>
                      <Badge tone={sub.status === 'ACTIVE' ? 'success' : 'danger'} icon={sub.status === 'ACTIVE' ? CheckCircle2 : XCircle}>
                        {sub.status === 'ACTIVE' ? 'Active' : 'Expired'}
                      </Badge>
                    </td>
                    <td className={`px-4 py-3 text-right ${isSubVisible('actions') ? '' : 'hidden'}`}>
                      {sub.status === 'ACTIVE' && canAssign && (
                        <button
                          onClick={() => { setUpgradingSubscription(sub); setUpgradePlanId('') }}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-bold text-xs hover:bg-blue-100 transition-colors"
                        >
                          <ArrowUpCircle className="h-3.5 w-3.5" aria-hidden="true" /> Upgrade Plan
                        </button>
                      )}
                      {sub.status === 'EXPIRED' && canAssign && (
                        <button
                          onClick={() => openRenew(sub)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg font-bold text-xs hover:bg-emerald-100 transition-colors"
                        >
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Re-Subscribe / Renew
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
          {activeSubscriptions.length === 0 && (
            <EmptyState icon={Ticket} title="No subscriptions found" description={`No active or past ${memberLabel.toLowerCase()} subscriptions found.`} />
          )}
        </div>
        <div className="px-5 py-4 border-t border-gray-200 dark:border-[#2a2a4a]">
          <Pagination currentPage={subscriptionsPage} totalPages={subscriptionPages} totalItems={activeSubscriptions.length} perPage={pageSize} onPageChange={setSubscriptionsPage} itemLabel="subscriptions" />
        </div>
      </div>}

      {/* Plans List */}
      {subscriptionTab === 'plans' && <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl border border-gray-200 dark:border-[#2a2a4a] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-[#2a2a4a] flex justify-between items-center">
          <h4 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white text-base">
            <Settings className="h-4 w-4 text-blue-500" aria-hidden="true" /> Available Subscription Plans
          </h4>
          <ColumnVisibilityMenu columns={SUBSCRIPTION_PLAN_COLUMNS} isVisible={isPlanVisible} onToggle={togglePlanColumn} onReset={resetPlanColumns} hiddenCount={hiddenPlanColumns} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 dark:bg-[#0f0f1a] text-gray-700 dark:text-gray-300 font-bold text-xs uppercase">
              <tr>
                <SortableTh sortKey="plan_name" direction={planDirectionFor('plan_name')} onSort={requestPlanSort} className={`px-4 py-3 ${isPlanVisible('plan_name') ? '' : 'hidden'}`}>Plan Name</SortableTh>
                <SortableTh sortKey="max_books" direction={planDirectionFor('max_books')} onSort={requestPlanSort} className={`px-4 py-3 ${isPlanVisible('max_books') ? '' : 'hidden'}`}>Max Books</SortableTh>
                <SortableTh sortKey="duration" direction={planDirectionFor('duration')} onSort={requestPlanSort} className={`px-4 py-3 ${isPlanVisible('duration') ? '' : 'hidden'}`}>Duration</SortableTh>
                <SortableTh sortKey="price" direction={planDirectionFor('price')} onSort={requestPlanSort} className={`px-4 py-3 ${isPlanVisible('price') ? '' : 'hidden'}`}>Price</SortableTh>
                <SortableTh sortKey="subscription_fee" direction={planDirectionFor('subscription_fee')} onSort={requestPlanSort} className={`px-4 py-3 ${isPlanVisible('subscription_fee') ? '' : 'hidden'}`}>Subscription Fee</SortableTh>
                <SortableTh sortKey="fixed_deposit" direction={planDirectionFor('fixed_deposit')} onSort={requestPlanSort} className={`px-4 py-3 ${isPlanVisible('fixed_deposit') ? '' : 'hidden'}`}>Fixed Deposit</SortableTh>
                <SortableTh sortKey="total_amount" direction={planDirectionFor('total_amount')} onSort={requestPlanSort} className={`px-4 py-3 ${isPlanVisible('total_amount') ? '' : 'hidden'}`}>Total Amount</SortableTh>
                <SortableTh sortKey="status" direction={planDirectionFor('status')} onSort={requestPlanSort} className={`px-4 py-3 ${isPlanVisible('status') ? '' : 'hidden'}`}>Status</SortableTh>
                <th className={`px-4 py-3 text-right ${isPlanVisible('actions') ? '' : 'hidden'}`}>Actions</th>
              </tr>
            </thead>
            {plans.length > 0 && (
              <tbody className="divide-y divide-gray-200 dark:divide-[#2a2a4a]">
                {paginatedPlans.map(p => (
                  <tr key={p.subscription_plan_id} className="hover:bg-gray-50 dark:hover:bg-[#0f0f1a]">
                    <td className={`px-4 py-3 font-bold text-gray-900 dark:text-white ${isPlanVisible('plan_name') ? '' : 'hidden'}`}>{p.plan_name}</td>
                    <td className={`px-4 py-3 text-sm text-gray-600 dark:text-gray-400 ${isPlanVisible('max_books') ? '' : 'hidden'}`}>{p.max_books} books</td>
                    <td className={`px-4 py-3 text-sm text-gray-600 dark:text-gray-400 ${isPlanVisible('duration') ? '' : 'hidden'}`}>{p.duration_months} months</td>
                    <td className={`px-4 py-3 font-bold text-gray-900 dark:text-white ${isPlanVisible('price') ? '' : 'hidden'}`}>₹{p.price}</td>
                    <td className={`px-4 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400 ${isPlanVisible('subscription_fee') ? '' : 'hidden'}`}>₹{p.subscription_fee != null ? Number(p.subscription_fee).toLocaleString('en-IN') : '0'}</td>
                    <td className={`px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400 ${isPlanVisible('fixed_deposit') ? '' : 'hidden'}`}>₹{p.fixed_deposit != null ? Number(p.fixed_deposit).toLocaleString('en-IN') : '0'}</td>
                    <td className={`px-4 py-3 font-bold text-gray-900 dark:text-white ${isPlanVisible('total_amount') ? '' : 'hidden'}`}>₹{p.total_amount != null ? Number(p.total_amount).toLocaleString('en-IN') : Number(p.price || 0).toLocaleString('en-IN')}</td>
                    <td className={`px-4 py-3 text-xs ${isPlanVisible('status') ? '' : 'hidden'}`}>
                      <Badge tone={p.is_active ? 'success' : 'neutral'}>{p.is_active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className={`px-4 py-3 text-right ${isPlanVisible('actions') ? '' : 'hidden'}`}>
                      <div className="flex justify-end gap-1">
                        {canEdit && (
                          <IconButton
                            icon={Pencil}
                            label="Edit plan"
                            variant="subtle"
                            size="sm"
                            onClick={() => {
                              setEditing(p.subscription_plan_id)
                              setFormData({
                                plan_name: p.plan_name || '',
                                plan_code: p.plan_code || '',
                                max_books: p.max_books || 1,
                                duration_months: p.duration_months || 3,
                                price: p.price || '',
                                subscription_fee: p.subscription_fee != null ? p.subscription_fee : '',
                                fixed_deposit: p.fixed_deposit != null ? p.fixed_deposit : '',
                                total_amount: p.total_amount != null ? p.total_amount : p.price || '',
                                description: p.description || ''
                              })
                              setShowForm(true)
                            }}
                          />
                        )}
                        {canDelete && (
                          <IconButton
                            icon={Trash2}
                            label="Delete plan"
                            variant="subtle"
                            size="sm"
                            className="text-rose-600 hover:bg-rose-100 dark:text-rose-400 dark:hover:bg-rose-900/30"
                            onClick={() => handleDelete(p.subscription_plan_id)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
          {plans.length === 0 && (
            <EmptyState icon={Settings} title="No subscription plans found" />
          )}
        </div>
        <div className="px-5 py-4 border-t border-gray-200 dark:border-[#2a2a4a]">
          <Pagination currentPage={plansPage} totalPages={planPages} totalItems={plans.length} perPage={pageSize} onPageChange={setPlansPage} itemLabel="plans" />
        </div>
      </div>}
    </div>
  )
}

export default Subscriptions
