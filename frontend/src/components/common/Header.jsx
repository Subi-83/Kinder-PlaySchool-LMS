import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Menu, Bell, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useAppSettings } from '../../context/AppSettingsContext'
import ThemeToggle from './ThemeToggle'

// Route -> readable page title, so the header always shows page context
// instead of a page-agnostic greeting on every screen.
const PAGE_TITLES = [
  { test: (p) => p === '/', title: 'Dashboard' },
  { test: (p) => p.startsWith('/member-groups/'), title: 'Member Group' },
  { test: (p) => p === '/students', title: 'Members' },
  { test: (p) => p === '/books', title: 'Books' },
  { test: (p) => p === '/ebooks', title: 'E-books' },
  { test: (p) => p === '/library', title: 'Library' },
  { test: (p) => p === '/deposits', title: 'Deposits' },
  { test: (p) => p === '/subscriptions', title: 'Subscriptions' },
  { test: (p) => p === '/subscription-payments', title: 'Subscription Payments' },
  { test: (p) => p === '/master-data', title: 'Master Data' },
  { test: (p) => p === '/reports', title: 'Reports' },
  { test: (p) => p === '/users', title: 'Users' },
  { test: (p) => p === '/settings', title: 'Settings' },
  { test: (p) => p === '/holiday-calendar', title: 'Holiday Calendar' },
  { test: (p) => p === '/audit', title: 'Audit Logs' },
  { test: (p) => p === '/profile', title: 'My Profile' },
  { test: (p) => p === '/notifications', title: 'Notifications' },
]

function pageTitleFor(pathname) {
  const match = PAGE_TITLES.find((entry) => entry.test(pathname))
  return match ? match.title : 'Overview'
}

function Header({ user, notificationCount = 0, onOpenMobileMenu }) {
  const { logout } = useAuth()
  const { schoolName } = useAppSettings()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const pageTitle = pageTitleFor(location.pathname)

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#1a1a2e]/90 backdrop-blur border-b border-gray-200 dark:border-[#2a2a4a] px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a4a] transition-colors shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <nav aria-label="Breadcrumb" className="hidden sm:block text-xs text-gray-400 dark:text-gray-500 truncate">
              {schoolName} <span className="mx-1">/</span> <span className="text-gray-500 dark:text-gray-400">{pageTitle}</span>
            </nav>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{pageTitle}</h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Link
            to="/notifications"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a4a] transition-colors"
            aria-label={notificationCount > 0 ? `Notifications, ${notificationCount} pending` : 'Notifications'}
            title="Notifications"
          >
            <Bell className="h-5 w-5" aria-hidden="true" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold grid place-items-center">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </Link>

          <ThemeToggle />

          {/* Profile menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#2a2a4a] transition-colors"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title={user?.full_name || 'My Account'}
            >
              <div className="w-8 h-8 rounded-full bg-primary-main flex items-center justify-center text-white text-sm font-bold shadow-sm shrink-0">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden sm:block leading-tight">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.full_name || 'My Account'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role || 'User'}</p>
              </div>
              <ChevronDown className="hidden sm:block h-4 w-4 text-gray-400" aria-hidden="true" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div role="menu" className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-gray-200 dark:border-[#2a2a4a] bg-white dark:bg-[#1a1a2e] shadow-lg py-1 overflow-hidden">
                  <Link
                    role="menuitem"
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="block px-3.5 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#2a2a4a]"
                  >
                    My Profile
                  </Link>
                  <button
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
