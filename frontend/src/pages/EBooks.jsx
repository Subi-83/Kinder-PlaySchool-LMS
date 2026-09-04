import React, { useEffect, useMemo, useState } from 'react'
import { Plus, Search, BookOpen, Pencil, Trash2 } from 'lucide-react'
import api from '../services/api'
import Pagination from '../components/common/Pagination'
import { showAlert } from '../components/common/Alert'
import { useAuth } from '../context/AuthContext'
import { PageHeader, Button, IconButton, EmptyState, LoadingState, SortableTh, useSortableData } from '../components/ui'

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
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const canCreate = user?.role === 'ADMIN' || hasPermission('ebook.create')
  const canEdit = user?.role === 'ADMIN' || hasPermission('ebook.edit')
  const canDelete = user?.role === 'ADMIN' || hasPermission('ebook.delete')

  const load = async () => {
    try {
      setLoading(true)
      const response = await api.get('/books/ebooks')
      setEbooks(response.data || [])
    } catch {
      // API errors are displayed by Alert.jsx.
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
  const { sortedItems: sortedEbooks, requestSort, directionFor } = useSortableData(filtered, null, (row, key) => {
    if (key === 'publisher_year') return row.publisher || ''
    return row[key]
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const rows = sortedEbooks.slice((currentPage - 1) * pageSize, currentPage * pageSize)

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
    if (!form.title.trim() || !form.author.trim()) {
      showAlert('Enter both the e-book title and author.', 'warning')
      return
    }
    try {
      setSaving(true)
      const payload = { ...form, ebook_count: Math.max(1, Number(form.ebook_count) || 1), create_physical_copy: false }
      if (editing) await api.put(`/books/${editing}`, payload)
      else await api.post('/books/', payload)
      showAlert(editing ? 'E-book updated successfully.' : 'E-book added successfully.', 'success')
      setShowForm(false)
      setEditing(null)
      setForm(emptyForm())
      await load()
    } catch {
      // API errors, including duplicate warnings, are displayed by Alert.jsx.
    } finally {
      setSaving(false)
    }
  }

  const remove = async (book) => {
    if (!window.confirm(`Remove the e-book record for "${book.title}"? Physical copies, if any, will remain.`)) return
    try {
      await api.delete(`/books/ebooks/${book.book_title_id}`)
      await load()
    } catch {
      // API errors are displayed by Alert.jsx.
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="E-book Register"
        description="Information-only records. E-books cannot be issued or returned."
        actions={canCreate && <Button icon={Plus} onClick={openAdd}>Add E-book</Button>}
      />

      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[#292944] dark:bg-[#17172a]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, author, ISBN, or publisher..." className="w-full rounded-xl border border-gray-300 bg-white pl-9 pr-3.5 py-2 text-sm dark:border-gray-700 dark:bg-[#10101d] dark:text-white" />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <form onSubmit={submit} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-[#292944] dark:bg-[#17172a]">
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
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>{saving ? 'Saving...' : 'Save'}</Button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-[#292944] dark:bg-[#17172a]">
        {loading ? <LoadingState label="Loading e-book records..." /> : (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-100 text-left text-xs uppercase dark:bg-[#22223a] dark:text-gray-300"><tr>
            <SortableTh sortKey="title" direction={directionFor('title')} onSort={requestSort} className="px-4 py-3">Title</SortableTh>
            <SortableTh sortKey="author" direction={directionFor('author')} onSort={requestSort} className="px-4 py-3">Author</SortableTh>
            <SortableTh sortKey="isbn" direction={directionFor('isbn')} onSort={requestSort} className="px-4 py-3">ISBN</SortableTh>
            <SortableTh sortKey="publisher_year" direction={directionFor('publisher_year')} onSort={requestSort} className="px-4 py-3">Publisher / Year</SortableTh>
            <SortableTh sortKey="ebook_count" direction={directionFor('ebook_count')} onSort={requestSort} className="px-4 py-3">Count</SortableTh>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-200 dark:divide-[#292944]">{rows.map((book) => <tr key={book.book_title_id} className="dark:text-white"><td className="px-4 py-3 font-bold">{book.title}</td><td className="px-4 py-3">{book.author}</td><td className="px-4 py-3">{book.isbn || '—'}</td><td className="px-4 py-3">{book.publisher || '—'}{book.publication_year ? ` / ${book.publication_year}` : ''}</td><td className="px-4 py-3 font-bold">{book.ebook_count}</td><td className="px-4 py-3 text-right"><div className="flex justify-end gap-1">{canEdit && <IconButton icon={Pencil} label="Edit" size="sm" onClick={() => openEdit(book)} />}{canDelete && <IconButton icon={Trash2} label="Delete" size="sm" onClick={() => remove(book)} />}</div></td></tr>)}{rows.length === 0 && <tr><td colSpan="6" className="p-0"><EmptyState icon={BookOpen} title="No e-book records found" /></td></tr>}</tbody></table></div>
        )}
        <div className="border-t border-gray-200 px-4 py-3 dark:border-[#292944]"><Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} perPage={pageSize} onPageChange={setCurrentPage} itemLabel="e-books" /></div>
      </div>
    </div>
  )
}

export default EBooks
