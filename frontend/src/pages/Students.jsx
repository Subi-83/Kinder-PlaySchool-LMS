import React, { useEffect, useState } from 'react'
import {
  Plus, X, UserSearch, FileSpreadsheet, Trash2, Pencil, UserPlus,
  CheckCircle2, XCircle, GraduationCap, Search, AlertTriangle
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Pagination from '../components/common/Pagination'
import { useAppSettings } from '../context/AppSettingsContext'
import { PageHeader, Button, IconButton, Badge, EmptyState, LoadingState, Checkbox, ColumnVisibilityMenu, useColumnVisibility, SortableTh, useSortableData } from '../components/ui'

const STUDENT_COLUMNS = [
  { key: 'roll', label: 'Roll & ID', locked: true },
  { key: 'name', label: 'Name', locked: true },
  { key: 'programme', label: 'Programme / Grade' },
  { key: 'library', label: 'Library Access' },
  { key: 'deposit', label: 'Deposit & Fines' },
  { key: 'subscription', label: 'Subscription' },
  { key: 'parents', label: 'Parents' },
  { key: 'actions', label: 'Actions', locked: true },
]

const emptyForm = () => ({
  student_name: '',
  date_of_birth: '',
  school_name: '',
  programme_id: '',
  academic_year_id: '',
  grade: '',
  mother_name: '',
  mother_phone: '',
  mother_email: '',
  father_name: '',
  father_phone: '',
  father_email: '',
  gender: 'OTHER',
  address: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  medical_notes: '',
  student_email: '',
  library_access: true
})

const emptyReEnrollForm = () => ({
  academic_year_id: '', programme_id: '', grade: '', section: '',
  student_name: '', date_of_birth: '', gender: 'OTHER', school_name: '', student_email: '',
  mother_name: '', mother_phone: '', mother_email: '', father_name: '', father_phone: '', father_email: '',
  address: '', emergency_contact_name: '', emergency_contact_phone: '', medical_notes: '', library_access: true
})

function Students() {
  const { memberLabel, membersLabel, memberPrefix } = useAppSettings()
  const { user, hasPermission } = useAuth()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [programmes, setProgrammes] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [form, setForm] = useState(emptyForm())
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // State for Re-enrollment modal
  const [reEnrollStudent, setReEnrollStudent] = useState(null)
  const [showEnrollmentDialog, setShowEnrollmentDialog] = useState(false)
  const [existingSearch, setExistingSearch] = useState('')
  const [existingMatches, setExistingMatches] = useState([])
  const [showImport, setShowImport] = useState(false)
  const [studentExcelFile, setStudentExcelFile] = useState(null)
  const [importYear, setImportYear] = useState('')
  const [importProgramme, setImportProgramme] = useState('')
  const [importing, setImporting] = useState(false)
  const [importReport, setImportReport] = useState(null)
  const [resetting, setResetting] = useState(false)
  const [reEnrollForm, setReEnrollForm] = useState(emptyReEnrollForm())

  // Additional Filter States
  const [filterYear, setFilterYear] = useState('')
  const [filterProgramme, setFilterProgramme] = useState('')
  const [filterGrade, setFilterGrade] = useState('')
  const [filterSchool, setFilterSchool] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterLibraryAccess, setFilterLibraryAccess] = useState('')
  const [filterSubStatus, setFilterSubStatus] = useState('')

  const { isVisible, toggle, reset: resetColumns, hiddenCount } = useColumnVisibility('students', STUDENT_COLUMNS)

  const canCreate = user?.role === 'ADMIN' || hasPermission('student.create')
  const canEdit = user?.role === 'ADMIN' || hasPermission('student.edit')
  const canDelete = user?.role === 'ADMIN' || hasPermission('student.delete')

  const handleResetAll = async () => {
    const confirmation = window.prompt(
      'WARNING: This will permanently DELETE ALL JK member records, enrollments, deposit accounts, and reset all roll numbers to 0001!\n\nType "RESET" to confirm:'
    )
    if (confirmation !== 'RESET') return
    try {
      setResetting(true)
      setError('')
      setSuccess('')
      const res = await api.post('/students/reset-all')
      setSuccess(res.data?.message || 'All student data cleared and roll numbers reset to 0001 successfully.')
      await load()
      setTimeout(() => setSuccess(''), 5000)
    } catch (e) {
      setError(e.data?.error || e.response?.data?.error || e.message || 'Could not reset student data.')
    } fontFinally: {
      setResetting(false)
    }
  }

  const load = async () => {
    try {
      setLoading(true)
      const [s, p, y] = await Promise.all([
        api.get('/students/'),
        api.get('/students/programmes'),
        api.get('/students/academic-years')
      ])
      setStudents(s.data || [])
      setProgrammes(p.data || [])
      setAcademicYears(y.data || [])
    } catch (e) {
      setError(e.data?.error || e.message || 'Could not load JK member master data.')
    }finally{
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const toggleLibraryAccess = async (student) => {
    try {
      const newAccess = !student.library_access
      await api.put(`/students/${student.student_id}`, {
        library_access: newAccess
      })
      setSuccess(`Library access ${newAccess ? 'ENABLED' : 'DISABLED'} for ${student.student_name}`)
      await load()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.data?.error || 'Failed to update library access.')
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    try {
      setError('')
      setSuccess('')
      if (editing) {
        await api.put(`/students/${editing}`, form)
        setSuccess('JK member updated successfully.')
      } else {
        await api.post('/students/', form)
        setSuccess('JK member created successfully.')
      }
      setShowForm(false)
      setEditing(null)
      setForm(emptyForm())
      await load()
      setTimeout(() => setSuccess(''), 4000)
    } catch (e) {
      setError(e.data?.error || e.response?.data?.error || e.message || 'Could not save JK member.')
    }
  }

  const handleReEnroll = async (e) => {
    e.preventDefault()
    if (!reEnrollStudent) return
    if (!reEnrollForm.academic_year_id || !reEnrollForm.programme_id) {
      setError('Please select an Academic Year and Programme.')
      return
    }
    try {
      setError('')
      setSuccess('')
      const response = await api.post('/students/enrollments', {
        student_id: reEnrollStudent.student_id,
        ...reEnrollForm,
        profile: {
          student_name: reEnrollForm.student_name, date_of_birth: reEnrollForm.date_of_birth,
          gender: reEnrollForm.gender, school_name: reEnrollForm.school_name, student_email: reEnrollForm.student_email,
          mother_name: reEnrollForm.mother_name, mother_phone: reEnrollForm.mother_phone, mother_email: reEnrollForm.mother_email,
          father_name: reEnrollForm.father_name, father_phone: reEnrollForm.father_phone, father_email: reEnrollForm.father_email,
          address: reEnrollForm.address, emergency_contact_name: reEnrollForm.emergency_contact_name,
          emergency_contact_phone: reEnrollForm.emergency_contact_phone, medical_notes: reEnrollForm.medical_notes,
          library_access: reEnrollForm.library_access
        }
      })
      setSuccess(response.data?.message || `${reEnrollStudent.student_name} enrolled successfully!`)
      setReEnrollStudent(null)
      setShowEnrollmentDialog(false)
      setReEnrollForm(emptyReEnrollForm())
      await load()
      setTimeout(() => setSuccess(''), 4000)
    } catch (e) {
      setError(e.data?.error || e.response?.data?.error || e.message || 'Could not create new enrollment.')
    }
  }

  const searchExistingStudents = async () => {
    const query = existingSearch.trim()
    if (!query) return setExistingMatches([])
    try {
      setError('')
      const response = await api.get(`/students/search?q=${encodeURIComponent(query)}`)
      setExistingMatches(response.data || [])
    } catch (e) {
      setError(e.data?.error || e.response?.data?.error || 'Could not search students.')
    }
  }

  const selectExistingStudent = (student) => {
    const activeEnrollment = student.enrollments?.find((entry) => entry.status === 'ACTIVE') || student.current_enrollment
    const defaultYear = academicYears.find((year) => year.is_current)?.academic_year_id || academicYears[0]?.academic_year_id || ''
    setReEnrollStudent(student)
    setReEnrollForm({
      academic_year_id: defaultYear,
      programme_id: activeEnrollment?.programme?.programme_id || programmes[0]?.programme_id || '',
      grade: activeEnrollment?.grade || '',
      section: activeEnrollment?.section || '',
      student_name: student.student_name || '', date_of_birth: student.date_of_birth || '',
      gender: student.gender || 'OTHER', school_name: student.school_name || '', student_email: student.student_email || '',
      mother_name: student.mother_name || '', mother_phone: student.mother_phone || '', mother_email: student.mother_email || '',
      father_name: student.father_name || '', father_phone: student.father_phone || '', father_email: student.father_email || '',
      address: student.address || '', emergency_contact_name: student.emergency_contact_name || '',
      emergency_contact_phone: student.emergency_contact_phone || '', medical_notes: student.medical_notes || '',
      library_access: activeEnrollment?.library_access ?? student.library_access ?? true
    })
    setExistingMatches([])
  }

  const importStudentSpreadsheet = async (event) => {
    event.preventDefault()
    if (!studentExcelFile || !importYear) {
      setError('Please choose a JK member Excel/CSV file and select the academic year.')
      return
    }
    const body = new FormData()
    body.append('file', studentExcelFile)
    body.append('academic_year_id', importYear)
    try {
      setImporting(true)
      setError('')
      body.append('default_programme_id', importProgramme)
      const response = await api.post('/students/import-students', body, { headers: { 'Content-Type': 'multipart/form-data' } })
      const summary = response.data
      setImportReport(summary)
      let msg = `Imported ${summary.enrollments_created} enrollment(s): ${summary.new_students} new student(s), ${summary.existing_students} existing student(s).`
      if (summary.skipped?.length) {
        const skippedNotes = summary.skipped.map(s => `Row ${s.row}: ${s.reason}`).join('; ')
        msg += ` (${summary.skipped.length} row(s) skipped: ${skippedNotes})`
      }
      setSuccess(msg)
      setShowImport(false)
      setStudentExcelFile(null)
      await load()
    } catch (e) {
      setError(e.data?.error || e.response?.data?.error || 'Could not import student spreadsheet.')
    } finally {
      setImporting(false)
    }
  }

  const availableGrades = Array.from(new Set(
    students.flatMap((s) => (s.enrollments || []).map((e) => e.grade).filter(Boolean))
  )).sort()

  const availableSchools = Array.from(new Set(
    students.map((s) => s.school_name).filter(Boolean)
  )).sort()

  const filtered = students.filter((s) => {
    const searchLower = search.toLowerCase().trim()
    const allRolls = (s.enrollments || []).map((e) => e.roll_number).filter(Boolean).join(' ')
    const matchesSearch = !searchLower ||
      `${s.student_name} ${s.student_uid} ${allRolls} ${s.school_name || ''} ${s.mother_name || ''} ${s.father_name || ''} ${s.mother_phone || ''} ${s.father_phone || ''}`
        .toLowerCase()
        .includes(searchLower)

    const matchesYear = !filterYear || (s.enrollments || []).some((e) =>
      String(e.academic_year_id || e.academic_year?.academic_year_id) === String(filterYear)
    )

    const matchesProgramme = !filterProgramme || (s.enrollments || []).some((e) =>
      String(e.programme_id || e.programme?.programme_id) === String(filterProgramme)
    )

    const matchesGrade = !filterGrade || (s.enrollments || []).some((e) => e.grade === filterGrade)
    const matchesSchool = !filterSchool || s.school_name === filterSchool
    const matchesStatus = !filterStatus || (filterStatus === 'ACTIVE' ? s.is_active : !s.is_active)

    const matchesLibraryAccess = !filterLibraryAccess || (
      filterLibraryAccess === 'ENABLED' ? s.library_access : !s.library_access
    )

    const matchesSubStatus = !filterSubStatus || (
      filterSubStatus === 'ACTIVE' ? Boolean(s.active_subscription) : !s.active_subscription
    )

    return matchesSearch && matchesYear && matchesProgramme && matchesGrade && matchesSchool && matchesStatus && matchesLibraryAccess && matchesSubStatus
  })

  const hasActiveFilters = Boolean(
    search || filterYear || filterProgramme || filterGrade || filterSchool || filterStatus || filterLibraryAccess || filterSubStatus
  )

  const { sortedItems: sortedStudents, requestSort, directionFor } = useSortableData(filtered, null, (row, key) => {
    const activeEnc = row.enrollments?.find((e) => e.status === 'ACTIVE') || row.current_enrollment
    if (key === 'roll') return activeEnc?.roll_number || row.student_uid
    if (key === 'programme') return activeEnc?.programme?.display_name || activeEnc?.programme?.programme_name
    if (key === 'library') return row.library_access ? 1 : 0
    if (key === 'deposit') return Number(row.deposit_balance || 0)
    if (key === 'subscription') return row.active_subscription?.plan?.plan_name || ''
    return row[key]
  })

  const resetFilters = () => {
    setSearch('')
    setFilterYear('')
    setFilterProgramme('')
    setFilterGrade('')
    setFilterSchool('')
    setFilterStatus('')
    setFilterLibraryAccess('')
    setFilterSubStatus('')
  }

  const totalItems = sortedStudents.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const paginatedStudents = sortedStudents.slice(
  (currentPage - 1) * pageSize,
  currentPage * pageSize
  )

  const textFields = [
    ['student_name', 'JK member name'],
    ['date_of_birth', 'Date of birth', 'date'],
    ['school_name', 'School name'],
    ['grade', 'Grade'],
    ['mother_name', "Mother's name"],
    ['mother_phone', "Mother's phone number", 'tel'],
    ['mother_email', "Mother's email", 'email', true],
    ['father_name', "Father's name"],
    ['father_phone', "Father's phone number", 'tel'],
    ['father_email', "Father's email", 'email', true],
    ['student_email', 'JK member email', 'email', true]
  ]
  if (loading) {
    return <LoadingState label="Loading student data…" />
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={`${membersLabel} & Library Memberships`}
        description={`Manage ${memberLabel.toLowerCase()} profiles, roll numbers, deposit balances, and library access privileges.`}
        actions={canCreate && (
          <>
            <Button
              variant="primary"
              icon={showForm ? X : Plus}
              onClick={() => {
                setForm(emptyForm())
                setEditing(null)
                setShowForm((v) => !v)
              }}
            >
              {showForm ? 'Cancel' : `New ${memberLabel}`}
            </Button>
            <Button
              variant="success"
              icon={UserSearch}
              onClick={() => {
                setError('')
                setExistingSearch('')
                setExistingMatches([])
                setReEnrollStudent(null)
                setShowEnrollmentDialog(true)
              }}
            >
              Existing / Old {memberLabel}
            </Button>
            <Button
              variant="secondary"
              icon={FileSpreadsheet}
              className="!bg-violet-600 hover:!bg-violet-700 !text-white"
              onClick={() => {
                setImportYear(academicYears.find((year) => year.is_current)?.academic_year_id || academicYears[0]?.academic_year_id || '')
                setImportProgramme('')
                setImportReport(null)
                setShowImport(true)
              }}
            >
              Import Excel
            </Button>
            {canDelete && (
              <Button
                variant="danger"
                icon={Trash2}
                loading={resetting}
                onClick={handleResetAll}
              >
                {resetting ? 'Resetting…' : 'Reset All'}
              </Button>
            )}
          </>
        )}
      />

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-sm font-semibold flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-sm font-semibold flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{success}</span>
        </div>
      )}
      {importReport?.existing_details?.length > 0 && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-amber-200 dark:border-amber-800">
            <div>
              <h3 className="font-bold text-amber-900 dark:text-amber-200">Existing members found ({importReport.existing_details.length})</h3>
              <p className="text-xs text-amber-700 dark:text-amber-400">Matched only by the child name and birthdate.</p>
            </div>
            <button type="button" onClick={() => setImportReport(null)} className="text-sm font-semibold text-amber-800 dark:text-amber-300">Close</button>
          </div>
          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-xs text-left">
              <thead className="sticky top-0 bg-amber-100 dark:bg-amber-900/70 text-amber-950 dark:text-amber-100">
                <tr>
                  <th className="px-3 py-2">Excel row</th><th className="px-3 py-2">JK ID</th><th className="px-3 py-2">Child</th>
                  <th className="px-3 py-2">Birthdate</th><th className="px-3 py-2">Programme</th><th className="px-3 py-2">Parents / Phones</th>
                  <th className="px-3 py-2">Library</th><th className="px-3 py-2">Found in</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-200 dark:divide-amber-900 text-gray-800 dark:text-gray-200">
                {importReport.existing_details.map((item, index) => (
                  <tr key={`${item.row}-${item.student_uid}-${index}`}>
                    <td className="px-3 py-2">{item.row}</td><td className="px-3 py-2 font-mono">{item.student_uid}</td>
                    <td className="px-3 py-2 font-semibold">{item.student_name}</td><td className="px-3 py-2 whitespace-nowrap">{item.date_of_birth}</td>
                    <td className="px-3 py-2">{item.programme}</td>
                    <td className="px-3 py-2">{[item.mother_name && `${item.mother_name} (${item.mother_phone || '-'})`, item.father_name && `${item.father_name} (${item.father_phone || '-'})`].filter(Boolean).join(' / ') || '-'}</td>
                    <td className="px-3 py-2">{item.library_access ? 'Yes' : 'No'}</td>
                    <td className="px-3 py-2">{item.match_origin === 'DATABASE' ? 'Database before import' : 'Earlier row in this file'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT FORM */}
      {showForm && (
        <form onSubmit={submit} className="bg-white dark:bg-[#17172a] rounded-2xl p-6 border border-gray-200 dark:border-[#292944] shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg">{editing ? `Edit ${memberLabel} Record` : `Create New ${memberLabel}`}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {textFields.filter(([key]) => !editing || key !== 'grade').map(([key, label, type, optional]) => (
              <React.Fragment key={key}>
                {key === 'student_name' && (
                  <div className="md:col-span-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Basic information
                  </div>
                )}
                {key === 'mother_name' && (
                  <div className="md:col-span-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-3 mt-1">
                    Parent &amp; contact details
                  </div>
                )}
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {label}{optional ? '' : ' *'}
                  <input
                    required={!optional}
                    type={type || 'text'}
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                    className="mt-1 w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#10101d] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </label>
              </React.Fragment>
            ))}

            {!editing && (
              <>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Programme *
                  <select
                    required
                    value={form.programme_id}
                    onChange={(e) => set('programme_id', e.target.value)}
                    className="mt-1 w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#10101d] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select programme</option>
                    {programmes.map((p) => (
                      <option key={p.programme_id} value={p.programme_id}>
                        {p.programme_code || p.programme_name} - {p.display_name || p.programme_name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Academic year *
                  <select
                    required
                    value={form.academic_year_id}
                    onChange={(e) => set('academic_year_id', e.target.value)}
                    className="mt-1 w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#10101d] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select academic year</option>
                    {academicYears.map((y) => (
                      <option key={y.academic_year_id} value={y.academic_year_id}>
                        {y.year_code}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}

            <div className="flex items-center gap-3 pt-4">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={form.library_access}
                  onChange={(e) => set('library_access', e.target.checked)}
                />
                Enable Library Borrowing Privileges
              </label>
            </div>
          </div>

          <Button type="submit" variant="primary">
            {editing ? `Update ${memberLabel}` : `Save ${memberLabel}`}
          </Button>
        </form>
      )}

      {/* FILTER BAR */}
      <div className="bg-white dark:bg-[#17172a] rounded-2xl p-5 border border-gray-200 dark:border-[#292944] shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search by Name, ${memberPrefix} ID, Roll No, Phone...`}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#10101d] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <ColumnVisibilityMenu
              columns={STUDENT_COLUMNS}
              isVisible={isVisible}
              onToggle={toggle}
              onReset={resetColumns}
              hiddenCount={hiddenCount}
            />
            {hasActiveFilters && (
              <button onClick={resetFilters} className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:underline">
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Clear All Filters
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max gap-3">
          {/* Year Filter */}
          <label className="w-48 shrink-0 text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Academic Year
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#10101d] text-xs font-medium text-gray-900 dark:text-white"
          >
            <option value="">All Academic Years</option>
            {academicYears.map((y) => (
              <option key={y.academic_year_id} value={y.academic_year_id}>
                {y.year_code}
              </option>
            ))}
          </select>
          </label>

          {/* Programme Filter */}
          <label className="w-56 shrink-0 text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Programme
          <select
            value={filterProgramme}
            onChange={(e) => setFilterProgramme(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#10101d] text-xs font-medium text-gray-900 dark:text-white"
          >
            <option value="">All Programmes</option>
            {programmes.map((p) => (
              <option key={p.programme_id} value={p.programme_id}>
                {p.display_name || p.programme_code || p.programme_name}
              </option>
            ))}
          </select>
          </label>

          {/* Grade Filter */}
          <label className="w-44 shrink-0 text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Grade
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#10101d] text-xs font-medium text-gray-900 dark:text-white"
          >
            <option value="">All Grades</option>
            {availableGrades.map((g) => (
              <option key={g} value={g}>
                Grade: {g}
              </option>
            ))}
          </select>
          </label>

          {/* Library Access Filter */}
          <label className="w-52 shrink-0 text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Library Access
          <select
            value={filterLibraryAccess}
            onChange={(e) => setFilterLibraryAccess(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#10101d] text-xs font-medium text-gray-900 dark:text-white"
          >
            <option value="">Library Access (All)</option>
            <option value="ENABLED">Library Access: Enabled</option>
            <option value="DISABLED">Library Access: Disabled</option>
          </select>
          </label>

          {/* Subscription Filter */}
          <label className="w-48 shrink-0 text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Subscription
          <select
            value={filterSubStatus}
            onChange={(e) => setFilterSubStatus(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#10101d] text-xs font-medium text-gray-900 dark:text-white"
          >
            <option value="">Subscription (All)</option>
            <option value="ACTIVE">Active Plan</option>
            <option value="EXPIRED">No / Expired Plan</option>
          </select>
          </label>

          {/* Status Filter */}
          <label className="w-48 shrink-0 text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Member Status
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#10101d] text-xs font-medium text-gray-900 dark:text-white"
          >
            <option value="">Status (All)</option>
            <option value="ACTIVE">Active {membersLabel}</option>
            <option value="INACTIVE">Inactive {membersLabel}</option>
          </select>
          </label>
          </div>
        </div>
      </div>

      {/* STUDENT TABLE */}
      <div className="overflow-x-auto bg-white dark:bg-[#17172a] rounded-2xl border border-gray-200 dark:border-[#292944] shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 dark:bg-[#22223a] text-gray-700 dark:text-gray-300 font-bold text-xs uppercase">
            <tr>
              <SortableTh sortKey="roll" direction={directionFor('roll')} onSort={requestSort} className={`px-4 py-3 ${isVisible('roll') ? '' : 'hidden'}`}>Roll & {memberPrefix} ID</SortableTh>
              <SortableTh sortKey="student_name" direction={directionFor('student_name')} onSort={requestSort} className={`px-4 py-3 ${isVisible('name') ? '' : 'hidden'}`}>{memberLabel} Name</SortableTh>
              <SortableTh sortKey="programme" direction={directionFor('programme')} onSort={requestSort} className={`px-4 py-3 ${isVisible('programme') ? '' : 'hidden'}`}>Programme / Grade</SortableTh>
              <SortableTh sortKey="library" direction={directionFor('library')} onSort={requestSort} className={`px-4 py-3 text-center ${isVisible('library') ? '' : 'hidden'}`}>Library Access</SortableTh>
              <SortableTh sortKey="deposit" direction={directionFor('deposit')} onSort={requestSort} className={`px-4 py-3 ${isVisible('deposit') ? '' : 'hidden'}`}>Deposit & Fines</SortableTh>
              <SortableTh sortKey="subscription" direction={directionFor('subscription')} onSort={requestSort} className={`px-4 py-3 ${isVisible('subscription') ? '' : 'hidden'}`}>Subscription</SortableTh>
              <th className={`px-4 py-3 ${isVisible('parents') ? '' : 'hidden'}`}>Parents</th>
              <th className={`px-4 py-3 text-right ${isVisible('actions') ? '' : 'hidden'}`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-[#292944]">
            {paginatedStudents.map((s) => {
              const activeEnc = s.enrollments?.find((e) => e.status === 'ACTIVE') || s.current_enrollment
              const activeSub = s.active_subscription
              return (
                <tr key={s.student_id} className="hover:bg-blue-50/20 dark:hover:bg-[#19192e] transition-colors">
                  <td className={`px-4 py-3 ${isVisible('roll') ? '' : 'hidden'}`}>
                    <div className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                      {activeEnc?.roll_number || '—'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{s.student_uid}</div>
                  </td>
                  <td className={`px-4 py-3 ${isVisible('name') ? '' : 'hidden'}`}>
                    <div className="font-bold text-gray-900 dark:text-white">{s.student_name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{s.school_name || 'N/A'}</div>
                  </td>
                  <td className={`px-4 py-3 ${isVisible('programme') ? '' : 'hidden'}`}>
                    <div className="font-medium text-gray-900 dark:text-white">{activeEnc?.programme?.display_name || activeEnc?.programme?.programme_name || '—'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Grade: {activeEnc?.grade || '—'}</div>
                  </td>

                  {/* Library Access Toggle Button */}
                  <td className={`px-4 py-3 text-center ${isVisible('library') ? '' : 'hidden'}`}>
                    <button
                      onClick={() => toggleLibraryAccess(s)}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-xs ${
                        s.library_access
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-200'
                      }`}
                      title="Click to toggle library access"
                    >
                      {s.library_access ? (
                        <><CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Enabled</>
                      ) : (
                        <><XCircle className="h-3 w-3" aria-hidden="true" /> Disabled</>
                      )}
                    </button>
                  </td>

                  {/* Deposit & Outstanding Unpaid Balance */}
                  <td className={`px-4 py-3 text-xs ${isVisible('deposit') ? '' : 'hidden'}`}>
                    <div>Deposit: <strong>₹{Number(s.deposit_balance || 0).toFixed(2)}</strong></div>
                    {s.outstanding_balance > 0 ? (
                      <div className="text-rose-500 font-bold">Unpaid: ₹{Number(s.outstanding_balance).toFixed(2)}</div>
                    ) : (
                      <div className="text-gray-400">No Fines</div>
                    )}
                  </td>

                  {/* Subscription Plan & Limit */}
                  <td className={`px-4 py-3 text-xs ${isVisible('subscription') ? '' : 'hidden'}`}>
                    {activeSub ? (
                      <div>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">{activeSub.plan?.plan_name}</div>
                        <div className="text-gray-500">
                          Limit: {s.current_books_issued}/{s.max_books_allowed} books
                        </div>
                      </div>
                    ) : (
                      <span className="text-amber-500 font-semibold">No Active Plan</span>
                    )}
                  </td>

                  <td className={`px-4 py-3 text-xs text-gray-700 dark:text-gray-300 ${isVisible('parents') ? '' : 'hidden'}`}>
                    <div>{s.mother_name} ({s.mother_phone})</div>
                    <div className="text-gray-500">{s.father_name} ({s.father_phone})</div>
                  </td>

                  <td className={`py-3 ${isVisible('actions') ? '' : 'hidden'}`}>
                    <div className="flex items-center gap-1 justify-end pr-2">
                      {canEdit && (
                        <>
                          <IconButton
                            icon={Pencil}
                            label={`Edit ${s.student_name}`}
                            variant="subtle"
                            size="sm"
                            onClick={() => {
                              setEditing(s.student_id)
                              setError('')
                              setSuccess('')
                              const enc = activeEnc
                              setForm({
                                student_name: s.student_name || '',
                                date_of_birth: s.date_of_birth ? s.date_of_birth.split('T')[0] : '',
                                gender: s.gender || 'OTHER',
                                school_name: s.school_name || '',
                                student_email: s.student_email || '',
                                programme_id: enc?.programme_id || enc?.programme?.programme_id || '',
                                academic_year_id: enc?.academic_year_id || enc?.academic_year?.academic_year_id || '',
                                grade: enc?.grade || '',
                                mother_name: s.mother_name || '',
                                mother_phone: s.mother_phone || '',
                                mother_email: s.mother_email || '',
                                father_name: s.father_name || '',
                                father_phone: s.father_phone || '',
                                father_email: s.father_email || '',
                                address: s.address || '',
                                emergency_contact_name: s.emergency_contact_name || '',
                                emergency_contact_phone: s.emergency_contact_phone || '',
                                medical_notes: s.medical_notes || '',
                                library_access: s.library_access ?? true
                              })
                              setShowForm(true)
                            }}
                          />
                          <button
                            onClick={() => {
                              selectExistingStudent(s)
                              setShowEnrollmentDialog(true)
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/80 rounded-md font-semibold transition-colors border border-emerald-300 dark:border-emerald-800"
                          >
                            <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                            Re-Enroll
                          </button>
                        </>
                      )}
                      {canDelete && (
                        <IconButton
                          icon={Trash2}
                          label={`Delete ${s.student_name}`}
                          variant="ghost"
                          size="sm"
                          className="text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30"
                          onClick={async () => {
                            if (window.confirm(`Delete student ${s.student_name}?`)) {
                              try {
                                setError('')
                                await api.delete(`/students/${s.student_id}`)
                                await load()
                              } catch (err) {
                                setError(err.data?.error || err.response?.data?.error || err.message || 'Could not request JK member deletion.')
                              }
                            }
                          }}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="8" className="p-0">
                  <EmptyState
                    icon={Search}
                    title={`No ${membersLabel} found`}
                    description={`No ${membersLabel.toLowerCase()} match your filter criteria.`}
                    action={hasActiveFilters && (
                      <Button variant="outline" size="sm" icon={X} onClick={resetFilters}>
                        Clear filters
                      </Button>
                    )}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {filtered.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-[#2a2a4a]">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            perPage={pageSize}
            onPageChange={setCurrentPage}
            itemLabel="members"
          />
        </div>
      )}

      {/* EXCEL IMPORT MODAL DIALOG */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#17172a] rounded-2xl max-w-lg w-full p-6 border border-gray-200 dark:border-[#292944] shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-violet-600" aria-hidden="true" /> Import {membersLabel} from Excel / CSV
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Upload .xlsx or .csv data exported from Google Forms or spreadsheets.</p>
                <p className="text-[11px] text-gray-400 mt-1">Existing members are matched only by child name and birthdate. Shared parent details will not merge siblings or twins.</p>
              </div>
              <IconButton
                icon={X}
                label="Close"
                variant="ghost"
                onClick={() => {
                  setShowImport(false)
                  setStudentExcelFile(null)
                }}
              />
            </div>

            <form onSubmit={importStudentSpreadsheet} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Target Academic Year *
                </label>
                <select
                  required
                  value={importYear}
                  onChange={(e) => setImportYear(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#10101d] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                >
                  <option value="">Select Target Academic Year</option>
                  {academicYears.map((y) => (
                    <option key={y.academic_year_id} value={y.academic_year_id}>
                      {y.year_code} {y.is_current ? '(Current Active Year)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Fallback Default Programme (Optional)
                </label>
                <select
                  value={importProgramme}
                  onChange={(e) => setImportProgramme(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#10101d] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                >
                  <option value="">Auto-detect from Excel / Auto-create missing</option>
                  {programmes.map((p) => (
                    <option key={p.programme_id} value={p.programme_id}>
                      {p.programme_code || p.programme_name} - {p.display_name || p.programme_name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">If the spreadsheet does not specify a programme for a student, this fallback programme will be assigned.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Select Excel (.xlsx) or CSV (.csv) File *
                </label>
                <input
                  required
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => setStudentExcelFile(e.target.files[0] || null)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#10101d] text-gray-900 dark:text-white file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-violet-600 file:text-white hover:file:bg-violet-700 cursor-pointer"
                />
                {studentExcelFile && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                    Selected file: {studentExcelFile.name} ({(studentExcelFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowImport(false)
                    setStudentExcelFile(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="secondary"
                  className="!bg-violet-600 hover:!bg-violet-700 !text-white"
                  loading={importing}
                  disabled={!studentExcelFile || !importYear}
                >
                  {importing ? 'Processing & Importing Data…' : 'Start Bulk Import'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXISTING / OLD STUDENT RE-ENROLLMENT MODAL DIALOG */}
      {showEnrollmentDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#17172a] rounded-2xl max-w-5xl w-full p-6 border border-gray-200 dark:border-[#292944] shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-emerald-600" aria-hidden="true" /> Re-Enroll Existing / Old {memberLabel}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Search for an existing {memberLabel.toLowerCase()} record to enroll them into a new academic year.</p>
              </div>
              <IconButton
                icon={X}
                label="Close"
                variant="ghost"
                onClick={() => {
                  setShowEnrollmentDialog(false)
                  setReEnrollStudent(null)
                  setExistingMatches([])
                  setExistingSearch('')
                }}
              />
            </div>

            {!reEnrollStudent ? (
              /* SEARCH STEP */
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={existingSearch}
                    onChange={(e) => setExistingSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchExistingStudents())}
                    placeholder={`Enter ${memberLabel} Name, ${memberPrefix} ID, or Phone Number...`}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#10101d] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <Button type="button" variant="success" icon={Search} onClick={searchExistingStudents}>
                    Search
                  </Button>
                </div>

                {existingMatches.length > 0 && (
                  <div className="space-y-2 border border-gray-200 dark:border-gray-800 rounded-xl p-3 max-h-60 overflow-y-auto bg-gray-50 dark:bg-[#10101d]">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Matching {membersLabel} ({existingMatches.length}):</div>
                    {existingMatches.map((st) => (
                      <div
                        key={st.student_id}
                        onClick={() => selectExistingStudent(st)}
                        className="p-3 bg-white dark:bg-[#17172a] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-gray-200 dark:border-gray-800 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-sm text-gray-900 dark:text-white">{st.student_name} <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">({st.student_uid})</span></div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            DOB: {st.date_of_birth || 'N/A'} | Mother: {st.mother_name || 'N/A'} ({st.mother_phone || '—'})
                          </div>
                        </div>
                        <Button type="button" variant="success" size="sm">
                          Select
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {existingSearch && existingMatches.length === 0 && (
                  <EmptyState
                    icon={UserSearch}
                    title={`No matching ${memberLabel.toLowerCase()} found`}
                    description="Double-check the search or create a new record instead."
                  />
                )}
              </div>
            ) : (
              /* ENROLLMENT FORM STEP */
              <form onSubmit={handleReEnroll} className="space-y-4">
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex justify-between items-center">
                  <div>
                    <div className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                      Selected: {reEnrollStudent.student_name}
                    </div>
                    <div className="text-xs text-emerald-700 dark:text-emerald-400 font-mono">
                      ID: {reEnrollStudent.student_uid} | DOB: {reEnrollStudent.date_of_birth || 'N/A'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReEnrollStudent(null)}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
                  >
                    Change {memberLabel}
                  </button>
                </div>

                <div>
                  <h4 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">Member Profile — review and update</h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {[
                      ['student_name', `${memberLabel} Name`, 'text', true], ['date_of_birth', 'Date of Birth', 'date', true],
                      ['school_name', 'School Name'], ['student_email', 'Member / Contact Email', 'email'],
                      ['mother_name', "Mother's Name"], ['mother_phone', "Mother's Phone", 'tel'], ['mother_email', "Mother's Email", 'email'],
                      ['father_name', "Father's Name"], ['father_phone', "Father's Phone", 'tel'], ['father_email', "Father's Email", 'email'],
                      ['emergency_contact_name', 'Emergency Contact Name'], ['emergency_contact_phone', 'Emergency Contact Phone', 'tel']
                    ].map(([key, label, type = 'text', required = false]) => (
                      <label key={key} className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300">{label}{required ? ' *' : ''}
                        <input required={required} type={type} value={reEnrollForm[key]} onChange={(e) => setReEnrollForm((form) => ({ ...form, [key]: e.target.value }))} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm normal-case text-gray-900 dark:border-gray-700 dark:bg-[#10101d] dark:text-white" />
                      </label>
                    ))}
                    <label className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300">Gender
                      <select value={reEnrollForm.gender} onChange={(e) => setReEnrollForm((form) => ({ ...form, gender: e.target.value }))} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm normal-case dark:border-gray-700 dark:bg-[#10101d] dark:text-white"><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select>
                    </label>
                    <label className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300">Library Subscription for Next Course
                      <select value={reEnrollForm.library_access ? 'YES' : 'NO'} onChange={(e) => setReEnrollForm((form) => ({ ...form, library_access: e.target.value === 'YES' }))} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm normal-case dark:border-gray-700 dark:bg-[#10101d] dark:text-white">
                        <option value="YES">Yes — carry deposit and plan forward</option>
                        <option value="NO">No — deposit refund required</option>
                      </select>
                    </label>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300">
                      Address
                      <textarea
                        rows="3"
                        value={reEnrollForm.address}
                        onChange={(e) => setReEnrollForm((form) => ({ ...form, address: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm normal-case dark:border-gray-700 dark:bg-[#10101d] dark:text-white"
                      />
                    </label>
                    <label className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300">
                      Medical Notes
                      <textarea
                        rows="3"
                        value={reEnrollForm.medical_notes}
                        onChange={(e) => setReEnrollForm((form) => ({ ...form, medical_notes: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm normal-case dark:border-gray-700 dark:bg-[#10101d] dark:text-white"
                      />
                    </label>
                  </div>
                </div>

                <h4 className="border-t border-gray-200 pt-4 text-sm font-bold text-gray-900 dark:border-gray-800 dark:text-white">New Academic-Year Enrollment</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                      Academic Year *
                    </label>
                    <select
                      required
                      value={reEnrollForm.academic_year_id}
                      onChange={(e) => setReEnrollForm((f) => ({ ...f, academic_year_id: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#10101d] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="">Select Academic Year</option>
                      {academicYears.map((y) => (
                        <option key={y.academic_year_id} value={y.academic_year_id}>
                          {y.year_code} {y.is_current ? '(Current Active Year)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                      Programme *
                    </label>
                    <select
                      required
                      value={reEnrollForm.programme_id}
                      onChange={(e) => setReEnrollForm((f) => ({ ...f, programme_id: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#10101d] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="">Select Programme</option>
                      {programmes.map((p) => (
                        <option key={p.programme_id} value={p.programme_id}>
                          {p.programme_code || p.programme_name} - {p.display_name || p.programme_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                      Grade / Class
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Nursery, LKG, Grade 1"
                      value={reEnrollForm.grade}
                      onChange={(e) => setReEnrollForm((f) => ({ ...f, grade: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#10101d] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                      Section
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. A, B, Main"
                      value={reEnrollForm.section}
                      onChange={(e) => setReEnrollForm((f) => ({ ...f, section: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#10101d] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowEnrollmentDialog(false)
                      setReEnrollStudent(null)
                      setExistingMatches([])
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="success">
                    Complete Re-Enrollment
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Students
