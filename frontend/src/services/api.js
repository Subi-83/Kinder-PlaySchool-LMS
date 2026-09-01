import axios from 'axios'

// ============================================================
// API CONFIGURATION
// ============================================================

// Get API base URL from environment or use default
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000, // 30 seconds timeout
  withCredentials: true // Send cookies with requests
})

// ============================================================
// REQUEST INTERCEPTOR - WITH FULL DEBUGGING
// ============================================================

// Add token to every request if available
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('access_token')
    
    console.log(`[API] 🚀 ${config.method.toUpperCase()} ${config.url}`)
    
    if (token) {
      const authorization = `Bearer ${token}`
      if (typeof config.headers?.set === 'function') {
        config.headers.set('Authorization', authorization)
      } else {
        config.headers = config.headers || {}
        config.headers.Authorization = authorization
      }
      console.log(`[API] ✅ Token set: ${token.substring(0, 20)}...`)
    } else {
      console.log(`[API] ⚠️ No token`)
    }
    
    return config
  },
  (error) => {
    console.error('[API] ❌ Interceptor error:', error)
    return Promise.reject(error)
  }
)

// ============================================================
// RESPONSE INTERCEPTOR - WITH FULL DEBUGGING
// ============================================================

// ============================================================
// RESPONSE INTERCEPTOR - WITH AUTO-REDIRECT DISABLED FOR DEBUG
// ============================================================

api.interceptors.response.use(
  (response) => {
    // Log successful responses
    if (import.meta.env.DEV) {
      console.log(`[API] ✅ ${response.status} ${response.config.url}`)
    }
    const method = String(response.config?.method || 'get').toLowerCase()
    const message = response.data?.message
    if (message && ['post', 'put', 'patch', 'delete'].includes(method) && !response.config?.url?.includes('/auth/login')) {
      window.dispatchEvent(new CustomEvent('app-alert', {
        detail: { message, type: response.data?.warning ? 'warning' : 'success' }
      }))
    }
    return response
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('[API] ❌ Network Error:', error.message)
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        status: 0,
        data: null
      })
    }

    const status = error.response.status
    const url = error.config?.url || 'unknown'
    const alertMessage = error.response.data?.error || error.response.data?.message || 'An error occurred'
    const isWarning = Boolean(error.response.data?.warning) || status === 409

    window.dispatchEvent(new CustomEvent('app-alert', {
      detail: { message: alertMessage, type: isWarning ? 'warning' : 'error' }
    }))
    
    console.log(`[API] ❌ ${status} ${url}`)

    // Handle 401 Unauthorized
    if (status === 401 && (() => {
      const message = String(error.response.data?.error || error.response.data?.message || '').toLowerCase()
      return message.includes('invalid token') || message.includes('token expired')
    })()) {
      console.warn('[API] 🔒 Unauthorized - Clearing invalid/expired token')
      localStorage.removeItem('access_token')
      delete api.defaults.headers.common['Authorization']
      
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }

    // Return enhanced error
    return Promise.reject({
      message: error.response.data?.error || error.response.data?.message || 'An error occurred',
      status: status,
      data: error.response.data,
      response: error.response,
      originalError: error
    })
  }
)

// ============================================================
// API HELPER FUNCTIONS
// ============================================================

/**
 * Set authentication token
 */
export const setAuthToken = (token) => {
  console.log('[API] 🔑 Setting auth token:', token ? `✅ ${token.substring(0, 20)}...` : '❌ Removing token')
  
  if (token) {
    localStorage.setItem('access_token', token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    console.log('[API] ✅ Token stored in localStorage and axios headers')
  } else {
    localStorage.removeItem('access_token')
    delete api.defaults.headers.common['Authorization']
    console.log('[API] ✅ Token removed')
  }
}

/**
 * Get authentication token
 */
export const getAuthToken = () => {
  const token = localStorage.getItem('access_token')
  console.log('[API] 🔍 Getting token:', token ? '✅ Present' : '❌ Missing')
  return token
}

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('access_token')
  const isAuth = !!token
  console.log('[API] 🔍 Authentication check:', isAuth ? '✅ Authenticated' : '❌ Not authenticated')
  return isAuth
}

/**
 * Clear authentication
 */
