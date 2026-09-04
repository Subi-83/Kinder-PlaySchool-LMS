import React, { useEffect, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard, Bell, GraduationCap, Users2, BookOpen, Laptop2, ClipboardList,
  CreditCard, BookOpenCheck, PiggyBank, FolderCog, BarChart3, Users, Settings,
  CalendarDays, ScrollText, UserCircle, ChevronLeft, ChevronRight, X
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useAppSettings } from '../../context/AppSettingsContext'
import api from '../../services/api'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, permissions: [] },
  { path: '/notifications', label: 'Notifications', icon: Bell, permissions: [], adminOnly: true },
  { path: '/students', label: 'JK Members', icon: GraduationCap, permissions: ['student.view'] },
  { path: '/books', label: 'Books', icon: BookOpen, permissions: ['book.view'] },
  { path: '/ebooks', label: 'E-books', icon: Laptop2, permissions: ['ebook.view'] },
  { path: '/subscriptions', label: 'Subscriptions', icon: ClipboardList, permissions: ['subscription.view'] },
  { path: '/subscription-payments', label: 'Subscription Payments', icon: CreditCard, permissions: ['subscription.payment.view'] },
  { path: '/library', label: 'Library', icon: BookOpenCheck, permissions: ['book.issue'] },
  { path: '/deposits', label: 'Deposits', icon: PiggyBank, permissions: ['deposit.view'] },
  { path: '/master-data', label: 'Master Data', icon: FolderCog, permissions: ['programme.view', 'book.edit'] },
  { path: '/reports', label: 'Reports', icon: BarChart3, permissions: ['report.stock'] },
  { path: '/users', label: 'Users', icon: Users, permissions: ['user.view'] },
  { path: '/settings', label: 'Settings', icon: Settings, permissions: ['settings.view'] },
  { path: '/holiday-calendar', label: 'Holiday Calendar', icon: CalendarDays, permissions: ['holiday.view'] },
  { path: '/audit', label: 'Audit Logs', icon: ScrollText, permissions: ['audit.view'] },
  { path: '/profile', label: 'My Profile', icon: UserCircle, permissions: [] },
]

