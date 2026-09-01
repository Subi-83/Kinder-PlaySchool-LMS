import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import Pagination from '../components/common/Pagination'

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
  const canCreate = user?.role === 'ADMIN' || hasPermission('student.create')
  const canEdit = user?.role === 'ADMIN' || hasPermission('student.edit')
  const canDelete = user?.role === 'ADMIN' || hasPermission('student.delete')

  const load = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/students/group/${encodeURIComponent(groupCode)}`)
      setGroup(response.data?.group || null)
      setMembers(response.data?.members || [])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [groupCode])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return !q ? members : members.filter((member) => [member.student_uid, member.student_name, member.school_name, member.mother_name, member.mother_phone, member.father_name, member.father_phone].filter(Boolean).join(' ').toLowerCase().includes(q))
  }, [members, search])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize)
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
      setShowForm(false); setEditing(null); setForm(emptyForm()); await load()
    } catch (_) {
      // Alert.jsx displays validation and API errors.
    }
  }
  const remove = async (member) => {
    if (!window.confirm(`Delete ${member.student_name}?`)) return
    try { await api.delete(`/students/${member.student_id}`); await load() } catch (_) {}
  }

  if (loading) return <div className="py-20 text-center text-gray-500">Loading group records...</div>
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-bold dark:text-white">{group?.group_name || 'Member Group'}</h2><p className="text-sm text-gray-500">Personal student records only{group?.library_enabled ? ' with optional library features' : ' — no library, programme, deposit, or subscription records'}.</p></div>{canCreate && <button onClick={() => { setEditing(null); setForm(emptyForm()); setShowForm(true) }} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white">+ Add {group?.singular_label || 'Student'}</button>}</div>
    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, ID, school, or parent..." className="w-full rounded-xl border bg-white px-4 py-2.5 dark:border-gray-700 dark:bg-[#17172a]" />
    {showForm && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4"><form onSubmit={save} className="my-6 w-full max-w-3xl space-y-4 rounded-2xl bg-white p-6 dark:bg-[#17172a]"><h3 className="text-lg font-bold">{editing ? 'Edit' : 'Add'} {group?.singular_label}</h3><div className="grid gap-3 md:grid-cols-3">{[
      ['student_name','Student Name','text',true],['date_of_birth','Date of Birth','date',true],['gender','Gender'],['school_name','School'],['student_email','Email','email'],['mother_name',"Mother's Name"],['mother_phone',"Mother's Phone",'tel'],['mother_email',"Mother's Email",'email'],['father_name',"Father's Name"],['father_phone',"Father's Phone",'tel'],['father_email',"Father's Email",'email'],['emergency_contact_name','Emergency Contact'],['emergency_contact_phone','Emergency Phone','tel']
    ].map(([key,label,type='text',required=false]) => key === 'gender' ? <label key={key} className="text-xs font-bold uppercase">{label}<select value={form.gender} onChange={(e) => setForm({...form,gender:e.target.value})} className="mt-1 w-full rounded-xl border px-3 py-2 dark:bg-[#10101d]"><option>MALE</option><option>FEMALE</option><option>OTHER</option></select></label> : <label key={key} className="text-xs font-bold uppercase">{label}{required && ' *'}<input required={required} type={type} value={form[key]} onChange={(e) => setForm({...form,[key]:e.target.value})} className="mt-1 w-full rounded-xl border px-3 py-2 normal-case dark:bg-[#10101d]" /></label>)}</div><div className="grid gap-3 md:grid-cols-2"><textarea value={form.address} onChange={(e) => setForm({...form,address:e.target.value})} placeholder="Address" className="rounded-xl border p-3 dark:bg-[#10101d]"/><textarea value={form.medical_notes} onChange={(e) => setForm({...form,medical_notes:e.target.value})} placeholder="Medical notes" className="rounded-xl border p-3 dark:bg-[#10101d]"/></div><div className="flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-xl bg-gray-200 px-4 py-2 dark:bg-gray-700">Cancel</button><button className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white">Save</button></div></form></div>}
    <div className="overflow-hidden rounded-2xl border bg-white dark:border-[#292944] dark:bg-[#17172a]"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-100 text-left text-xs uppercase dark:bg-[#22223a]"><tr><th className="p-3">ID</th><th className="p-3">Student</th><th className="p-3">DOB / Gender</th><th className="p-3">School</th><th className="p-3">Parents</th><th className="p-3 text-right">Actions</th></tr></thead><tbody>{rows.map((member) => <tr key={member.student_id} className="border-t dark:border-[#292944]"><td className="p-3 font-mono text-blue-600">{member.student_uid}</td><td className="p-3 font-bold">{member.student_name}</td><td className="p-3">{member.date_of_birth || '—'}<div className="text-xs text-gray-500">{member.gender || '—'}</div></td><td className="p-3">{member.school_name || '—'}</td><td className="p-3 text-xs">{member.mother_name || '—'} {member.mother_phone && `(${member.mother_phone})`}<div className="text-gray-500">{member.father_name || '—'} {member.father_phone && `(${member.father_phone})`}</div></td><td className="p-3 text-right space-x-2">{canEdit && <button onClick={() => openEdit(member)} className="text-blue-600">Edit</button>}{canDelete && <button onClick={() => remove(member)} className="text-rose-600">Delete</button>}</td></tr>)}{rows.length === 0 && <tr><td colSpan="6" className="p-10 text-center text-gray-500">No records found.</td></tr>}</tbody></table></div><div className="border-t p-4 dark:border-[#292944]"><Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} perPage={pageSize} onPageChange={setPage} itemLabel="records" /></div></div>
  </div>
}