export const clearAuth = () => {
  console.log('[API] 🧹 Clearing authentication...')
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  delete api.defaults.headers.common['Authorization']
  console.log('[API] ✅ Authentication cleared')
}

// ============================================================
// API ENDPOINTS - AUTH
// ============================================================

export const authAPI = {
  /**
   * Login user
   */
  login: (username, password) => {
    console.log('[API] 🔐 Login request for:', username)
    return api.post('/auth/login', { username, password })
  },
  
  /**
   * Logout user
   */
  logout: () => {
    console.log('[API] 🚪 Logout request')
    return api.post('/auth/logout')
  },
  
  /**
   * Get current user info
   */
  me: () => {
    console.log('[API] 👤 Getting current user')
    return api.get('/auth/me')
  },
  
  /**
   * Change password
   */
  changePassword: (oldPassword, newPassword) => {
    console.log('[API] 🔑 Change password request')
    return api.post('/auth/change-password', { 
      old_password: oldPassword, 
      new_password: newPassword 
    })
  }
}

// ============================================================
// API ENDPOINTS - USERS
// ============================================================

export const usersAPI = {
  /**
   * Get all users
   */
  getAll: () => {
    console.log('[API] 👥 Getting all users')
    return api.get('/users')
  },
  
  /**
   * Get user by ID
   */
  getById: (userId) => {
    console.log('[API] 👤 Getting user:', userId)
    return api.get(`/users/${userId}`)
  },
  
  /**
   * Create user
   */
  create: (userData) => {
    console.log('[API] ➕ Creating user:', userData.username)
    return api.post('/users', userData)
  },
  
  /**
   * Update user
   */
  update: (userId, userData) => {
    console.log('[API] ✏️ Updating user:', userId)
    return api.put(`/users/${userId}`, userData)
  },
  
  /**
   * Delete user
   */
  delete: (userId) => {
    console.log('[API] 🗑️ Deleting user:', userId)
    return api.delete(`/users/${userId}`)
  },
  
  /**
   * Get all permissions
   */
  getPermissions: () => {
    console.log('[API] 📋 Getting all permissions')
    return api.get('/users/permissions')
  },
  
  /**
   * Get role permissions
   */
  getRolePermissions: (role) => {
    console.log('[API] 📋 Getting permissions for role:', role)
    return api.get(`/users/permissions/role/${role}`)
  },
  
  /**
   * Assign permission to role
   */
  assignRolePermission: (role, permissionCode) => {
    console.log('[API] 📋 Assigning permission to role:', role, permissionCode)
    return api.post('/users/permissions/role', { role, permission_code: permissionCode })
  },
  
  /**
   * Remove permission from role
   */
  removeRolePermission: (role, permissionCode) => {
    console.log('[API] 📋 Removing permission from role:', role, permissionCode)
    return api.delete('/users/permissions/role', { data: { role, permission_code: permissionCode } })
  }
}

// ============================================================
// API ENDPOINTS - STUDENTS
// ============================================================

export const studentsAPI = {
  getAll: () => {
    console.log('[API] 👨‍🎓 Getting all students')
    return api.get('/students/')
  },
  
  getById: (studentId) => {
    console.log('[API] 👨‍🎓 Getting student:', studentId)
    return api.get(`/students/${studentId}`)
  },
  
  create: (studentData) => {
    console.log('[API] ➕ Creating student:', studentData.student_name)
    return api.post('/students/', studentData)
  },
  
  update: (studentId, studentData) => {
    console.log('[API] ✏️ Updating student:', studentId)
    return api.put(`/students/${studentId}`, studentData)
  },
  
  delete: (studentId) => {
    console.log('[API] 🗑️ Deleting student:', studentId)
    return api.delete(`/students/${studentId}`)
  },
  
  search: (query) => {
    console.log('[API] 🔍 Searching students:', query)
    return api.get(`/students/search?q=${encodeURIComponent(query)}`)
  },
  
  getAcademicYears: () => {
    console.log('[API] 📅 Getting academic years')
    return api.get('/students/academic-years')
  },
  
  createAcademicYear: (yearData) => {
    console.log('[API] ➕ Creating academic year:', yearData.year_code)
    return api.post('/students/academic-years', yearData)
  },

  updateAcademicYear: (id, yearData) => {
    console.log('[API] ✏️ Updating academic year:', id)
    return api.put(`/students/academic-years/${id}`, yearData)
  },

  deleteAcademicYear: (id) => {
    console.log('[API] 🗑️ Deleting academic year:', id)
    return api.delete(`/students/academic-years/${id}`)
  },
  
  getProgrammes: () => {
    console.log('[API] 📚 Getting programmes')
    return api.get('/students/programmes')
  },
  
  createProgramme: (programmeData) => {
    console.log('[API] ➕ Creating programme:', programmeData.programme_name)
    return api.post('/students/programmes', programmeData)
  },

  updateProgramme: (id, programmeData) => {
    console.log('[API] ✏️ Updating programme:', id)
    return api.put(`/students/programmes/${id}`, programmeData)
  },

  deleteProgramme: (id) => {
    console.log('[API] 🗑️ Deleting programme:', id)
    return api.delete(`/students/programmes/${id}`)
  },

  deleteProgrammePermanent: (id) => {
    return api.delete(`/students/programmes/${id}`, { params: { permanent: true } })
  },
  
  getGrades: () => {
    console.log('[API] 📊 Getting grades')
    return api.get('/students/grades')
  },
  
  createEnrollment: (enrollmentData) => {
    console.log('[API] ➕ Creating enrollment')
    return api.post('/students/enrollments', enrollmentData)
  },
  
  promoteStudents: (promotionData) => {
    console.log('[API] 🎓 Promoting students:', promotionData.student_ids?.length, 'students')
    return api.post('/students/promote', promotionData)
  }
}

// ============================================================
// API ENDPOINTS - BOOKS
// ============================================================

export const booksAPI = {
  getAll: () => {
    console.log('[API] 📚 Getting all books')
    return api.get('/books/')
  },
  
  getById: (bookId) => {
    console.log('[API] 📚 Getting book:', bookId)
    return api.get(`/books/${bookId}`)
  },
  
  create: (bookData) => {
    console.log('[API] ➕ Creating book:', bookData.title)
    return api.post('/books/', bookData)
  },
  
  update: (bookId, bookData) => {
    console.log('[API] ✏️ Updating book:', bookId)
    return api.put(`/books/${bookId}`, bookData)
  },
  
  delete: (bookId) => {
    console.log('[API] 🗑️ Deleting book:', bookId)
    return api.delete(`/books/${bookId}`)
  },
  
  getCopies: () => {
    console.log('[API] 📚 Getting book copies')
    return api.get('/books/copies')
  },
  
  updateCopy: (copyId, copyData) => {
    console.log('[API] ✏️ Updating book copy:', copyId)
    return api.put(`/books/copy/${copyId}`, copyData)
  },
  
  isbnLookup: (isbn) => {
    console.log('[API] 🔍 ISBN lookup:', isbn)
    return api.get(`/books/isbn-lookup?isbn=${isbn}`)
  },
  
  getLevels: () => {
    console.log('[API] 📊 Getting book levels')
    return api.get('/books/levels')
  },
  
  createLevel: (levelData) => {
    console.log('[API] ➕ Creating book level:', levelData.level_name)
    return api.post('/books/levels', levelData)
  },

  updateLevel: (id, levelData) => {
    console.log('[API] ✏️ Updating book level:', id)
    return api.put(`/books/levels/${id}`, levelData)
  },

  deleteLevel: (id) => {
    console.log('[API] 🗑️ Deleting book level:', id)
    return api.delete(`/books/levels/${id}`)
  },
  
  getCategories: () => {
    console.log('[API] 📂 Getting book categories')
    return api.get('/books/categories')
  },
  
  createCategory: (categoryData) => {
    console.log('[API] ➕ Creating book category:', categoryData.category_name)
    return api.post('/books/categories', categoryData)
  },

  updateCategory: (id, categoryData) => {
    console.log('[API] ✏️ Updating book category:', id)
    return api.put(`/books/categories/${id}`, categoryData)
  },

  deleteCategory: (id) => {
    console.log('[API] 🗑️ Deleting book category:', id)
    return api.delete(`/books/categories/${id}`)
  }
}