function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile, notificationCount = 0 }) {
  const { user, hasAnyPermission, hasPermission } = useAuth()
  const { schoolName, membersLabel } = useAppSettings()
  const schoolInitials = (schoolName || 'School')
    .trim().split(/\s+/).filter(Boolean).slice(0, 2)
    .map((word) => word[0]).join('').toUpperCase()
  const canViewSettings = user?.role === 'ADMIN' || hasPermission('settings.view')
  const [memberGroups, setMemberGroups] = useState([])

  useEffect(() => {
    if (!hasPermission('student.view') && user?.role !== 'ADMIN') return
    api.get('/students/member-groups').then((response) => setMemberGroups((response.data || []).filter((group) => group.is_active && group.group_code !== 'JK_MEMBERS'))).catch(() => {})
  }, [user?.role, hasPermission])

  const allNavItems = navItems.flatMap((item) => item.path === '/students'
    ? [item, ...memberGroups.map((group) => ({ path: `/member-groups/${group.group_code}`, label: group.group_name, icon: Users2, permissions: ['student.view'] }))]
    : [item])
  const filteredItems = allNavItems.filter(item => {
    if (item.adminOnly && user?.role !== 'ADMIN') return false
    if (item.permissions.length === 0) return true
    return hasAnyPermission(item.permissions)
  })

  const renderContent = (effectiveCollapsed) => (
    <>
      {/* Brand */}
      <div className={`flex-shrink-0 flex items-center ${effectiveCollapsed ? 'justify-between px-2 py-3' : 'justify-between p-4'} border-b border-gray-200 dark:border-[#2a2a4a]`}>
        {!effectiveCollapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <span className="text-sm font-black tracking-tight">{schoolInitials}</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-primary-main dark:text-blue-400 leading-tight truncate max-w-36">{schoolName}</h1>
              <span className="text-xs text-gray-500 dark:text-gray-400">Library System</span>
            </div>
          </div>
        )}
        {effectiveCollapsed && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md" title={schoolName}>
            <span className="text-sm font-black tracking-tight">{schoolInitials}</span>
          </div>
        )}
        {/* Desktop collapse toggle */}
        <button
          onClick={onToggle}
          className="hidden lg:inline-flex w-8 h-8 items-center justify-center rounded-lg border border-gray-200 dark:border-[#36365a] bg-gray-50 dark:bg-[#23233d] text-gray-600 dark:text-gray-300 hover:bg-blue-50 hover:text-primary-main dark:hover:bg-blue-900/30 dark:hover:text-blue-300 transition-colors"
          aria-label={effectiveCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={effectiveCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {effectiveCollapsed ? <ChevronRight className="w-4 h-4" aria-hidden="true" /> : <ChevronLeft className="w-4 h-4" aria-hidden="true" />}
        </button>
        {/* Mobile close */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden inline-flex w-8 h-8 items-center justify-center rounded-lg border border-gray-200 dark:border-[#36365a] bg-gray-50 dark:bg-[#23233d] text-gray-600 dark:text-gray-300"
          aria-label="Close navigation menu"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 overflow-y-auto p-2 space-y-0.5">
        {filteredItems.map((item) => {
          const Icon = item.icon
          const label = item.path === '/students' ? membersLabel : item.label
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `relative flex items-center ${effectiveCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'} rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-light dark:bg-blue-900/20 text-primary-main dark:text-blue-400 font-semibold'
                    : 'hover:bg-gray-100 dark:hover:bg-[#2a2a4a] text-gray-700 dark:text-gray-300'
                }`
              }
              title={effectiveCollapsed ? label : undefined}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
              {!effectiveCollapsed && <span className="ml-3 text-sm font-medium truncate">{label}</span>}
              {item.path === '/notifications' && notificationCount > 0 && (
                <span className={`${effectiveCollapsed ? 'absolute top-1 right-1' : 'ml-auto'} min-w-5 h-5 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold grid place-items-center`}>
                  {notificationCount}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* User info footer */}
      <div className="flex-shrink-0 p-3 border-t border-gray-200 dark:border-[#2a2a4a]">
        <Link
          to={canViewSettings ? '/settings' : '/profile'}
          onClick={onCloseMobile}
          className={`flex items-center p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#2a2a4a] transition-colors ${effectiveCollapsed ? 'justify-center' : 'space-x-3'}`}
          title={canViewSettings ? 'System Settings' : 'My Profile'}
        >
          <div className="w-8 h-8 rounded-full bg-primary-main flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          {!effectiveCollapsed && (
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
    </>
  )

  return (
    <>
      {/* Desktop / tablet persistent sidebar */}
      <aside
        className={`hidden lg:flex fixed top-0 left-0 h-screen flex-col bg-white dark:bg-[#1a1a2e] border-r border-gray-200 dark:border-[#2a2a4a] transition-all duration-300 z-40 ${collapsed ? 'w-[72px]' : 'w-64'}`}
      >
        {renderContent(collapsed)}
      </aside>

      {/* Mobile drawer + backdrop */}
      <div className={`lg:hidden fixed inset-0 z-50 ${mobileOpen ? '' : 'pointer-events-none'}`} aria-hidden={!mobileOpen}>
        <div
          className={`absolute inset-0 bg-gray-900/50 transition-opacity duration-200 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={onCloseMobile}
        />
        <aside
          className={`absolute top-0 left-0 h-full w-72 max-w-[85vw] flex flex-col bg-white dark:bg-[#1a1a2e] border-r border-gray-200 dark:border-[#2a2a4a] shadow-xl transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {renderContent(false)}
        </aside>
      </div>
    </>
  )
}

export default Sidebar
