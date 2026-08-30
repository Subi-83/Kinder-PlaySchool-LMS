import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Pagination from '../components/common/Pagination'
import { useAppSettings } from '../context/AppSettingsContext'

const tabs = [
  { id: 'stock', label: 'Stock Summary', perm: 'report.stock' },
  { id: 'members', label: 'Members Summary', perm: 'report.member' },
  { id: 'students-detailed', label: 'JK Members Report', perm: 'report.member' },
  { id: 'subscription-payments', label: 'Subscription Payments', perm: 'report.financial' },
  { id: 'books-detailed', label: 'Books Report', perm: 'report.stock' },
  { id: 'ebooks-detailed', label: 'E-books Report', perm: 'report.stock' },
  { id: 'fines', label: 'Fines Report', perm: 'report.fine' },
  { id: 'financial', label: 'Financial Report', perm: 'report.financial' },
  { id: 'issue-return', label: 'Issue / Return Report', perm: 'report.issue_return' }
]

const pretty = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

const moneyKeys = ['fines', 'financial', 'students-detailed', 'subscription-payments']
const countFields = new Set([
  'low_deposits', 'total_students', 'library_access_enabled', 'active_subscriptions',
  'pending_subscriptions', 'total_payments', 'total_books', 'available', 'issued',
  'damaged', 'lost', 'reserved', 'total_titles', 'total_copies', 'available_copies',
  'issued_copies', 'damaged_copies', 'lost_copies', 'ebook_copies', 'total_records', 'overdue',
  'active_issues', 'today_issues', 'today_returns', 'weekly_issues', 'weekly_returns',
  'monthly_issues', 'monthly_returns'
])

const isMoneyField = (tabId, key) =>
  !countFields.has(key) && moneyKeys.includes(tabId) && /(fine|deposit|damage|balance|collection|lost|amount|payment|price|charge)/i.test(key)

const formatVal = (tabId, key, value) => {
  if (typeof value === 'number') {
    if (key.includes('percentage')) return `${value}%`
    if (isMoneyField(tabId, key)) return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    return value.toLocaleString('en-IN')
  }
  return String(value ?? '-')
}

