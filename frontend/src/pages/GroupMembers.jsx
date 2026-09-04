import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import Pagination from '../components/common/Pagination'
import { PageHeader, Button, IconButton, EmptyState, LoadingState, ColumnVisibilityMenu, useColumnVisibility, SortableTh, useSortableData } from '../components/ui'

const GROUP_MEMBER_COLUMNS = [
  { key: 'id', label: 'ID', locked: true },
  { key: 'student', label: 'Student', locked: true },
  { key: 'dob', label: 'DOB / Gender' },
  { key: 'school', label: 'School' },
  { key: 'parents', label: 'Parents' },
  { key: 'actions', label: 'Actions', locked: true },
]

const emptyForm = () => ({
  student_name: '', date_of_birth: '', gender: 'OTHER', school_name: '', student_email: '',
  mother_name: '', mother_phone: '', mother_email: '', father_name: '', father_phone: '',
  father_email: '', address: '', emergency_contact_name: '', emergency_contact_phone: '', medical_notes: ''
})

export default function GroupMembers() {
  const { groupCode } = useParams()
  const { user, hasPermission } = useAuth()
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [form, setForm] = useState(emptyForm())
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 10
  const { isVisible, toggle, reset: resetColumns, hiddenCount } = useColumnVisibility('group-members', GROUP_MEMBER_COLUMNS)
  const canCreate = user?.role === 'ADMIN' || hasPermission('student.create')
  const canEdit = user?.role === 'ADMIN' || hasPermission('student.edit')
  const canDelete = user?.role === 'ADMIN' || hasPermission('student.delete')

  const load = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/students/group/${encodeURIComponent(groupCode)}`)
      setGroup(response.data?.group || null)
      setMembers(response.data?.members || [])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [groupCode])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return !q
      ? members
      : members.filter((member) => [
          member.student_uid, member.student_name, member.school_name,
          member.mother_name, member.mother_phone, member.father_name, member.father_phone
        ].filter(Boolean).join(' ').toLowerCase().includes(q))
  }, [members, search])
  const { sortedItems: sortedMembers, requestSort, directionFor } = useSortableData(filtered, null, (row, key) => {
    if (key === 'id') return row.student_uid
    if (key === 'dob') return row.date_of_birth
    return row[key]
  })
  const totalPages = Math.max(1, Math.ceil(sortedMembers.length / pageSize))
  const rows = sortedMembers.slice((page - 1) * pageSize, page * pageSize)
  useEffect(() => { setPage(1) }, [search, groupCode])

  const openEdit = (member) => {
    setEditing(member.student_id)
    setForm(Object.fromEntries(Object.keys(emptyForm()).map((key) => [key, member[key] || (key === 'gender' ? 'OTHER' : '')])))
    setShowForm(true)
  }
  const save = async (event) => {
    event.preventDefault()
    try {
      if (editing) await api.put(`/students/${editing}`, form)
      else await api.post(`/students/group/${encodeURIComponent(groupCode)}`, form)
      setShowForm(false)
      setEditing(null)
      setForm(emptyForm())
      await load()
    } catch (_) {
      // Alert.jsx displays validation and API errors.
    }
  }
  const remove = async (member) => {
    if (!window.confirm(`Delete ${member.student_name}?`)) return
    try {
      await api.delete(`/students/${member.student_id}`)
      await load()
    } catch (_) {}
  }

  if (loading) return <LoadingState label="Loading group records…" />

  return (
    <div className="space-y-5">
      <PageHeader
        title={group?.group_name || 'Member Group'}
        description={`Personal student records only${group?.library_enabled ? ' with optional library features' : ' — no library, programme, deposit, or subscription records'}.`}
        actions={canCreate && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              setEditing(null)
              setForm(emptyForm())
              setShowForm(true)
            }}
          >
            Add {group?.singular_label || 'Student'}
          </Button>
        )}
      />

      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, ID, school, or parent..."
            className="w-full rounded-xl border bg-white pl-9 pr-4 py-2.5 dark:border-gray-700 dark:bg-[#17172a]"
          />
        </div>
        <ColumnVisibilityMenu
          columns={GROUP_MEMBER_COLUMNS}
          isVisible={isVisible}
          onToggle={toggle}
          onReset={resetColumns}
          hiddenCount={hiddenCount}
        />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4">
          <form
            onSubmit={save}
            className="my-6 w-full max-w-3xl space-y-4 rounded-2xl bg-white p-6 dark:bg-[#17172a] max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-lg font-bold">{editing ? 'Edit' : 'Add'} {group?.singular_label}</h3>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                ['student_name', 'Student Name', 'text', true],
                ['date_of_birth', 'Date of Birth', 'date', true],
                ['gender', 'Gender'],
                ['school_name', 'School'],
                ['student_email', 'Email', 'email'],
                ['mother_name', "Mother's Name"],
                ['mother_phone', "Mother's Phone", 'tel'],
                ['mother_email', "Mother's Email", 'email'],
                ['father_name', "Father's Name"],
                ['father_phone', "Father's Phone", 'tel'],
                ['father_email', "Father's Email", 'email'],
                ['emergency_contact_name', 'Emergency Contact'],
                ['emergency_contact_phone', 'Emergency Phone', 'tel']
              ].map(([key, label, type = 'text', required = false]) => (
                key === 'gender' ? (
                  <label key={key} className="text-xs font-bold uppercase">
                    {label}
                    <select
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      className="mt-1 w-full rounded-xl border px-3 py-2 dark:bg-[#10101d]"
                    >
                      <option>MALE</option>
                      <option>FEMALE</option>
                      <option>OTHER</option>
                    </select>
                  </label>
                ) : (
                  <label key={key} className="text-xs font-bold uppercase">
                    {label}{required && ' *'}
                    <input
                      required={required}
                      type={type}
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="mt-1 w-full rounded-xl border px-3 py-2 normal-case dark:bg-[#10101d]"
                    />
                  </label>
                )
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Address"
                className="rounded-xl border p-3 dark:bg-[#10101d]"
              />
              <textarea
                value={form.medical_notes}
                onChange={(e) => setForm({ ...form, medical_notes: e.target.value })}
                placeholder="Medical notes"
                className="rounded-xl border p-3 dark:bg-[#10101d]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-white dark:border-[#292944] dark:bg-[#17172a]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left text-xs uppercase dark:bg-[#22223a]">
              <tr>
                <SortableTh sortKey="id" direction={directionFor('id')} onSort={requestSort} className={`p-3 ${isVisible('id') ? '' : 'hidden'}`}>ID</SortableTh>
                <SortableTh sortKey="student_name" direction={directionFor('student_name')} onSort={requestSort} className={`p-3 ${isVisible('student') ? '' : 'hidden'}`}>Student</SortableTh>
                <SortableTh sortKey="dob" direction={directionFor('dob')} onSort={requestSort} className={`p-3 ${isVisible('dob') ? '' : 'hidden'}`}>DOB / Gender</SortableTh>
                <SortableTh sortKey="school_name" direction={directionFor('school_name')} onSort={requestSort} className={`p-3 ${isVisible('school') ? '' : 'hidden'}`}>School</SortableTh>
                <th className={`p-3 ${isVisible('parents') ? '' : 'hidden'}`}>Parents</th>
                <th className={`p-3 text-right ${isVisible('actions') ? '' : 'hidden'}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((member) => (
                <tr key={member.student_id} className="border-t dark:border-[#292944]">
                  <td className={`p-3 font-mono text-blue-600 ${isVisible('id') ? '' : 'hidden'}`}>{member.student_uid}</td>
                  <td className={`p-3 font-bold ${isVisible('student') ? '' : 'hidden'}`}>{member.student_name}</td>
                  <td className={`p-3 ${isVisible('dob') ? '' : 'hidden'}`}>
                    {member.date_of_birth || '—'}
                    <div className="text-xs text-gray-500">{member.gender || '—'}</div>
                  </td>
                  <td className={`p-3 ${isVisible('school') ? '' : 'hidden'}`}>{member.school_name || '—'}</td>
                  <td className={`p-3 text-xs ${isVisible('parents') ? '' : 'hidden'}`}>
                    {member.mother_name || '—'} {member.mother_phone && `(${member.mother_phone})`}
                    <div className="text-gray-500">
                      {member.father_name || '—'} {member.father_phone && `(${member.father_phone})`}
                    </div>
                  </td>
                  <td className={`p-3 ${isVisible('actions') ? '' : 'hidden'}`}>
                    <div className="flex items-center justify-end gap-1">
                      {canEdit && (
                        <IconButton
                          icon={Pencil}
                          label={`Edit ${member.student_name}`}
                          variant="subtle"
                          size="sm"
                          onClick={() => openEdit(member)}
                        />
                      )}
                      {canDelete && (
                        <IconButton
                          icon={Trash2}
                          label={`Delete ${member.student_name}`}
                          variant="ghost"
                          size="sm"
                          className="text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30"
                          onClick={() => remove(member)}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-0">
                    <EmptyState title="No records found" description="No members match your search." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t p-4 dark:border-[#292944]">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={sortedMembers.length}
            perPage={pageSize}
            onPageChange={setPage}
            itemLabel="records"
          />
        </div>
      </div>
    </div>
  )
}
