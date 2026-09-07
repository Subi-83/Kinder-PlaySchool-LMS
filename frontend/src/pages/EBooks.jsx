import React, { useEffect, useMemo, useState } from 'react'
import { Plus, Search, BookOpen, Pencil, Trash2 } from 'lucide-react'
import api from '../services/api'
import Pagination from '../components/common/Pagination'
import { showAlert } from '../components/common/Alert'
import { useAuth } from '../context/AuthContext'
import { PageHeader, Button, IconButton, EmptyState, LoadingState, SortableTh, useSortableData } from '../components/ui'

const emptyForm = () => ({
  title: '',
  author: '',
  level_id: '',
  category_id: '',
  publication_year: '',
  publisher: '',
  purchase_year: '',
  isbn: ''
})

const validateClientIsbn = (isbn) => {
  if (!isbn) return true
  const raw = isbn.replace(/[-\s]/g, '').toUpperCase()
  if (raw.length === 10) {
    if (!/^\d{9}[\dX]$/.test(raw)) return false
    let total = 0
    for (let i = 0; i < 9; i++) total += parseInt(raw[i], 10) * (10 - i)
    total += raw[9] === 'X' ? 10 : parseInt(raw[9], 10)
    return total % 11 === 0
  } else if (raw.length === 13) {
    if (!/^\d{13}$/.test(raw)) return false
    let total = 0
    for (let i = 0; i < 12; i++) total += parseInt(raw[i], 10) * (i % 2 === 0 ? 1 : 3)
    const check = (10 - (total % 10)) % 10
    return parseInt(raw[12], 10) === check
  }
  return false
}

