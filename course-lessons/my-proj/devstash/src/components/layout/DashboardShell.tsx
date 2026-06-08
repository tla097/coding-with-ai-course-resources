'use client'

import { useState, useEffect, useLayoutEffect } from 'react'
import TopBar from '@/components/layout/TopBar'
import Sidebar from '@/components/layout/Sidebar'
import CommandPalette from '@/components/search/CommandPalette'
import ItemDrawer from '@/components/items/ItemDrawer'
import { EditorPreferencesProvider } from '@/contexts/EditorPreferencesContext'
import { type SidebarData } from '@/lib/db/sidebar'
import { type SearchData } from '@/lib/db/search'
import { type EditorPreferences } from '@/types/editor-preferences'

type User = {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
}

interface Props {
  children: React.ReactNode
  sidebarData: SidebarData
  searchData: SearchData
  user: User | null
  editorPreferences: EditorPreferences
}

export default function DashboardShell({ children, sidebarData, searchData, user, editorPreferences }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [drawerItemId, setDrawerItemId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useLayoutEffect(() => {
    const saved = localStorage.getItem('sidebar-open')
    if (saved !== null) setSidebarOpen(saved === 'true')
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen(open => !open)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
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

  function handleSelectItem(itemId: string) {
    setDrawerItemId(itemId)
    setDrawerOpen(true)
  }

  return (
    <EditorPreferencesProvider initialPreferences={editorPreferences}>
    <div className="flex h-screen flex-col">
      <TopBar
        onMenuToggle={handleToggle}
        itemTypes={sidebarData.itemTypes}
        collections={sidebarData.allCollections}
        onSearchClick={() => setPaletteOpen(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={handleClose}
          sidebarData={sidebarData}
          user={user}
        />
        <main className="flex-1 overflow-auto px-8 py-8">{children}</main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        searchData={searchData}
        onSelectItem={handleSelectItem}
      />

      <ItemDrawer
        itemId={drawerItemId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        collections={sidebarData.allCollections}
      />
    </div>
    </EditorPreferencesProvider>
  )
}
