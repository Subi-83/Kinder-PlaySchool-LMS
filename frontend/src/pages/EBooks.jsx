import React, { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import Pagination from '../components/common/Pagination'
import { useAuth } from '../context/AuthContext'

const emptyForm = () => ({
  title: '', author: '', isbn: '', ebook_count: 1, publication_year: '',
  publisher: '', description: '', create_physical_copy: false
})

function EBooks() {
  const { user, hasPermission } = useAuth()
  const [ebooks, setEbooks] = useState([])
  const [form, setForm] = useState(emptyForm())
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const canCreate = user?.role === 'ADMIN' || hasPermission('book.create')
  const canEdit = user?.role === 'ADMIN' || hasPermission('book.edit')
  const canDelete = user?.role === 'ADMIN' || hasPermission('book.delete')

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get('/books/ebooks')
      setEbooks(response.data || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load e-book records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return ebooks
    return ebooks.filter((book) => `${book.title} ${book.author} ${book.isbn || ''} ${book.publisher || ''}`.toLowerCase().includes(term))
  }, [ebooks, search])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => { setCurrentPage(1) }, [search])
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages) }, [currentPage, totalPages])

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  const openEdit = (book) => {
    setEditing(book.book_title_id)
    setForm({
      title: book.title || '', author: book.author || '', isbn: book.isbn || '',
      ebook_count: Number(book.ebook_count || 1), publication_year: book.publication_year || '',
      publisher: book.publisher || '', description: book.description || '', create_physical_copy: false
    })
    setShowForm(true)
  }

  const submit = async (event) => {
    event.preventDefault()
    try {
      setSaving(true)
      setError('')
      const payload = { ...form, ebook_count: Math.max(1, Number(form.ebook_count) || 1), create_physical_copy: false }
      if (editing) await api.put(`/books/${editing}`, payload)
      else await api.post('/books/', payload)
      setShowForm(false)
      setEditing(null)
      setForm(emptyForm())
      await load()
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Unable to save the e-book record.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (book) => {
    if (!window.confirm(`Remove the e-book record for "${book.title}"? Physical copies, if any, will remain.`)) return
    try {
      setError('')
      await api.delete(`/books/ebooks/${book.book_title_id}`)
      await load()
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to remove the e-book record.')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">E-book Register</h2>
          <p className="text-gray-500 dark:text-gray-400">Information-only records. E-books cannot be issued or returned.</p>
        </div>
        {canCreate && <button onClick={openAdd} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700">+ Add E-book</button>}
      </div>

      {error && <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">{error}</div>}

      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[#292944] dark:bg-[#17172a]">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, author, ISBN, or publisher..." className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm dark:border-gray-700 dark:bg-[#10101d] dark:text-white" />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <form onSubmit={submit} className="w-full max-w-2xl space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-[#292944] dark:bg-[#17172a]">
            <h3 className="text-lg font-bold dark:text-white">{editing ? 'Edit E-book Record' : 'Add E-book Record'}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ['title', 'Title', true], ['author', 'Author', true], ['isbn', 'ISBN'],
                ['ebook_count', 'Record Count', true, 'number'], ['publication_year', 'Publication Year', false, 'number'], ['publisher', 'Publisher']
              ].map(([key, label, required, type]) => (
                <label key={key} className="text-xs font-bold uppercase text-gray-600 dark:text-gray-300">{label}{required ? ' *' : ''}
                  <input required={required} min={key === 'ebook_count' ? 1 : undefined} type={type || 'text'} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm normal-case dark:border-gray-700 dark:bg-[#10101d] dark:text-white" />
                </label>
              ))}
            </div>
            <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300">Notes
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows="3" className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm normal-case dark:border-gray-700 dark:bg-[#10101d] dark:text-white" />
            </label>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-bold dark:bg-gray-700 dark:text-white">Cancel</button><button disabled={saving} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button></div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-[#292944] dark:bg-[#17172a]">
        {loading ? <div className="p-12 text-center text-gray-500">Loading e-book records...</div> : (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-100 text-left text-xs uppercase dark:bg-[#22223a] dark:text-gray-300"><tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Author</th><th className="px-4 py-3">ISBN</th><th className="px-4 py-3">Publisher / Year</th><th className="px-4 py-3">Count</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-gray-200 dark:divide-[#292944]">{rows.map((book) => <tr key={book.book_title_id} className="dark:text-white"><td className="px-4 py-3 font-bold">{book.title}</td><td className="px-4 py-3">{book.author}</td><td className="px-4 py-3">{book.isbn || '—'}</td><td className="px-4 py-3">{book.publisher || '—'}{book.publication_year ? ` / ${book.publication_year}` : ''}</td><td className="px-4 py-3 font-bold">{book.ebook_count}</td><td className="px-4 py-3 text-right space-x-3">{canEdit && <button onClick={() => openEdit(book)} className="text-blue-600">Edit</button>}{canDelete && <button onClick={() => remove(book)} className="text-rose-600">Delete</button>}</td></tr>)}{rows.length === 0 && <tr><td colSpan="6" className="px-4 py-10 text-center text-gray-500">No e-book records found.</td></tr>}</tbody></table></div>
        )}
        <div className="border-t border-gray-200 px-4 py-3 dark:border-[#292944]"><Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} perPage={pageSize} onPageChange={setCurrentPage} itemLabel="e-books" /></div>
      </div>
    </div>
  )
}

export default EBooks
