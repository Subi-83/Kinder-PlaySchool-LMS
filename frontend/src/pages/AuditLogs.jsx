import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Pagination from '../components/common/Pagination'

function AuditLogs() {
  const { user } = useAuth()
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

  const totalPages = Math.ceil(totalLogs / perPage)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading audit logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h2>
        <p className="text-gray-500 dark:text-gray-400">Complete system audit trail</p>
      </div>

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
        <div>
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
        </div>
      </div>

      <div className="bg-white dark:bg-[#1a1a2e] rounded-xl border border-gray-200 dark:border-[#2a2a4a] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#0f0f1a]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Module</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-[#2a2a4a]">
              {filteredLogs.map(log => (
                <tr key={log.audit_id} className="hover:bg-gray-50 dark:hover:bg-[#0f0f1a]">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{log.username || 'System'}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{log.module || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                    {log.details || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No audit logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
    </div>
  )
}

export default AuditLogs