const download = (body, name, type) => {
  const url = URL.createObjectURL(new Blob([body], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

function PaginatedReportTable({ title, rows, activeTab, selectedFields, onToggleField }) {
  const [page, setPage] = useState(1)
  const perPage = 10
  const totalPages = Math.max(1, Math.ceil(rows.length / perPage))
  const visibleRows = rows.slice((page - 1) * perPage, page * perPage)

  useEffect(() => setPage(1), [rows, activeTab])

  return (
    <section className="space-y-3">
      <h3 className="font-bold text-gray-900 dark:text-white text-base">{pretty(title)} ({rows.length} records)</h3>
      <div className="rounded-xl border border-gray-200 dark:border-[#292944] bg-white dark:bg-[#10101d] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 dark:bg-[#22223a] text-gray-700 dark:text-gray-300 font-bold text-xs uppercase">
              <tr>{rows[0] && Object.keys(rows[0]).map(head => (
                <th className="px-5 py-3.5" key={head}>
                  <label className="inline-flex items-center gap-2 cursor-pointer whitespace-nowrap">
                    <input type="checkbox" checked={selectedFields.includes(head)} onChange={() => onToggleField(head)} className="rounded border-gray-400 text-blue-600 focus:ring-blue-500" />
                    {pretty(head)}
                  </label>
                </th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#292944]">
              {visibleRows.map((row, index) => (
                <tr key={(page - 1) * perPage + index} className="hover:bg-blue-50/30 dark:hover:bg-[#19192e]">
                  {Object.entries(row).map(([cellKey, value]) => (
                    <td className={`px-5 py-3.5 text-gray-700 dark:text-gray-300 ${typeof value === 'number' ? 'text-right font-medium' : ''}`} key={cellKey}>
                      {typeof value === 'number' && /(amount|fine|charge|balance|deposit)/.test(cellKey) ? `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : String(value ?? '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 border-t border-gray-200 dark:border-[#292944]">
          <Pagination currentPage={page} totalPages={totalPages} totalItems={rows.length} perPage={perPage} onPageChange={setPage} itemLabel="records" />
        </div>
      </div>
    </section>
  )
}

function Reports() {
  const { schoolName } = useAppSettings()
  const { user, hasPermission } = useAuth()
  const [active, setActive] = useState('students-detailed')
  const [data, setData] = useState({})
  const [extraData, setExtraData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [metricsPage, setMetricsPage] = useState(1)
  const [selectedMetrics, setSelectedMetrics] = useState([])
  const [selectedListFields, setSelectedListFields] = useState({})
  const [academicYears, setAcademicYears] = useState([])
  const [academicYearId, setAcademicYearId] = useState('')
  const [studentReportGroup, setStudentReportGroup] = useState('personal')
  const [studentSearch, setStudentSearch] = useState('')

  // Filter state for Students Detailed Report
  const [studentLevelFilter, setStudentLevelFilter] = useState('ALL')
  const [libraryAccessFilter, setLibraryAccessFilter] = useState('ALL')
  const [subStatusFilter, setSubStatusFilter] = useState('ALL')
  const [depositStatusFilter, setDepositStatusFilter] = useState('ALL')

  // Filter state for Books Detailed Report
  const [bookLevelFilter, setBookLevelFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [authorFilter, setAuthorFilter] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL')
  const [bookStatusFilter, setBookStatusFilter] = useState('ALL')
  const [ebookSearch, setEbookSearch] = useState('')

  // Date Range Filters
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')

  // Dynamic filter dropdown options
  const [programmes, setProgrammes] = useState([])
  const [bookLevels, setBookLevels] = useState([])
  const [bookCategories, setBookCategories] = useState([])

  useEffect(() => {
    // Load metadata options for filters
    const loadFilterMetadata = async () => {
      try {
        const [progRes, lvlRes, catRes, yearRes] = await Promise.all([
          api.get('/students/programmes').catch(() => ({ data: [] })),
          api.get('/books/levels').catch(() => ({ data: [] })),
          api.get('/books/categories').catch(() => ({ data: [] })),
          api.get('/students/academic-years').catch(() => ({ data: [] }))
        ])
        setProgrammes(progRes.data || [])
        setBookLevels(lvlRes.data || [])
        setBookCategories(catRes.data || [])
        setAcademicYears(yearRes.data || [])
        const currentYear = (yearRes.data || []).find((year) => year.is_current) || yearRes.data?.[0]
        setAcademicYearId(currentYear?.academic_year_id ? String(currentYear.academic_year_id) : '')
      } catch (err) {
        console.error('Error loading filter options:', err)
      }
    }
    loadFilterMetadata()
  }, [])

  const visible = tabs.filter((t) => user?.role === 'ADMIN' || hasPermission(t.perm))
  const tab = visible.find((t) => t.id === active) || visible[0]

  const load = async () => {
    if (!tab) return
    setLoading(true)
    setError('')
    try {
      let url = `/reports/${tab.id}`
      const params = new URLSearchParams()
      if (academicYearId) params.append('academic_year_id', academicYearId)

      if (tab.id === 'students-detailed') {
        if (studentLevelFilter !== 'ALL') params.append('level', studentLevelFilter)
        if (libraryAccessFilter !== 'ALL') params.append('library_access', libraryAccessFilter)
        if (subStatusFilter !== 'ALL') params.append('subscription_status', subStatusFilter)
        if (depositStatusFilter !== 'ALL') params.append('deposit_status', depositStatusFilter)
        if (startDateFilter) params.append('start_date', startDateFilter)
        if (endDateFilter) params.append('end_date', endDateFilter)
        if (studentSearch.trim()) params.append('search', studentSearch.trim())
      } else if (tab.id === 'books-detailed') {
        if (bookLevelFilter !== 'ALL') params.append('level', bookLevelFilter)
        if (categoryFilter !== 'ALL') params.append('category', categoryFilter)
        if (authorFilter.trim()) params.append('author', authorFilter.trim())
        if (availabilityFilter !== 'ALL') params.append('availability', availabilityFilter)
        if (bookStatusFilter !== 'ALL') params.append('book_status', bookStatusFilter)
        if (startDateFilter) params.append('start_date', startDateFilter)
        if (endDateFilter) params.append('end_date', endDateFilter)
      } else if (tab.id === 'ebooks-detailed') {
        if (ebookSearch.trim()) params.append('search', ebookSearch.trim())
      }

      const queryString = params.toString()
      if (queryString) url += `?${queryString}`

      const res = await api.get(url)
      setData(res.data || {})

      // Fetch supplementary detailed table rows for legacy reports
      setExtraData([])
      if (tab.id === 'stock') {
        try {
          const pop = await api.get('/reports/popular-books')
          if (Array.isArray(pop.data) && pop.data.length > 0) setExtraData([['Popular Books', pop.data]])
        } catch (_) {}
      } else if (tab.id === 'members') {
        try {
          const top = await api.get('/reports/top-students')
          if (Array.isArray(top.data) && top.data.length > 0) setExtraData([['Top Active Readers', top.data]])
        } catch (_) {}
      } else if (tab.id === 'issue-return') {
        try {
          const alerts = await api.get('/reports/dashboard-alerts')
          const alertTables = []
          if (alerts.data?.overdue_books?.length > 0) alertTables.push(['Current Overdue Books', alerts.data.overdue_books])
          if (alerts.data?.low_deposits?.length > 0) alertTables.push(['Low Deposit Accounts', alerts.data.low_deposits])
          setExtraData(alertTables)
        } catch (_) {}
      }
    } catch (e) {
      setData({})
      setError(e.data?.error || e.message || 'Could not load report.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [
    active,
    studentLevelFilter,
    libraryAccessFilter,
    subStatusFilter,
    depositStatusFilter,
    bookLevelFilter,
    categoryFilter,
    authorFilter,
    availabilityFilter,
    bookStatusFilter,
    ebookSearch,
    startDateFilter,
    endDateFilter
    , academicYearId, studentSearch
  ]) // eslint-disable-line react-hooks/exhaustive-deps

  const scalar = useMemo(() => Object.entries(data).filter(([, value]) => !Array.isArray(value)), [data])
  const lists = useMemo(() => {
    const rawLists = Object.entries(data).filter(([, value]) => Array.isArray(value))
    if (active === 'students-detailed') {
      const students = data.students_list || []
      const groupFields = {
        personal: ['student_id', 'student_name', 'date_of_birth', 'gender', 'school', 'mother_name', 'mother_phone', 'father_name', 'father_phone'],
        programme: ['student_id', 'student_name', 'academic_year', 'programme', 'grade', 'roll_number', 'library_access'],
        deposits: ['student_id', 'student_name', 'academic_year', 'deposit_amount', 'outstanding_amount', 'deposit_status'],
        subscriptions: ['student_id', 'student_name', 'academic_year', 'subscription_plan', 'subscription_status', 'subscription_start_date', 'subscription_end_date', 'subscription_amount']
      }
      const fields = groupFields[studentReportGroup]
      const groupStudents = studentReportGroup === 'deposits'
        ? students.filter((row) => row.subscription_status === 'Active')
        : students
      return [[`${studentReportGroup}_report`, groupStudents.map((row) => Object.fromEntries(fields.map((field) => [field, row[field]])))]]
    }
    return [...rawLists, ...extraData]
  }, [active, data, extraData, studentReportGroup])
  const metricsPerPage = 10
  const metricPages = Math.max(1, Math.ceil(scalar.length / metricsPerPage))
  const visibleMetrics = scalar.slice((metricsPage - 1) * metricsPerPage, metricsPage * metricsPerPage)

  useEffect(() => {
    setSelectedMetrics(scalar.map(([key]) => key))
    setSelectedListFields(Object.fromEntries(
      lists.map(([title, rows]) => [title, rows[0] ? Object.keys(rows[0]) : []])
    ))
  }, [active, data, extraData, studentReportGroup])

  useEffect(() => {
    setMetricsPage(1)
  }, [active, scalar.length])

  const toggleMetric = (key) => {
    setSelectedMetrics((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])
  }

  const toggleListField = (title, field) => {
    setSelectedListFields((current) => {
      const selected = current[title] || []
      return { ...current, [title]: selected.includes(field) ? selected.filter((item) => item !== field) : [...selected, field] }
    })
  }

  const generatedDateStr = useMemo(() => {
    return new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }, [active])
  const academicYearLabel = academicYears.find((year) => String(year.academic_year_id) === String(academicYearId))?.year_code || 'All Academic Years'

  const resetFilters = () => {
    setStudentSearch('')
    setStudentLevelFilter('ALL')
    setLibraryAccessFilter('ALL')
    setSubStatusFilter('ALL')
    setDepositStatusFilter('ALL')
    setBookLevelFilter('ALL')
    setCategoryFilter('ALL')
    setAuthorFilter('')
    setEbookSearch('')
    setAvailabilityFilter('ALL')
    setBookStatusFilter('ALL')
    setStartDateFilter('')
    setEndDateFilter('')
  }

  const exportCurrent = (type) => {
    const reportTitle = tab?.label || 'Library Report'
    const generatedBy = user?.full_name || user?.username || 'Administrator'

    if (type === 'excel') {
      const headerRows = [
        `School Name,${JSON.stringify(schoolName)}`,
        `Report Type,${JSON.stringify(reportTitle)}`,
        `Academic Year,${JSON.stringify(academicYearLabel)}`,
        `Date of Generation,${JSON.stringify(generatedDateStr)}`,
        `Generated By,${JSON.stringify(generatedBy)}`,
        ''
      ]

      const metricSection = [
        '--- EXECUTIVE SUMMARY METRICS ---',
        'Metric Name,Value',
        ...scalar.filter(([k]) => selectedMetrics.includes(k)).map(([k, v]) => `${JSON.stringify(pretty(k))},${JSON.stringify(formatVal(active, k, v))}`),
        ''
      ]

      const listSections = lists.flatMap(([title, rows]) => {
        if (!rows.length) return []
        const fields = selectedListFields[title] || []
        if (!fields.length) return []
        return [
          `--- ${pretty(title).toUpperCase()} ---`,
          fields.map(pretty).join(','),
          ...rows.map((row) => fields.map((f) => JSON.stringify(row[f] ?? '')).join(',')),
          ''
        ]
      })

      const csvContent = '\uFEFF' + [...headerRows, ...metricSection, ...listSections].join('\n')
      download(csvContent, `kinder-park-${active}-report.csv`, 'text/csv;charset=utf-8')
      return
    }

    // PRINT / SAVE PDF FORMATTED HIGH-QUALITY HTML DOCUMENT
    const printHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${schoolName} - ${reportTitle}</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 15px; background: #fff; line-height: 1.4; }
          
          /* Header Styling */
          .report-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
          .school-title { font-size: 20px; font-weight: 700; color: #000; margin: 0; text-transform: uppercase; }
          .report-subtitle { font-size: 15px; font-weight: 700; color: #000; margin-top: 4px; }
          
          .meta-card { background: #fff; border: 1px solid #000; padding: 8px 12px; font-size: 11px; line-height: 1.5; text-align: right; }
          .meta-card strong { color: #1e293b; }
          
          /* KPI Cards Grid */
          .kpi-container { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
          .kpi-box { background: #fff; border: 1px solid #000; padding: 8px 10px; text-align: center; }
          .kpi-title { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; }
          .kpi-value { font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 4px; }
          
          /* Section Headers */
          .section-heading { font-size: 12px; font-weight: 800; color: #000; text-transform: uppercase; margin-top: 16px; margin-bottom: 8px; border-bottom: 1px solid #000; padding-bottom: 3px; }
          
          /* Table Styles */
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
          th { background-color: #fff; color: #000; text-align: left; padding: 7px 10px; font-weight: 700; font-size: 10px; text-transform: uppercase; border: 1px solid #000; }
          td { padding: 6px 10px; border: 1px solid #000; color: #000; }
          .num-col { text-align: right; font-variant-numeric: tabular-nums; }
          
          /* Footer */
          .report-footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #64748b; }
          .sig-box { border-top: 1px solid #64748b; width: 160px; text-align: center; padding-top: 4px; font-weight: 600; color: #334155; }
          
          @media print {
            body { padding: 0; }
            .kpi-container { grid-template-columns: repeat(4, 1fr); }
            th { background-color: #fff !important; color: #000 !important; }
          }
        </style>
      </head>
      <body>
        <div class="report-header">
          <div>
            <h1 class="school-title">${schoolName}</h1>
            <div class="report-subtitle">${reportTitle.toUpperCase()}</div>
          </div>
          <div class="meta-card">
            <div><strong>Date of Report:</strong> ${generatedDateStr}</div>
            <div><strong>Academic Year:</strong> ${academicYearLabel}</div>
            <div><strong>Generated By:</strong> ${generatedBy}</div>
            <div><strong>System:</strong> LAN Library Management</div>
          </div>
        </div>

        ${
          selectedMetrics.length > 0
            ? `
          <div class="section-heading">Executive Summary</div>
          <div class="kpi-container">
            ${scalar.filter(([k]) => selectedMetrics.includes(k))
              .map(
                ([k, v]) => `
              <div class="kpi-box">
                <div class="kpi-title">${pretty(k)}</div>
                <div class="kpi-value">${formatVal(active, k, v)}</div>
              </div>
            `
              )
              .join('')}
          </div>
        `
            : ''
        }

        ${lists
          .map(
            ([key, rows]) => {
              const fields = selectedListFields[key] || []
              if (!fields.length) return ''
              return `
          <div class="section-heading">${pretty(key)}</div>
          <table>
            <thead>
              <tr>
                ${rows[0] ? fields.map((h) => `<th class="${typeof rows[0][h] === 'number' ? 'num-col' : ''}">${pretty(h)}</th>`).join('') : ''}
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (row) => `
                <tr>
                  ${fields.map((k) => [k, row[k]])
                    .map(
                      ([k, v]) => `
                    <td class="${typeof v === 'number' ? 'num-col' : ''}">
                      ${typeof v === 'number' && (k.includes('amount') || k.includes('fine') || k.includes('charge') || k.includes('balance') || k.includes('deposit')) ? '₹' + v.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : String(v ?? '-')}
                    </td>
                  `
                    )
                    .join('')}
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        `}
          )
          .join('')}

        <div class="report-footer">
          <div>${schoolName} • Official Generated Report</div>
          <div class="sig-box">Authorized Signature</div>
        </div>
      </body>
      </html>
    `

    const win = window.open('', '_blank')
    win.document.write(printHTML)
    win.document.close()
    setTimeout(() => {
      win.print()
    }, 400)
  }

  return (
    <div className="space-y-6 text-gray-900 dark:text-gray-100">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-12 -mt-12 h-48 w-48 rounded-full bg-blue-500/10 blur-2xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-blue-300 font-semibold text-xs tracking-wider uppercase">
              <span>🏫 {schoolName}</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-white">{tab?.label || 'Report Generation'}</h2>
            <p className="text-sm text-blue-200/80 mt-1">Official calculated records, inventory metrics, JK member eligibility, and financial breakdowns.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => exportCurrent('excel')}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-500 transition-all hover:scale-105 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Excel / CSV
            </button>
            <button
              onClick={() => exportCurrent('pdf')}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-rose-500 transition-all hover:scale-105 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* Metadata Details Row */}
        <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-blue-200">
          <div>
            <span className="opacity-70">School Name: </span>
            <strong className="text-white font-medium">{schoolName}</strong>
          </div>
          <div>
            <span className="opacity-70">Date of Generation: </span>
            <strong className="text-white font-medium">{generatedDateStr}</strong>
          </div>
          <div>
            <span className="opacity-70">Generated By: </span>
            <strong className="text-white font-medium">{user?.full_name || user?.username || 'Admin'}</strong>
          </div>
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-50 dark:bg-red-950/60 p-4 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">{error}</div>}

      {/* Tabs Bar */}
      <div className="rounded-2xl bg-white dark:bg-[#17172a] border border-gray-200 dark:border-[#292944] shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-200 dark:border-[#292944] bg-gray-50/50 dark:bg-[#121222]">
          {visible.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                active === t.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 bg-white dark:bg-[#17172a]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filter Controls Panel for Students Report */}
        {active === 'students-detailed' && (
          <div className="p-5 bg-blue-50/40 dark:bg-[#121222] border-b border-gray-200 dark:border-[#292944] space-y-4">
            <div className="flex flex-wrap gap-1 border-b border-gray-400 pb-3">
              {[
                ['personal', 'Personal'], ['programme', 'Programme'], ['deposits', 'Deposits'], ['subscriptions', 'Subscriptions']
              ].map(([key, label]) => <button key={key} type="button" onClick={() => setStudentReportGroup(key)} className={`rounded-lg border px-4 py-2 text-xs font-bold transition-colors ${studentReportGroup === key ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-blue-50 dark:border-gray-700 dark:bg-[#1a1a2e] dark:text-gray-300'}`}>{label}</button>)}
            </div>
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-2">
                <span>🔍</span> Filter JK Members Report
              </h4>
              <button
                onClick={resetFilters}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Reset All Filters
              </button>
            </div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Search members
              <input value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Name, JK ID, parent, or phone..." className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-[#1a1a2e] dark:text-white" />
            </label>
            <div className="overflow-x-auto pb-2">
            <div className="flex min-w-max gap-3 text-xs [&>div]:w-52 [&>div]:shrink-0">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Academic Year</label>
                <select value={academicYearId} onChange={(event) => setAcademicYearId(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-gray-900 dark:border-gray-700 dark:bg-[#1a1a2e] dark:text-white">
                  <option value="">All Academic Years</option>
                  {academicYears.map((year) => <option key={year.academic_year_id} value={year.academic_year_id}>{year.year_name || year.year_code}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Level / Grade</label>
                <select
                  value={studentLevelFilter}
                  onChange={(e) => setStudentLevelFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] px-2.5 py-1.5 text-gray-900 dark:text-white"
                >
                  <option value="ALL">All Levels / Grades</option>
                  {programmes.map((p) => (
                    <option key={p.programme_id} value={p.programme_name}>
                      {p.display_name || p.programme_name}
                    </option>
                  ))}
                  <option value="Level 1">Level 1</option>
                  <option value="Level 2">Level 2</option>
                  <option value="Level 3">Level 3</option>
                  <option value="Nursery">Nursery</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Library Access</label>
                <select
                  value={libraryAccessFilter}
                  onChange={(e) => setLibraryAccessFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] px-2.5 py-1.5 text-gray-900 dark:text-white"
                >
                  <option value="ALL">All JK Members</option>
                  <option value="true">Enabled (Yes)</option>
                  <option value="false">Disabled (No)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Subscription Status</label>
                <select
                  value={subStatusFilter}
                  onChange={(e) => setSubStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] px-2.5 py-1.5 text-gray-900 dark:text-white"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="NOT_SUBSCRIBED">Not Subscribed</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Deposit Status</label>
                <select
                  value={depositStatusFilter}
                  onChange={(e) => setDepositStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] px-2.5 py-1.5 text-gray-900 dark:text-white"
                >
                  <option value="ALL">All Balances</option>
                  <option value="HEALTHY">Healthy (✓)</option>
                  <option value="LOW_BALANCE">Low Balance Warning (⚠️)</option>
                </select>
              </div>

              <div className="!w-80">
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Date Range (Created)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] px-1.5 py-1 text-gray-900 dark:text-white text-xs"
                  />
                  <span>-</span>
                  <input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] px-1.5 py-1 text-gray-900 dark:text-white text-xs"
                  />
                </div>
              </div>
            </div>
            </div>
          </div>
        )}

        {active === 'subscription-payments' && (
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 bg-emerald-50/50 p-5 dark:border-[#292944] dark:bg-[#121222]">
            <label className="text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300">Academic Year
              <select value={academicYearId} onChange={(event) => setAcademicYearId(event.target.value)} className="mt-1 block min-w-60 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 dark:border-gray-700 dark:bg-[#1a1a2e] dark:text-white">
                <option value="">All Academic Years</option>
                {academicYears.map((year) => <option key={year.academic_year_id} value={year.academic_year_id}>{year.year_name || year.year_code}</option>)}
              </select>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">Plan fees are reported separately from member deposits.</p>
          </div>
        )}

        {/* Filter Controls Panel for Books Report */}
        {active === 'books-detailed' && (
          <div className="p-5 bg-indigo-50/40 dark:bg-[#121222] border-b border-gray-200 dark:border-[#292944] space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                <span>🔍</span> Filter Books Report
              </h4>
              <button
                onClick={resetFilters}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                Reset All Filters
              </button>
            </div>
            <div className="overflow-x-auto pb-2">
            <div className="flex min-w-max gap-3 text-xs [&>div]:w-52 [&>div]:shrink-0">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Book Reading Level</label>
                <select
                  value={bookLevelFilter}
                  onChange={(e) => setBookLevelFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] px-2.5 py-1.5 text-gray-900 dark:text-white"
                >
                  <option value="ALL">All Levels</option>
                  {bookLevels.map((l) => (
                    <option key={l.level_id} value={l.level_name}>
                      {l.level_name} ({l.level_code})
                    </option>
                  ))}
                  <option value="Level 1">Level 1</option>
                  <option value="Level 2">Level 2</option>
                  <option value="Level 3">Level 3</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] px-2.5 py-1.5 text-gray-900 dark:text-white"
                >
                  <option value="ALL">All Categories</option>
                  {bookCategories.map((c) => (
                    <option key={c.category_id} value={c.category_name}>
                      {c.category_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Author Filter</label>
                <input
                  type="text"
                  placeholder="Author name..."
                  value={authorFilter}
                  onChange={(e) => setAuthorFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] px-2.5 py-1.5 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Availability</label>
                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] px-2.5 py-1.5 text-gray-900 dark:text-white"
                >
                  <option value="ALL">All Availability</option>
                  <option value="AVAILABLE">Available Copies (&gt;0)</option>
                  <option value="ISSUED">Issued Copies</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Book Status</label>
                <select
                  value={bookStatusFilter}
                  onChange={(e) => setBookStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] px-2.5 py-1.5 text-gray-900 dark:text-white"
                >
                  <option value="ALL">All Book Statuses</option>
                  <option value="Available">Available</option>
                  <option value="All Issued">All Issued</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>

              <div className="!w-80">
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Date Added Range</label>
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] px-1.5 py-1 text-gray-900 dark:text-white text-xs"
                  />
                  <span>-</span>
                  <input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a2e] px-1.5 py-1 text-gray-900 dark:text-white text-xs"
                  />
                </div>
              </div>
            </div>
            </div>
          </div>
        )}

        {active === 'ebooks-detailed' && (
          <div className="flex flex-wrap items-end gap-3 border-b border-gray-200 bg-violet-50/50 p-5 dark:border-[#292944] dark:bg-[#121222]">
            <label className="min-w-72 flex-1 text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300">Search E-book Register
              <input value={ebookSearch} onChange={(event) => setEbookSearch(event.target.value)} placeholder="Title, author, ISBN, or publisher..." className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-normal normal-case text-gray-900 dark:border-gray-700 dark:bg-[#1a1a2e] dark:text-white" />
            </label>
            <button type="button" onClick={() => setEbookSearch('')} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 dark:border-gray-700 dark:bg-[#1a1a2e] dark:text-gray-200">Clear</button>
            <p className="w-full text-xs text-gray-500 dark:text-gray-400">Information-only records. E-books are not included in physical stock, issue, return, available, lost, or damaged counts.</p>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-gray-500 dark:text-gray-400 text-center flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Generating calculated report metrics…</span>
          </div>
        ) : (
          <div className="p-6 space-y-8">
            {/* Metric KPI Cards */}
            {scalar.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-400 font-bold mb-3">Report Summary Indicators</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {scalar.map(([key, value]) => (
                    <div key={key} className="rounded-xl bg-gray-50 dark:bg-[#22223a] border border-gray-200 dark:border-[#292944] p-4 transition-all hover:shadow-md">
                      <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold cursor-pointer">
                        <input type="checkbox" checked={selectedMetrics.includes(key)} onChange={() => toggleMetric(key)} className="rounded border-gray-400 text-blue-600 focus:ring-blue-500" />
                        {pretty(key)}
                      </label>
                      <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">{formatVal(active, key, value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabular View of Executive Metrics for legacy views */}
            {scalar.length > 0 && !['students-detailed', 'books-detailed'].includes(active) && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Tabular Breakdown</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{schoolName} Report</span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#292944] bg-white dark:bg-[#10101d]">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 dark:bg-[#22223a] text-gray-700 dark:text-gray-300 uppercase font-bold text-xs">
                      <tr>
                        <th className="px-5 py-3.5">Metric / Indicator</th>
                        <th className="px-5 py-3.5 text-right">Calculated Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-[#292944]">
                      {visibleMetrics.map(([key, value], idx) => (
                        <tr key={key} className={idx % 2 === 0 ? 'bg-white dark:bg-[#10101d]' : 'bg-gray-50/50 dark:bg-[#141426]'}>
                          <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-gray-100">
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={selectedMetrics.includes(key)} onChange={() => toggleMetric(key)} className="rounded border-gray-400 text-blue-600 focus:ring-blue-500" />
                              {pretty(key)}
                            </label>
                          </td>
                          <td className="px-5 py-3.5 font-bold text-right text-gray-900 dark:text-white">{formatVal(active, key, value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3">
                  <Pagination currentPage={metricsPage} totalPages={metricPages} totalItems={scalar.length} perPage={metricsPerPage} onPageChange={setMetricsPage} itemLabel="metrics" />
                </div>
              </div>
            )}

            {/* Detailed Data Tables */}
            {lists.map(([key, rows]) => (
              <PaginatedReportTable
                key={key}
                title={key}
                rows={rows}
                activeTab={active}
                selectedFields={selectedListFields[key] || []}
                onToggleField={(field) => toggleListField(key, field)}
              />
            ))}

            {!scalar.length && !lists.length && <p className="text-gray-500 dark:text-gray-400 text-center py-8">No report records available for this selection.</p>}
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports
