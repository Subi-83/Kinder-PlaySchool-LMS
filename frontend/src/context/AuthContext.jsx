import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Statuses that mean "this token is unusable" -> drop it and show login
const INVALID_TOKEN_STATUSES = [401, 403, 422, 500]

const clearStoredAuth = () => {
  localStorage.removeItem('access_token')
  delete api.defaults.headers.common['Authorization']
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [loginPromptKey, setLoginPromptKey] = useState(0)

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/auth/me')
      const userData = response.data
      setUser(userData)
      setPermissions(userData.permissions || [])
      setError(null)
      return userData
    } catch (err) {
      console.error('[Auth] ❌ Error fetching user:', err)

      // Any server-side rejection of the stored token: discard it so the
      // next reload goes straight to login instead of failing again.
      // Network errors (no status) keep the token, the server may just be down.
      if (INVALID_TOKEN_STATUSES.includes(err?.status)) {
        console.log('[Auth] 🔒 Stored token unusable, clearing...')
        clearStoredAuth()
        setError(null) // not an error the user needs to see, just show login
      } else {
        setError('Unable to reach the server. Please try again.')
      }

      setUser(null)
      setPermissions([])
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('access_token')

    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [fetchUser])

  const login = async (username, password) => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.post('/auth/login', { username, password })
      const { access_token, user: userData } = response.data

      if (!access_token) {
        throw new Error('No token received from server')
      }

      localStorage.setItem('access_token', access_token)
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`

      setUser(userData)
      setPermissions(userData.permissions || [])
      // Layout consumes this one-time marker to show the admin login prompts.
      sessionStorage.setItem('show_admin_login_prompts', 'true')
      setLoginPromptKey((current) => current + 1)

      return userData
    } catch (err) {
      console.error('[Auth] ❌ Login error:', err)
      setError(err.response?.data?.error || err.message || 'Login failed')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch (err) {
      console.error('[Auth] Logout error:', err)
    } finally {
      clearStoredAuth()
      sessionStorage.removeItem('show_admin_login_prompts')
      setUser(null)
      setPermissions([])
      setError(null)
    }
  }, [])

  const hasPermission = useCallback((permissionCode) => {
    if (!user) return false
    if (user.role === 'ADMIN') return true
    return permissions.includes(permissionCode)
  }, [user, permissions])

  const hasAnyPermission = useCallback((permissionCodes) => {
    if (!user) return false
    if (user.role === 'ADMIN') return true
    if (!Array.isArray(permissionCodes) || permissionCodes.length === 0) return true
    return permissionCodes.some(code => permissions.includes(code))
  }, [user, permissions])

  const hasAllPermissions = useCallback((permissionCodes) => {
    if (!user) return false
    if (user.role === 'ADMIN') return true
    if (!Array.isArray(permissionCodes) || permissionCodes.length === 0) return true
    return permissionCodes.every(code => permissions.includes(code))
  }, [user, permissions])

  const refreshUser = useCallback(() => fetchUser(), [fetchUser])

  const isAuthenticated = useCallback(() => {
    const token = localStorage.getItem('access_token')
    return !!user && !!token
  }, [user])

  const getUserRole = useCallback(() => user?.role || null, [user])

  const getUserName = useCallback(
    () => user?.full_name || user?.username || 'User',
    [user]
  )

  const value = {
    user,
    loading,
    error,
    permissions,
    loginPromptKey,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshUser,
    isAuthenticated,
    getUserRole,
    getUserName
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext