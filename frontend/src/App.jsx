import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { AppSettingsProvider } from './context/AppSettingsContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import Layout from './components/common/Layout'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Books from './pages/Books'
import Library from './pages/Library'
import Deposits from './pages/Deposits'
import Subscriptions from './pages/Subscriptions'
import MasterData from './pages/MasterData'
import Reports from './pages/Reports'
import Users from './pages/Users'
import Settings from './pages/Settings'
import AuditLogs from './pages/AuditLogs'
import Profile from './pages/Profile'
import Notifications from './pages/Notifications'
import HolidayCalendarPage from './pages/HolidayCalendarPage'

function App() {
  return (
    <ThemeProvider>
      <AppSettingsProvider>
       <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="students" element={<Students />} />
              <Route path="books" element={<Books />} />
              <Route path="library" element={<Library />} />
              <Route path="deposits" element={<Deposits />} />
              <Route path="subscriptions" element={<Subscriptions />} />
              <Route path="master-data" element={<MasterData />} />
              <Route path="reports" element={<Reports />} />
              <Route path="users" element={<Users />} />
              <Route path="settings" element={<Settings />} />
              <Route path="holiday-calendar" element={<HolidayCalendarPage />} />
              <Route path="audit" element={<AuditLogs />} />
              <Route path="profile" element={<Profile />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
       </AuthProvider>
      </AppSettingsProvider>
    </ThemeProvider>
  )
}

export default App
