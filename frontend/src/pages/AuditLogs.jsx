import React, { useState, useEffect } from 'react'
import { ScrollText } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Pagination from '../components/common/Pagination'
import { PageHeader, Badge, LoadingState, EmptyState, ColumnVisibilityMenu, useColumnVisibility, SortableTh, useSortableData } from '../components/ui'

const COLUMNS = [
  { key: 'user', label: 'User' },
  { key: 'action', label: 'Action' },
  { key: 'module', label: 'Module' },
  { key: 'details', label: 'Details' },
  { key: 'date', label: 'Date' },
]

function AuditLogs() {
  const { user } = useAuth()
  const { isVisible, toggle, reset, hiddenCount } = useColumnVisibility('audit-logs', COLUMNS)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalLogs, setTotalLogs] = useState(0)

  const perPage = 10

  const loadLogs = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/audit/?limit=${perPage}&offset=${(currentPage - 1) * perPage}`)
      setLogs(response.data.logs || [])
      setTotalLogs(response.data.total || 0)
    } catch (err) {
      console.error('Error loading audit logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [currentPage])

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase())

    if (filter === 'all') return matchesSearch
    return matchesSearch && log.module === filter
  })

  const modules = [...new Set(logs.map(l => l.module).filter(Boolean))]

  // Logs are paginated server-side, so sorting acts on the current page
  // of results (the page already loaded), not the entire audit trail.
  const { sortedItems: sortedLogs, requestSort, directionFor } = useSortableData(
    filteredLogs,
    null,
    (row, key) => (key === 'user' ? (row.username || 'System') : key === 'date' ? row.created_at : row[key])
  )

  const totalPages = Math.ceil(totalLogs / perPage)

  return (
    <div className="space-y-4">
      <PageHeader title="Audit Logs" description="Complete system audit trail" />

      {loading ? (
        <LoadingState label="Loading audit logs…" />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full sm:w-48 px-3 py-2 rounded-lg border border-gray-300 dark:border-[#2a2a4a] bg-white dark:bg-[#0f0f1a] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Modules</option>
                {modules.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <ColumnVisibilityMenu columns={COLUMNS} isVisible={isVisible} onToggle={toggle} onReset={reset} hiddenCount={hiddenCount} />
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a1a2e] rounded-xl border border-gray-200 dark:border-[#2a2a4a] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-[#0f0f1a]">
                  <tr>
                    <SortableTh sortKey="user" direction={directionFor('user')} onSort={requestSort} className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 ${isVisible('user') ? '' : 'hidden'}`}>User</SortableTh>
                    <SortableTh sortKey="action" direction={directionFor('action')} onSort={requestSort} className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 ${isVisible('action') ? '' : 'hidden'}`}>Action</SortableTh>
                    <SortableTh sortKey="module" direction={directionFor('module')} onSort={requestSort} className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 ${isVisible('module') ? '' : 'hidden'}`}>Module</SortableTh>
                    <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${isVisible('details') ? '' : 'hidden'}`}>Details</th>
                    <SortableTh sortKey="date" direction={directionFor('date')} onSort={requestSort} className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 ${isVisible('date') ? '' : 'hidden'}`}>Date</SortableTh>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-[#2a2a4a]">
                  {sortedLogs.map(log => (
                    <tr key={log.audit_id} className="hover:bg-gray-50 dark:hover:bg-[#0f0f1a]">
                      <td className={`px-4 py-3 text-sm font-medium text-gray-900 dark:text-white ${isVisible('user') ? '' : 'hidden'}`}>{log.username || 'System'}</td>
                      <td className={`px-4 py-3 text-sm ${isVisible('action') ? '' : 'hidden'}`}>
                        <Badge tone="info">{log.action}</Badge>
                      </td>
                      <td className={`px-4 py-3 text-sm text-gray-500 dark:text-gray-400 ${isVisible('module') ? '' : 'hidden'}`}>{log.module || '-'}</td>
                      <td className={`px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate ${isVisible('details') ? '' : 'hidden'}`}>
                        {log.details || '-'}
                      </td>
                      <td className={`px-4 py-3 text-sm text-gray-500 dark:text-gray-400 ${isVisible('date') ? '' : 'hidden'}`}>
                        {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredLogs.length === 0 && (
                <EmptyState icon={ScrollText} title="No audit logs found" />
              )}
            </div>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalLogs}
            perPage={perPage}
            onPageChange={setCurrentPage}
            itemLabel="logs"
          />
        </>
      )}
    </div>
  )
}

export default AuditLogs
