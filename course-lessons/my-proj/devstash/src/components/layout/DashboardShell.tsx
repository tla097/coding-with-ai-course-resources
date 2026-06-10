'use client'

import { useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import Sidebar from '@/components/layout/Sidebar'
import CommandPalette from '@/components/search/CommandPalette'
import ItemDrawer from '@/components/items/ItemDrawer'
import { EditorPreferencesProvider } from '@/contexts/EditorPreferencesContext'
import { type SidebarData } from '@/lib/db/sidebar'
import { type SearchData } from '@/lib/db/search'
import { type EditorPreferences } from '@/types/editor-preferences'
import { usePersistentBoolean } from '@/hooks/usePersistentBoolean'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'

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
  isPro?: boolean
}

export default function DashboardShell({ children, sidebarData, searchData, user, editorPreferences, isPro }: Props) {
  const [sidebarOpen, setSidebarOpen] = usePersistentBoolean('sidebar-open', true)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [drawerItemId, setDrawerItemId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useKeyboardShortcut('k', () => setPaletteOpen(open => !open), { ctrlOrMeta: true })

  const handleToggle = () => setSidebarOpen(prev => !prev)
  const handleClose = () => setSidebarOpen(false)

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
        isPro={isPro}
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
        isPro={isPro}
      />
    </div>
    </EditorPreferencesProvider>
  )
}
