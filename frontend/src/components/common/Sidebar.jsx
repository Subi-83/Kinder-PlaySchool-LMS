import React, { useEffect, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAppSettings } from '../../context/AppSettingsContext'
import api from '../../services/api'

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊', permissions: [] },
  { path: '/notifications', label: 'Notifications', icon: '🔔', permissions: [], adminOnly: true },
  { path: '/students', label: 'JK Members', icon: '👨‍🎓', permissions: ['student.view'] },
  { path: '/books', label: 'Books', icon: '📚', permissions: ['book.view'] },
  { path: '/ebooks', label: 'E-books', icon: '💻', permissions: ['book.view'] },
  { path: '/subscriptions', label: 'Subscriptions', icon: '📋', permissions: ['subscription.view'] },
  { path: '/subscription-payments', label: 'Subscription Payments', icon: '💳', permissions: ['subscription.view'] },
  { path: '/library', label: 'Library', icon: '📖', permissions: ['book.issue'] },
  { path: '/deposits', label: 'Deposits', icon: '💰', permissions: ['deposit.view'] },
  { path: '/master-data', label: 'Master Data', icon: '🗂️', permissions: ['programme.view', 'book.edit'] },
  { path: '/reports', label: 'Reports', icon: '📈', permissions: ['report.stock'] },
  { path: '/users', label: 'Users', icon: '👥', permissions: ['user.view'] },
  { path: '/settings', label: 'Settings', icon: '⚙️', permissions: ['settings.view'] },
  { path: '/holiday-calendar', label: 'Holiday Calendar', icon: '📅', permissions: ['settings.view'] },
  { path: '/audit', label: 'Audit Logs', icon: '📜', permissions: ['audit.view'] },
  { path: '/profile', label: 'My Profile', icon: '👤', permissions: [] },
]

function Sidebar({ collapsed, onToggle }) {
  const { user, hasAnyPermission, hasPermission } = useAuth()
  const { schoolName, membersLabel } = useAppSettings()
  const schoolInitials = (schoolName || 'School')
    .trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((word) => word[0]).join('').toUpperCase()
  const canViewSettings = user?.role === 'ADMIN' || hasPermission('settings.view')
  const [notificationData, setNotificationData] = useState({ notifications: [], pending_count: 0 })

  const loadNotifications = async () => {
    if (user?.role !== 'ADMIN') return
    try {
      const response = await api.get('/audit/notifications')
      setNotificationData(response.data || { notifications: [], pending_count: 0 })
    } catch (_) {}
  }

  useEffect(() => {
    loadNotifications()
    if (user?.role !== 'ADMIN') return undefined
    const timer = setInterval(loadNotifications, 30000)
    return () => clearInterval(timer)
  }, [user?.role])

  const filteredItems = navItems.filter(item => {
    if (item.adminOnly && user?.role !== 'ADMIN') return false
    if (item.permissions.length === 0) return true
    return hasAnyPermission(item.permissions)
  })

  return (
    <aside
      className={`fixed top-0 left-0 h-screen flex flex-col bg-white dark:bg-[#1a1a2e] border-r border-gray-200 dark:border-[#2a2a4a] transition-all duration-300 z-50 ${collapsed ? 'w-[72px]' : 'w-64'}`}
    >
      {/* Brand */}
      <div className={`flex-shrink-0 flex items-center ${collapsed ? 'justify-between px-2 py-3' : 'justify-between p-4'} border-b border-gray-200 dark:border-[#2a2a4a]`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex flex-col items-center justify-center shadow-md leading-none">
              <span className="text-sm font-black tracking-tight">{schoolInitials}</span>
              <span className="text-[9px]">▰▰</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-blue-600 dark:text-blue-400 leading-tight truncate max-w-36">{schoolName}</h1>
              <span className="text-xs text-gray-500 dark:text-gray-400">Library System</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex flex-col items-center justify-center text-white shadow-md leading-none" title={schoolName}>
            <span className="text-sm font-black tracking-tight">{schoolInitials}</span>
            <span className="text-[9px]">▰▰</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-[#36365a] bg-gray-50 dark:bg-[#23233d] text-gray-600 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-300 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg className={`w-4 h-4 transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'} rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'hover:bg-gray-100 dark:hover:bg-[#2a2a4a] text-gray-700 dark:text-gray-300'
              }`
            }
            title={collapsed ? (item.path === '/students' ? membersLabel : item.label) : ''}
          >
            <span className="text-xl">{item.icon}</span>
            {!collapsed && <span className="ml-3 text-sm font-medium">{item.path === '/students' ? membersLabel : item.label}</span>}
            {item.path === '/notifications' && notificationData.pending_count > 0 && <span className={`${collapsed ? 'absolute mt-[-24px] ml-6' : 'ml-auto'} min-w-5 h-5 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold grid place-items-center`}>{notificationData.pending_count}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User info footer */}
      <div className="flex-shrink-0 p-3 border-t border-gray-200 dark:border-[#2a2a4a]">
        <Link to={canViewSettings ? '/settings' : '/profile'} className={`flex items-center p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#2a2a4a] transition-colors ${collapsed ? 'justify-center' : 'space-x-3'}`} title={canViewSettings ? 'System Settings' : 'My Profile'}>
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {canViewSettings ? 'System Settings' : 'My Profile'}
              </p>
            </div>
          )}
        </Link>
      </div>
    </aside>
  )
}

export default Sidebar
