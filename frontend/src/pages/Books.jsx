import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Pagination from '../components/common/Pagination'

function Books() {
  const { user, hasPermission } = useAuth()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [isbnLookup, setIsbnLookup] = useState('')
  const [isbnLoading, setIsbnLoading] = useState(false)
  const [lookupNotice, setLookupNotice] = useState('')
  const scannerInputRef = useRef(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Advanced Filter Controls State
  const [filters, setFilters] = useState({
    search: '',
    level_id: '',
    category_id: '',
    publication_year: '',
    purchase_year: '',
    availability: '' // '', 'available', 'issued'
  })

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    level_id: '',
    mrp: '',
    create_physical_copy: true,
    category_id: '',
    publication_year: '',
    publisher: '',
    description: '',
    purchase_year: '',
    purchase_price: '',
    location: 'Main Shelf'
  })
  const [levels, setLevels] = useState([])
  const [categories, setCategories] = useState([])

  // State for expanded book copies view & adding copies
  const [expandedBookId, setExpandedBookId] = useState(null)
  const [addCopyBook, setAddCopyBook] = useState(null)
  const [copyFormData, setCopyFormData] = useState({
    purchase_year: '',
    purchase_price: '',
    location: 'Main Shelf',
    condition: 'NEW'
  })

  const canCreate = hasPermission('book.create') || user?.role === 'ADMIN'
  const canEdit = hasPermission('book.edit') || user?.role === 'ADMIN'
  const canDelete = hasPermission('book.delete') || user?.role === 'ADMIN'

  const loadData = async () => {
    try {
      setLoading(true)
      const [booksRes, levelsRes, categoriesRes] = await Promise.all([
        api.get('/books/'),
        api.get('/books/levels'),
        api.get('/books/categories')
      ])
      setBooks(booksRes.data || [])
      setLevels(levelsRes.data || [])
      setCategories(categoriesRes.data || [])
    } catch (err) {
      console.error('Error loading book catalog:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleIsbnLookup = async () => {
    if (!isbnLookup.trim()) return
    setIsbnLoading(true)
    setLookupNotice('')
    try {
      const response = await api.get(`/books/isbn-lookup?isbn=${encodeURIComponent(isbnLookup.trim())}`)
      const data = response.data

      setFormData((prev) => ({
        ...prev,
        title: data.title || prev.title,
        author: data.author || prev.author,
        isbn: data.isbn || isbnLookup.trim(),
        publisher: data.publisher || prev.publisher,
        publication_year: data.publish_date ? String(data.publish_date).split('-')[0] : prev.publication_year,
        level_id: data.level_id ? String(data.level_id) : prev.level_id,
        category_id: data.category_id ? String(data.category_id) : prev.category_id,
        description: data.description || prev.description
      }))

      if (data.source === 'database') {
        setLookupNotice('✅ Found in local library database!')
      } else if (data.source === 'catalog' || data.source === 'google_books' || data.source === 'open_library') {
        setLookupNotice(`✅ Found online (${data.source.replace('_', ' ')})! Details populated.`)
      } else {
        setLookupNotice('ℹ️ ISBN recognized. Please fill in title and author details.')
      }
    } catch (err) {
      setLookupNotice('⚠️ Lookup issue: ' + (err.response?.data?.error || err.message))
    } finally {
      setIsbnLoading(false)
    }
  }

  const handleScannerKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleIsbnLookup()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.put(`/books/${editing}`, formData)
      } else {
        await api.post('/books/', formData)
      }
      setShowForm(false)
      setEditing(null)
      setFormData({
        title: '',
        author: '',
        isbn: '',
        level_id: '',
        mrp: '',
        create_physical_copy: true,
        category_id: '',
        publication_year: '',
        publisher: '',
        description: '',
        purchase_year: '',
        purchase_price: '',
        location: 'Main Shelf'
      })
      setIsbnLookup('')
      await loadData()
    } catch (err) {
      alert('Error saving book: ' + (err.data?.error || err.response?.data?.error || err.message))
    }
  }

  const handleAddCopySubmit = async (e) => {
    e.preventDefault()
    if (!addCopyBook) return
    try {
      await api.post(`/books/${addCopyBook.book_title_id}/copies`, copyFormData)
      setAddCopyBook(null)
      setCopyFormData({
        purchase_year: '',
        purchase_price: '',
        location: 'Main Shelf',
        condition: 'NEW'
      })
      await loadData()
    } catch (err) {
      alert('Error adding copy: ' + (err.data?.error || err.response?.data?.error || err.message))
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this book title and all its copies?')) return
    try {
      await api.delete(`/books/${id}`)
      await loadData()
    } catch (err) {
      alert('Error deleting book: ' + (err.data?.error || err.response?.data?.error || err.message))
    }
  }

  const handleDeleteCopy = async (copyId) => {
    if (!window.confirm('Are you sure you want to delete this physical copy?')) return
    try {
      await api.delete(`/books/copy/${copyId}`)
      await loadData()
    } catch (err) {
      alert('Error deleting copy: ' + (err.data?.error || err.response?.data?.error || err.message))
    }
  }

  // Collect unique Publication and Purchase years dynamically across loaded books
  const availablePublishYears = Array.from(
    new Set(books.map(b => b.publication_year).filter(Boolean))
  ).map(String).sort((a, b) => b - a)

  const availablePurchaseYears = Array.from(
    new Set(
      books.flatMap(b => (b.copies || []).map(c => c.purchase_year)).filter(Boolean)
    )
  ).map(String).sort((a, b) => b - a)

  // Filtered books algorithm
  const filteredBooks = books.filter(b => {
    // 1. Search Text (Book ID, Title, Author, ISBN, Barcode, Publisher, Category, Level, Location, Years)
    if (filters.search) {
      const term = filters.search.toLowerCase().trim()
      const idMatch = String(b.book_title_id).includes(term) || `#${b.book_title_id}`.includes(term)
      const titleMatch = b.title?.toLowerCase().includes(term)
      const authorMatch = b.author?.toLowerCase().includes(term)
      const isbnMatch = b.isbn?.toLowerCase().includes(term)
      const pubMatch = b.publisher?.toLowerCase().includes(term)
      const levelMatch = b.level?.level_code?.toLowerCase().includes(term) || b.level?.level_name?.toLowerCase().includes(term)
      const catMatch = b.category?.category_name?.toLowerCase().includes(term) || b.category?.category_code?.toLowerCase().includes(term)
      const pubYearMatch = String(b.publication_year || '').includes(term)
      const copyMatch = b.copies?.some(c =>
        c.barcode?.toLowerCase().includes(term) ||
        c.location?.toLowerCase().includes(term) ||
        String(c.purchase_year || '').includes(term)
      )
      if (!idMatch && !titleMatch && !authorMatch && !isbnMatch && !pubMatch && !levelMatch && !catMatch && !pubYearMatch && !copyMatch) return false
    }

    // 2. Reading Level Dropdown Filter
    if (filters.level_id) {
      const currentLevelId = b.level_id ?? b.level?.level_id
      if (String(currentLevelId || '') !== String(filters.level_id)) return false
    }

    // 3. Category Dropdown Filter
    if (filters.category_id) {
      const currentCategoryId = b.category_id ?? b.category?.category_id
      if (String(currentCategoryId || '') !== String(filters.category_id)) return false
    }

    // 4. Publish Year Dropdown Filter
    if (filters.publication_year) {
      if (String(b.publication_year || '') !== String(filters.publication_year).trim()) return false
    }

    // 5. Purchase Year Dropdown Filter
    if (filters.purchase_year) {
      const targetPurYr = String(filters.purchase_year).trim()
      const hasMatchingCopy = b.copies?.some(c => c.purchase_year && String(c.purchase_year).trim() === targetPurYr)
      if (!hasMatchingCopy) return false
    }

    // 6. Availability Status Filter
    const availableCopies = b.inventory?.available ?? b.copies?.filter(c => c.status === 'AVAILABLE').length ?? 0
    if (filters.availability === 'available' && availableCopies <= 0) return false
    if (filters.availability === 'issued' && availableCopies > 0) return false

    return true
  }).sort((a, b) => {
    const getBookId = (book) => [...(book.copies || [])]
      .sort((left, right) => String(left.barcode || '').localeCompare(String(right.barcode || ''), undefined, { numeric: true }))
      [0]?.barcode || book.book_title_id
    return String(getBookId(a)).localeCompare(String(getBookId(b)), undefined, { numeric: true })
  })

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.level_id ||
    filters.category_id ||
    filters.publication_year ||
    filters.purchase_year ||
    filters.availability
  )

  const resetFilters = () => {
    setFilters({
      search: '',
      level_id: '',
      category_id: '',
      publication_year: '',
      purchase_year: '',
      availability: ''
    })
  }

  // Reset to page 1 whenever filters or the underlying dataset change
  useEffect(() => {
    setCurrentPage(1)
  }, [
    filters.search,
    filters.level_id,
    filters.category_id,
    filters.publication_year,
    filters.purchase_year,
    filters.availability,
    books.length
  ])

  const totalItems = filteredBooks.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const paginatedBooks = filteredBooks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const getStatusBadge = (status) => {
    const colors = {
      'AVAILABLE': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      'ISSUED': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      'DAMAGED': 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
      'LOST': 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
      'RESERVED': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading book catalog...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Books Category & Inventory</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Manage physical book titles, copies, availability, and shelf locations.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => {
              setShowForm(!showForm)
              setEditing(null)
              setFormData({
                title: '',
                author: '',
                isbn: '',
                level_id: '',
                mrp: '',
                create_physical_copy: true,
                category_id: '',
                publication_year: '',
                publisher: '',
                description: '',
                purchase_year: '',
                purchase_price: '',
                location: 'Main Shelf'
              })
              setIsbnLookup('')
              setTimeout(() => scannerInputRef.current?.focus(), 0)
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors whitespace-nowrap text-sm shadow-sm"
          >
            {showForm ? '✕ Cancel' : '+ Add Book'}
          </button>
        )}
      </div>

      {/* Advanced Filter Controls */}
      <div className="bg-white dark:bg-[#1a1a2e] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a4a] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-gray-100 dark:border-[#2a2a4a] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔍</span>
            <h3 className="font-semibold text-gray-900 dark:text-white text-base">Filter Book Catalog</h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
              Showing {filteredBooks.length} of {books.length} books
            </span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
            >
              <span>↺</span> Reset all filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Search Text
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Book ID, title, author, ISBN..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-8 pr-8 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="absolute left-2.5 top-2 text-xs text-gray-400">🔍</span>
              {filters.search && (
                <button
                  onClick={() => setFilters({ ...filters, search: '' })}
                  className="absolute right-2.5 top-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Reading Level Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Reading Level
            </label>
            <select
              value={filters.level_id}
              onChange={(e) => setFilters({ ...filters, level_id: e.target.value })}
              className="w-full px-2.5 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">All Levels</option>
              {levels.map(l => (
                <option key={l.level_id} value={l.level_id}>
                  {l.level_code ? `${l.level_code} - ${l.level_name}` : l.level_name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Category
            </label>
            <select
              value={filters.category_id}
              onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
              className="w-full px-2.5 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
              ))}
            </select>
          </div>

          {/* Publish Year Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Publish Year
            </label>
            <select
              value={filters.publication_year}
              onChange={(e) => setFilters({ ...filters, publication_year: e.target.value })}
              className="w-full px-2.5 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">All Publish Years</option>
              {availablePublishYears.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          {/* Purchase Year Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Purchase Year
            </label>
            <select
              value={filters.purchase_year}
              onChange={(e) => setFilters({ ...filters, purchase_year: e.target.value })}
              className="w-full px-2.5 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">All Purchase Years</option>
              {availablePurchaseYears.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Stock Availability:</label>
          <div className="flex gap-2">
            <button
              onClick={() => setFilters({ ...filters, availability: '' })}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${!filters.availability ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-[#2a2a4a] text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}
            >
              All Books
            </button>
            <button
              onClick={() => setFilters({ ...filters, availability: 'available' })}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${filters.availability === 'available' ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-[#2a2a4a] text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}
            >
              Available Copies (&gt;0)
            </button>
            <button
              onClick={() => setFilters({ ...filters, availability: 'issued' })}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${filters.availability === 'issued' ? 'bg-amber-600 text-white' : 'bg-gray-100 dark:bg-[#2a2a4a] text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}
            >
              All Issued / Out of Stock
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-[#1a1a2e] rounded-xl p-6 border border-gray-200 dark:border-[#2a2a4a] shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {editing ? 'Edit Book Master Record' : 'Add New Book'}
          </h3>

          {!editing && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex gap-3">
                <input
                  ref={scannerInputRef}
                  type="text"
                  placeholder="Enter or Scan ISBN (e.g. 9780399226908)"
                  value={isbnLookup}
                  onChange={(e) => setIsbnLookup(e.target.value)}
                  onKeyDown={handleScannerKeyDown}
                  inputMode="numeric"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  onClick={handleIsbnLookup}
                  disabled={isbnLoading || !isbnLookup}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isbnLoading ? 'Searching...' : 'Lookup'}
                </button>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                📷 Enter or Scan ISBN to auto-fill book details.
              </p>
              {lookupNotice && (
                <div className="mt-2 text-sm font-medium text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 p-2 rounded-md">
                  {lookupNotice}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. The Very Hungry Caterpillar"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Author *
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="e.g. Eric Carle"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Book Reading Level
                </label>
                <select
                  value={formData.level_id}
                  onChange={(e) => setFormData({ ...formData, level_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select Level</option>
                  {levels.map(l => (
                    <option key={l.level_id} value={l.level_id}>
                      {l.level_code ? `${l.level_code} - ${l.level_name}` : l.level_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Publish Year
                </label>
                <input
                  type="number"
                  placeholder="e.g. 2021"
                  value={formData.publication_year}
                  onChange={(e) => setFormData({ ...formData, publication_year: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Purchase Year <span className="font-normal text-gray-400">(Optional)</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 2024"
                  value={formData.purchase_year}
                  onChange={(e) => setFormData({ ...formData, purchase_year: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ISBN
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9780399226908"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  MRP (₹)
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 499.00"
                  value={formData.mrp}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      mrp: e.target.value
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location / Shelf
                </label>
                <input
                  type="text"
                  placeholder="Main Shelf"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                {editing ? 'Update Book' : 'Create Book'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditing(null) }}
                className="px-4 py-2 bg-gray-200 dark:bg-[#2a2a4a] hover:bg-gray-300 dark:hover:bg-[#3a3a5a] text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal for adding a copy to an existing title */}
      {addCopyBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleAddCopySubmit} className="w-full max-w-md bg-white dark:bg-[#1a1a2e] rounded-xl p-6 border border-gray-200 dark:border-[#2a2a4a] shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Add Physical Copy</h3>
              <button type="button" onClick={() => setAddCopyBook(null)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-lg">✕</button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Adding a new copy for: <strong className="text-gray-900 dark:text-white">{addCopyBook.title}</strong>
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Purchase Year <span className="font-normal text-gray-400">(Optional)</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 2024"
                  value={copyFormData.purchase_year}
                  onChange={(e) => setCopyFormData({ ...copyFormData, purchase_year: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#10101d] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location / Shelf
                </label>
                <input
                  type="text"
                  placeholder="Main Shelf"
                  value={copyFormData.location}
                  onChange={(e) => setCopyFormData({ ...copyFormData, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#10101d] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Condition
                </label>
                <select
                  value={copyFormData.condition}
                  onChange={(e) => setCopyFormData({ ...copyFormData, condition: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#10101d] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="NEW">New</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  <option value="POOR">Poor</option>
                  <option value="DAMAGED">Damaged</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAddCopyBook(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a4a] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a4a] text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
              >
                Save Copy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Books Table */}
      <div className="bg-white dark:bg-[#1a1a2e] rounded-xl border border-gray-200 dark:border-[#2a2a4a] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-[#0f0f1a] text-left text-gray-500 dark:text-gray-400 font-medium">
              <tr>
                <th className="p-3 w-16 text-center">Book ID</th>
                <th className="p-3">Book Title / Author</th>
                <th className="p-3">Level / Category</th>
                <th className="p-3">MRP</th>
                <th className="p-3">Publish / Purchase Year</th>
                <th className="p-3">Inventory Count</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#2a2a4a]">
              {paginatedBooks.map((b) => {
                const totalCopies = b.inventory?.total_copies || b.copies?.length || 0
                const availableCopies = b.inventory?.available ?? totalCopies
                const isExpanded = expandedBookId === b.book_title_id

                // Unique purchase years list across copies
                const purchaseYears = Array.from(new Set((b.copies || []).map(c => c.purchase_year).filter(Boolean)))

                return (
                  <React.Fragment key={b.book_title_id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-[#0f0f1a] transition-colors text-gray-900 dark:text-white">
                      <td className="p-3 text-center">
                        <span className="font-mono font-bold text-xs px-2 py-1 bg-gray-100 dark:bg-[#2a2a4a] text-gray-700 dark:text-gray-300 rounded">
                          {[...(b.copies || [])]
                            .sort((left, right) => String(left.barcode || '').localeCompare(String(right.barcode || ''), undefined, { numeric: true }))[0]?.barcode || b.book_title_id}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <span>{b.title}</span>
                          {b.isbn && <span className="text-xs font-normal text-gray-500 dark:text-gray-400">({b.isbn})</span>}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">By {b.author}</div>
                      </td>

                      <td className="p-3">
                        {b.level ? (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            {b.level.level_code || b.level.level_name}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                        {b.category && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{b.category.category_name}</div>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                        {b.mrp != null
                          ? `₹${Number(b.mrp).toFixed(2)}`
                          : '—'}
                      </td>

                      <td className="p-3 text-xs">
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Publish:</span> {b.publication_year || '—'}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Purchased:</span> {purchaseYears.length ? purchaseYears.join(', ') : '—'}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            📦 {totalCopies === 1 ? '1 Physical' : `${totalCopies} Physical`}
                          </span>
                          <button
                            onClick={() => setExpandedBookId(isExpanded ? null : b.book_title_id)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                          >
                            {isExpanded ? '▲ Hide copies' : '▼ View copies'}
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {availableCopies} Available · {b.inventory?.issued || 0} Issued
                        </div>
                      </td>

                      <td className="p-3 text-xs">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(availableCopies > 0 ? 'AVAILABLE' : 'ISSUED')}`}>
                          {availableCopies > 0 ? 'Available' : 'All Issued'}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {canCreate && (
                            <button
                              onClick={() => {
                                setAddCopyBook(b)
                                setCopyFormData({
                                  purchase_year: '',
                                  purchase_price: '',
                                  location: 'Main Shelf',
                                  condition: 'NEW'
                                })
                              }}
                              className="px-2.5 py-1 text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/80 rounded-md font-semibold transition-colors border border-emerald-300 dark:border-emerald-800"
                              title="Add another copy with a different purchase/publication year to this title"
                            >
                              + Add Copy
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => {
                                setEditing(b.book_title_id)
                                setFormData({
                                  title: b.title || '',
                                  author: b.author || '',
                                  isbn: b.isbn || '',
                                  level_id: b.level_id || '',
                                  mrp: b.mrp ?? '',
                                  create_physical_copy: true,
                                  category_id: b.category_id || '',
                                  publication_year: b.publication_year || '',
                                  publisher: b.publisher || '',
                                  description: b.description || '',
                                  purchase_year: b.copies?.[0]?.purchase_year || b.publication_year || '',
                                  purchase_price: b.copies?.[0]?.purchase_price || '',
                                  location: b.copies?.[0]?.location || 'Main Shelf'
                                })
                                setShowForm(true)
                              }}
                              className="px-2.5 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 font-medium transition-colors"
                            >
                              Edit
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(b.book_title_id)}
                              className="px-2.5 py-1 text-xs bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-md hover:bg-rose-200 dark:hover:bg-rose-900/50 font-medium transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Copies View */}
                    {isExpanded && (
                      <tr className="bg-gray-50/80 dark:bg-[#10101d]">
                        <td colSpan="7" className="p-4">
                          <div className="rounded-lg border border-gray-200 dark:border-[#2a2a4a] bg-white dark:bg-[#1a1a2e] p-3 space-y-2">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                Registered Physical Copies for &quot;{b.title}&quot; ({totalCopies} {totalCopies === 1 ? 'Copy' : 'Copies'} Total)
                              </h4>
                              {canCreate && (
                                <button
                                  onClick={() => {
                                    setAddCopyBook(b)
                                    setCopyFormData({
                                      purchase_year: '',
                                      purchase_price: '',
                                      location: 'Main Shelf',
                                      condition: 'NEW'
                                    })
                                  }}
                                  className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                                >
                                  + Add Copy
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {(b.copies || []).map((c) => (
                                <div key={c.book_copy_id} className="p-2.5 rounded-lg border border-gray-200 dark:border-[#2a2a4a] bg-gray-50 dark:bg-[#10101d] text-xs space-y-1">
                                  <div className="flex justify-between items-center font-mono font-bold text-gray-900 dark:text-white">
                                    <span>Barcode: {c.barcode || '—'}</span>
                                    <span className={`px-2 py-0.5 text-[10px] rounded-full ${getStatusBadge(c.status)}`}>
                                      {c.status}
                                    </span>
                                  </div>
                                  <div className="text-gray-600 dark:text-gray-400 flex justify-between">
                                    <span>Purchased: {c.purchase_year || 'N/A'}</span>
                                    <span>Published: {b.publication_year || 'N/A'}</span>
                                  </div>
                                  <div className="text-gray-500 dark:text-gray-400 flex justify-between">
                                    <span>Shelf: {c.location || 'Main Shelf'}</span>
                                    <span>Cond: {c.condition || 'NEW'}</span>
                                  </div>
                                  {canDelete && (
                                    <div className="text-right pt-1">
                                      <button
                                        onClick={() => handleDeleteCopy(c.book_copy_id)}
                                        className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline"
                                      >
                                        Delete copy
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}

              {filteredBooks.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No books found matching your search and filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredBooks.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-[#2a2a4a]">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              perPage={pageSize}
              onPageChange={setCurrentPage}
              itemLabel="books"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default Books
