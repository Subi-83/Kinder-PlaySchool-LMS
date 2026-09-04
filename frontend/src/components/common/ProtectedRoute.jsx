import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ShieldAlert, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Button from '../ui/Button'

function ProtectedRoute({ children, requiredPermissions = [] }) {
  const { user, loading, hasAnyPermission } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f0f1a]">
        <div className="text-center">
          <Loader2 className="h-9 w-9 mx-auto animate-spin text-primary-main" aria-hidden="true" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f0f1a] px-4">
        <div className="text-center max-w-sm">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 mb-4">
            <ShieldAlert className="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Access denied</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            You don't have permission to access this page.
          </p>
          <Button onClick={() => window.history.back()} className="mt-5 mx-auto">
            Go back
          </Button>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute