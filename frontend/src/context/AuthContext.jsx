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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [loginPromptKey, setLoginPromptKey] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    console.log('[Auth] 🔍 Initial token check:', token ? '✅ Present' : '❌ Missing')
    
    if (token) {
      console.log('[Auth] 📦 Token found:', token.substring(0, 20) + '...')
      // Set token in axios headers immediately
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      console.log('[Auth] ✅ Token set in axios headers')
      fetchUser()
    } else {
      console.log('[Auth] ❌ No token found, user not authenticated')
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      setLoading(true)
      console.log('[Auth] 👤 Fetching user data...')
      const response = await api.get('/auth/me')
      const userData = response.data
      console.log('[Auth] ✅ User loaded:', userData.username)
      setUser(userData)
      setPermissions(userData.permissions || [])
      setError(null)
      return userData
    } catch (err) {
      console.error('[Auth] ❌ Error fetching user:', err)
      // If token is invalid, clear it
      if (err.response?.status === 401) {
        console.log('[Auth] 🔒 Token invalid, clearing...')
        localStorage.removeItem('access_token')
        delete api.defaults.headers.common['Authorization']
      }
      setUser(null)
      setPermissions([])
      setError('Session expired. Please login again.')
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password) => {
    try {
        setLoading(true)
        setError(null)
        
        console.log('[Auth] 🔐 Login attempt:', username)
        
        const response = await api.post('/auth/login', { username, password })
        console.log('[Auth] 📦 Response status:', response.status)
        
        const { access_token, user: userData } = response.data
        
        if (!access_token) {
        throw new Error('No token received from server')
        }
        
        console.log('[Auth] 📦 Token received:', access_token.substring(0, 20) + '...')
        
        // ✅ Store token
        localStorage.setItem('access_token', access_token)
        console.log('[Auth] 💾 Token stored in localStorage')
        
        // ✅ Set in axios defaults
        api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
        console.log('[Auth] 🔑 Token set in axios defaults')
        
        // ✅ Also set in the interceptor
        // (The interceptor reads from localStorage, so this is redundant but safe)
        
        setUser(userData)
        setPermissions(userData.permissions || [])
        // Layout consumes this one-time marker to show the admin login prompts.
        sessionStorage.setItem('show_admin_login_prompts', 'true')
        setLoginPromptKey((current) => current + 1)
        
        console.log('[Auth] ✅ Login successful!')
        console.log('[Auth] 👤 User:', userData.username)
        console.log('[Auth] 🔑 Role:', userData.role)
        
        return userData
    } catch (err) {
        console.error('[Auth] ❌ Login error:', err)
        setError(err.response?.data?.error || 'Login failed')
        throw err
    } finally {
        setLoading(false)
    }
    }
  const logout = useCallback(async () => {
    console.log('[Auth] 🚪 Logging out...')
    try {
      await api.post('/auth/logout')
    } catch (err) {
      console.error('[Auth] Logout error:', err)
    } finally {
      localStorage.removeItem('access_token')
      sessionStorage.removeItem('show_admin_login_prompts')
      delete api.defaults.headers.common['Authorization']
      setUser(null)
      setPermissions([])
      setError(null)
      console.log('[Auth] ✅ Logged out')
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

  const refreshUser = useCallback(async () => {
    return await fetchUser()
  }, [])

  const isAuthenticated = useCallback(() => {
    const token = localStorage.getItem('access_token')
    return !!user && !!token
  }, [user])

  const getUserRole = useCallback(() => {
    return user?.role || null
  }, [user])

  const getUserName = useCallback(() => {
    return user?.full_name || user?.username || 'User'
  }, [user])

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
