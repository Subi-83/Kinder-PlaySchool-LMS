import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAuth } from '../../context/AuthContext'

function Layout() {
  const { user } = useAuth()
  // Lifted up from Sidebar so the content margin below can track the
  // sidebar's real width. Previously Sidebar toggled its own width
  // independently and Layout used a fixed `ml-16 lg:ml-64` that ignored
  // it, so collapsing/expanding the sidebar left the content margin
  // wrong (overlap or a big empty gap) instead of moving with it.
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0f0f1a]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div
        className={`flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'ml-[72px]' : 'ml-64'}`}
      >
        <Header user={user} />
        <main className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
