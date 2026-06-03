'use client'

import { useState, useEffect } from 'react'
import TopBar from '@/components/layout/TopBar'
import Sidebar from '@/components/layout/Sidebar'
import { type SidebarData } from '@/lib/db/sidebar'

interface Props {
  children: React.ReactNode
  sidebarData: SidebarData
}

export default function DashboardShell({ children, sidebarData }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-open')
    if (saved !== null) setSidebarOpen(saved === 'true')
  }, [])

  const handleToggle = () => {
    setSidebarOpen(prev => {
      const next = !prev
      localStorage.setItem('sidebar-open', String(next))
      return next
    })
  }

  const handleClose = () => {
    setSidebarOpen(false)
    localStorage.setItem('sidebar-open', 'false')
  }

  return (
    <div className="flex h-screen flex-col">
      <TopBar onMenuToggle={handleToggle} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={handleClose}
          sidebarData={sidebarData}
        />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