function EBooks() {
  const { user, hasPermission } = useAuth()
  const [ebooks, setEbooks] = useState([])
  const [levels, setLevels] = useState([])
  const [categories, setCategories] = useState([])
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

  const loadMasterData = async () => {
    try {
      const [levelsRes, catsRes] = await Promise.all([
        api.get('/books/levels'),
        api.get('/books/categories')
      ])
      setLevels(levelsRes.data || [])
      setCategories(catsRes.data || [])
    } catch (err) {
      console.error('Failed to load master data for levels/categories:', err)
    }
  }

  const load = async () => {
    try {
      setLoading(true)
      const ebooksRes = await api.get('/books/ebooks')
      setEbooks(ebooksRes.data || [])
      await loadMasterData()
    } catch {
      // Handled by api interceptors
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return ebooks
    return ebooks.filter((book) => {
      const idStr = book.e_book_id || ''
      const titleStr = book.title || ''
      const authorStr = book.author || ''
      const levelStr = `${book.level_code || ''} ${book.reading_level || book.level_name || ''}`
      const catStr = `${book.category?.category_code || ''} ${book.category_name || ''}`
      const pubYrStr = String(book.publish_year || book.publication_year || '')
      const purYrStr = String(book.purchase_year || '')
      const publisherStr = book.publisher || ''
      const isbnStr = book.isbn || ''
      const combined = `${idStr} ${titleStr} ${authorStr} ${levelStr} ${catStr} ${pubYrStr} ${purYrStr} ${publisherStr} ${isbnStr}`.toLowerCase()
      return combined.includes(term)
    })
  }, [ebooks, search])

  const { sortedItems: sortedEbooks, requestSort, directionFor } = useSortableData(filtered, null, (row, key) => {
    if (key === 'reading_level') return row.reading_level || row.level_name || row.level?.level_name || ''
    if (key === 'category_name') return row.category_name || row.category?.category_name || ''
    if (key === 'publish_year') return row.publish_year || row.publication_year || 0
    return row[key]
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const rows = sortedEbooks.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => { setCurrentPage(1) }, [search])
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages) }, [currentPage, totalPages])

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm())
    loadMasterData()
    setShowForm(true)
  }

  const openEdit = (book) => {
    setEditing(book.book_title_id)
    setForm({
      title: book.title || '',
      author: book.author || '',
      level_id: book.level_id || (book.level?.level_id ?? ''),
      category_id: book.category_id || (book.category?.category_id ?? ''),
      publication_year: book.publication_year || book.publish_year || '',
      publisher: book.publisher || '',
      purchase_year: book.purchase_year || '',
      isbn: book.isbn || ''
    })
    loadMasterData()
    setShowForm(true)
  }

  const handleLevelChange = (selectedLevelId) => {
    setForm((prev) => ({ ...prev, level_id: selectedLevelId }))
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!form.title.trim()) {
      showAlert('Title is required.', 'warning')
      return
    }
    if (!form.author.trim()) {
      showAlert('Author is required.', 'warning')
      return
    }
    if (!form.level_id) {
      showAlert('Book Reading Level is required.', 'warning')
      return
    }

    const pubYearStr = String(form.publication_year || '').trim()
    if (pubYearStr && !/^\d{4}$/.test(pubYearStr)) {
      showAlert('Publish Year must be a valid 4-digit year (e.g. 2021).', 'warning')
      return
    }

    const purYearStr = String(form.purchase_year || '').trim()
    if (purYearStr && !/^\d{4}$/.test(purYearStr)) {
      showAlert('Purchase Year must be a valid 4-digit year (e.g. 2024).', 'warning')
      return
    }

    if (pubYearStr && purYearStr) {
      if (parseInt(purYearStr, 10) < parseInt(pubYearStr, 10)) {
        showAlert(`Purchase Year (${purYearStr}) cannot be earlier than Publish Year (${pubYearStr}).`, 'warning')
        return
      }
    }

    const isbnStr = String(form.isbn || '').trim()
    if (isbnStr && !validateClientIsbn(isbnStr)) {
      showAlert('Invalid ISBN. Please enter a valid ISBN-10 or ISBN-13.', 'warning')
      return
    }

    try {
      setSaving(true)
      const payload = {
        title: form.title.trim(),
        author: form.author.trim(),
        level_id: Number(form.level_id),
        category_id: form.category_id ? Number(form.category_id) : null,
        publish_year: pubYearStr ? parseInt(pubYearStr, 10) : null,
        publication_year: pubYearStr ? parseInt(pubYearStr, 10) : null,
        purchase_year: purYearStr ? parseInt(purYearStr, 10) : null,
        publisher: form.publisher ? form.publisher.trim() : null,
        isbn: isbnStr || null,
        create_physical_copy: false,
        ebook_count: 1
      }

      if (editing) {
        await api.put(`/books/ebooks/${editing}`, payload)
        showAlert('E-book updated successfully.', 'success')
      } else {
        const res = await api.post('/books/ebooks', payload)
        showAlert(`E-book saved successfully (ID: ${res.data.e_book_id}).`, 'success')
      }
      setShowForm(false)
      setEditing(null)
      setForm(emptyForm())
      await load()
    } catch (err) {
      showAlert(err.data?.error || err.response?.data?.error || err.message || 'Error saving e-book.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (book) => {
    const bookLabel = book.e_book_id ? `${book.e_book_id} - ${book.title}` : book.title
    if (!window.confirm(`Remove the e-book record for "${bookLabel}"? Physical copies, if any, will remain.`)) return
    try {
      await api.delete(`/books/ebooks/${book.book_title_id}`)
      showAlert('E-book record removed.', 'success')
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
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search E-Book ID, title, author, reading level, category, ISBN, publisher..."
            className="w-full rounded-xl border border-gray-300 bg-white pl-9 pr-3.5 py-2 text-sm dark:border-gray-700 dark:bg-[#10101d] dark:text-white"
          />
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <form onSubmit={submit} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-[#292944] dark:bg-[#17172a]">
            <h3 className="text-lg font-bold dark:text-white">{editing ? 'Edit E-book Record' : 'Add E-book Record'}</h3>
            
            {/* Exact field order required */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Title * */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. The Very Hungry Caterpillar"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm dark:border-gray-700 dark:bg-[#10101d] dark:text-white"
                />
              </div>

              {/* Author * */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300 mb-1">
                  Author *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Eric Carle"
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm dark:border-gray-700 dark:bg-[#10101d] dark:text-white"
                />
              </div>

              {/* Book Reading Level * */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300 mb-1">
                  Book Reading Level *
                </label>
                <select
                  required
                  value={form.level_id}
                  onChange={(e) => handleLevelChange(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm dark:border-gray-700 dark:bg-[#10101d] dark:text-white"
                >
                  <option value="">Select Level</option>
                  {levels.filter((l) => l.is_active !== false).map((l) => (
                    <option key={l.level_id} value={l.level_id}>
                      {l.level_code ? `${l.level_code} - ${l.level_name}` : l.level_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm dark:border-gray-700 dark:bg-[#10101d] dark:text-white"
                >
                  <option value="">Select Category</option>
                  {categories.filter((c) => c.is_active !== false).map((c) => (
                    <option key={c.category_id} value={c.category_id}>
                      {c.category_code ? `${c.category_code} - ${c.category_name}` : c.category_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. Publish Year */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300 mb-1">
                  Publish Year
                </label>
                <input
                  type="text"
                  maxLength="4"
                  placeholder="e.g. 2021"
                  value={form.publication_year}
                  onChange={(e) => setForm({ ...form, publication_year: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm dark:border-gray-700 dark:bg-[#10101d] dark:text-white"
                />
              </div>

              {/* 7. Publisher (Optional) */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300 mb-1">
                  Publisher (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Example Publisher"
                  value={form.publisher}
                  onChange={(e) => setForm({ ...form, publisher: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm dark:border-gray-700 dark:bg-[#10101d] dark:text-white"
                />
              </div>

              {/* 8. Purchase Year (Optional) */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300 mb-1">
                  Purchase Year (Optional)
                </label>
                <input
                  type="text"
                  maxLength="4"
                  placeholder="e.g. 2024"
                  value={form.purchase_year}
                  onChange={(e) => setForm({ ...form, purchase_year: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm dark:border-gray-700 dark:bg-[#10101d] dark:text-white"
                />
              </div>

              {/* 9. ISBN */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-300 mb-1">
                  ISBN
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9780399226908"
                  value={form.isbn}
                  onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm dark:border-gray-700 dark:bg-[#10101d] dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>{saving ? 'Saving E-Book...' : 'Save E-Book'}</Button>
            </div>
          </form>
        </div>
      )}

      {/* E-Book Listing Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-[#292944] dark:bg-[#17172a]">
        {loading ? <LoadingState label="Loading e-book records..." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left text-xs uppercase dark:bg-[#22223a] dark:text-gray-300">
                <tr>
                  <SortableTh sortKey="e_book_id" direction={directionFor('e_book_id')} onSort={requestSort} className="px-4 py-3">E-Book ID</SortableTh>
                  <SortableTh sortKey="title" direction={directionFor('title')} onSort={requestSort} className="px-4 py-3">Title</SortableTh>
                  <SortableTh sortKey="author" direction={directionFor('author')} onSort={requestSort} className="px-4 py-3">Author</SortableTh>
                  <SortableTh sortKey="reading_level" direction={directionFor('reading_level')} onSort={requestSort} className="px-4 py-3">Reading Level</SortableTh>
                  <SortableTh sortKey="category_name" direction={directionFor('category_name')} onSort={requestSort} className="px-4 py-3">Category</SortableTh>
                  <SortableTh sortKey="publish_year" direction={directionFor('publish_year')} onSort={requestSort} className="px-4 py-3">Publish Year</SortableTh>
                  <SortableTh sortKey="publisher" direction={directionFor('publisher')} onSort={requestSort} className="px-4 py-3">Publisher</SortableTh>
                  <SortableTh sortKey="purchase_year" direction={directionFor('purchase_year')} onSort={requestSort} className="px-4 py-3">Purchase Year</SortableTh>
                  <SortableTh sortKey="isbn" direction={directionFor('isbn')} onSort={requestSort} className="px-4 py-3">ISBN</SortableTh>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#292944]">
                {rows.map((book) => (
                  <tr key={book.book_title_id} className="hover:bg-blue-50/20 dark:hover:bg-[#0f0f1a] transition-colors dark:text-white">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {book.e_book_id || '—'}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{book.title}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{book.author}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {book.level_code ? `${book.level_code} - ${book.reading_level || book.level_name}` : (book.reading_level || book.level_name || book.level?.level_name || '—')}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {book.category?.category_code ? `${book.category.category_code} - ${book.category_name || book.category.category_name}` : (book.category_name || book.category?.category_name || '—')}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {book.publish_year || book.publication_year || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{book.publisher || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{book.purchase_year || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{book.isbn || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {canEdit && <IconButton icon={Pencil} label="Edit" size="sm" onClick={() => openEdit(book)} />}
                        {canDelete && <IconButton icon={Trash2} label="Delete" size="sm" onClick={() => remove(book)} />}
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan="10" className="p-0">
                      <EmptyState icon={BookOpen} title="No e-book records found" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-gray-200 px-4 py-3 dark:border-[#292944]">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            perPage={pageSize}
            onPageChange={setCurrentPage}
            itemLabel="e-books"
          />
        </div>
      </div>
    </div>
  )
}

export default EBooks