// ============================================================
// API ENDPOINTS - LIBRARY
// ============================================================

export const libraryAPI = {
  getIssues: () => {
    console.log('[API] 📖 Getting all issues')
    return api.get('/library/issues')
  },
  
  getActiveIssues: () => {
    console.log('[API] 📖 Getting active issues')
    return api.get('/library/issues/active')
  },
  
  getStudentIssues: (studentId) => {
    console.log('[API] 📖 Getting student issues:', studentId)
    return api.get(`/library/issues/student/${studentId}`)
  },
  
  issueBook: (issueData) => {
    console.log('[API] 📤 Issuing book')
    return api.post('/library/issues', issueData)
  },
  
  returnBook: (returnData) => {
    console.log('[API] 📥 Returning book')
    return api.post('/library/returns', returnData)
  },
  
  getOverdue: () => {
    console.log('[API] ⏰ Getting overdue books')
    return api.get('/library/overdue')
  },
  
  recordDamageLoss: (recordData) => {
    console.log('[API] ⚠️ Recording damage/loss')
    return api.post('/library/damage-loss', recordData)
  },
  
  getDamageLossRecords: () => {
    console.log('[API] ⚠️ Getting damage/loss records')
    return api.get('/library/damage-loss')
  }
}

// ============================================================
// API ENDPOINTS - DEPOSITS
// ============================================================

export const depositsAPI = {
  getAll: () => {
    console.log('[API] 💰 Getting all deposits')
    return api.get('/deposits')
  },
  
  getByStudent: (studentId) => {
    console.log('[API] 💰 Getting student deposit:', studentId)
    return api.get(`/deposits/student/${studentId}`)
  },
  
  topUp: (studentId, amount, description) => {
    console.log('[API] 💰 Top-up deposit for student:', studentId, 'Amount:', amount)
    return api.post('/deposits/topup', { student_id: studentId, amount, description })
  },
  
  adjust: (studentId, amount, description) => {
    console.log('[API] 💰 Adjusting deposit for student:', studentId)
    return api.post('/deposits/adjust', { student_id: studentId, amount, description })
  },
  
  getTransactions: (studentId) => {
    console.log('[API] 💰 Getting transactions for student:', studentId)
    return api.get(`/deposits/transactions/${studentId}`)
  },
  
  getLowBalance: (threshold) => {
    console.log('[API] 💰 Getting low balance accounts, threshold:', threshold)
    return api.get(`/deposits/low-balance${threshold ? `?threshold=${threshold}` : ''}`)
  }
}

// ============================================================
// API ENDPOINTS - SUBSCRIPTIONS
// ============================================================

export const subscriptionsAPI = {
  getPlans: () => {
    console.log('[API] 📋 Getting subscription plans')
    return api.get('/subscriptions/plans')
  },
  
  createPlan: (planData) => {
    console.log('[API] ➕ Creating subscription plan:', planData.plan_name)
    return api.post('/subscriptions/plans', planData)
  },
  
  updatePlan: (planId, planData) => {
    console.log('[API] ✏️ Updating subscription plan:', planId)
    return api.put(`/subscriptions/plans/${planId}`, planData)
  },
  
  deletePlan: (planId) => {
    console.log('[API] 🗑️ Deleting subscription plan:', planId)
    return api.delete(`/subscriptions/plans/${planId}`)
  },
  
  getStudentSubscriptions: (studentId) => {
    console.log('[API] 📋 Getting student subscriptions:', studentId)
    return api.get(`/subscriptions/student/${studentId}`)
  },
  
  assign: (studentId, planId) => {
    console.log('[API] 📋 Assigning subscription to student:', studentId)
    return api.post('/subscriptions/assign', { student_id: studentId, plan_id: planId })
  },
  
  renew: (subscriptionId, planId, amount, paymentMethod) => {
    console.log('[API] 📋 Renewing subscription:', subscriptionId)
    return api.post(`/subscriptions/renew/${subscriptionId}`, { plan_id: planId, amount, payment_method: paymentMethod })
  },

  upgrade: (subscriptionId, planId) => {
    console.log('[API] ⬆️ Upgrading subscription:', subscriptionId)
    return api.post(`/subscriptions/upgrade/${subscriptionId}`, { plan_id: planId })
  }
}

// ============================================================
// API ENDPOINTS - REPORTS
// ============================================================

export const reportsAPI = {
  getStock: () => {
    console.log('[API] 📊 Getting stock report')
    return api.get('/reports/stock')
  },
  
  getMembers: () => {
    console.log('[API] 📊 Getting members report')
    return api.get('/reports/members')
  },
  
  getFines: () => {
    console.log('[API] 📊 Getting fines report')
    return api.get('/reports/fines')
  },
  
  getFinancial: () => {
    console.log('[API] 📊 Getting financial report')
    return api.get('/reports/financial')
  },
  
  getIssueReturn: () => {
    console.log('[API] 📊 Getting issue/return report')
    return api.get('/reports/issue-return')
  },
  
  getTopStudents: (limit = 10) => {
    console.log('[API] 📊 Getting top students, limit:', limit)
    return api.get(`/reports/top-students?limit=${limit}`)
  },
  
  getPopularBooks: (limit = 10) => {
    console.log('[API] 📊 Getting popular books, limit:', limit)
    return api.get(`/reports/popular-books?limit=${limit}`)
  }
}

// ============================================================
// API ENDPOINTS - SETTINGS
// ============================================================

export const settingsAPI = {
  getAll: () => {
    console.log('[API] ⚙️ Getting all settings')
    return api.get('/settings')
  },
  
  getDetailed: () => {
    console.log('[API] ⚙️ Getting detailed settings')
    return api.get('/settings/detailed')
  },
  
  get: (key) => {
    console.log('[API] ⚙️ Getting setting:', key)
    return api.get(`/settings/${key}`)
  },
  
  update: (settingsData) => {
    console.log('[API] ⚙️ Updating settings')
    return api.post('/settings', settingsData)
  },
  
  updateOne: (key, value) => {
    console.log('[API] ⚙️ Updating setting:', key)
    return api.put(`/settings/${key}`, { value })
  },
  
  getHolidays: (startDate, endDate) => {
    console.log('[API] 📅 Getting holidays')
    let url = '/settings/holidays'
    if (startDate && endDate) {
      url += `?start_date=${startDate}&end_date=${endDate}`
    }
    return api.get(url)
  },
  
  createHoliday: (holidayData) => {
    console.log('[API] ➕ Creating holiday:', holidayData.holiday_name)
    return api.post('/settings/holidays', holidayData)
  },
  
  updateHoliday: (holidayId, holidayData) => {
    console.log('[API] ✏️ Updating holiday:', holidayId)
    return api.put(`/settings/holidays/${holidayId}`, holidayData)
  },
  
  deleteHoliday: (holidayId) => {
    console.log('[API] 🗑️ Deleting holiday:', holidayId)
    return api.delete(`/settings/holidays/${holidayId}`)
  }
}

// ============================================================
// API ENDPOINTS - AUDIT
// ============================================================

export const auditAPI = {
  getRecent: (limit = 100, offset = 0) => {
    console.log('[API] 📜 Getting recent audit logs')
    return api.get(`/audit?limit=${limit}&offset=${offset}`)
  },
  
  getByUser: (userId, limit = 100, offset = 0) => {
    console.log('[API] 📜 Getting audit logs for user:', userId)
    return api.get(`/audit/user/${userId}?limit=${limit}&offset=${offset}`)
  },
  
  getByModule: (module, limit = 100, offset = 0) => {
    console.log('[API] 📜 Getting audit logs for module:', module)
    return api.get(`/audit/module/${module}?limit=${limit}&offset=${offset}`)
  },
  
  getByAction: (action, limit = 100, offset = 0) => {
    console.log('[API] 📜 Getting audit logs for action:', action)
    return api.get(`/audit/action/${action}?limit=${limit}&offset=${offset}`)
  },
  
  search: (query, limit = 100, offset = 0) => {
    console.log('[API] 📜 Searching audit logs:', query)
    return api.get(`/audit/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`)
  },
  
  getSummary: (startDate, endDate) => {
    console.log('[API] 📜 Getting audit summary')
    let url = '/audit/summary'
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    if (params.toString()) url += `?${params.toString()}`
    return api.get(url)
  }
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default api
