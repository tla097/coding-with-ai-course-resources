'use client'

import Link from 'next/link'
import { PanelLeft, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import NewItemDialog from '@/components/items/NewItemDialog'
import NewCollectionDialog from '@/components/collections/NewCollectionDialog'
import type { SidebarItemType } from '@/lib/db/sidebar'

interface TopBarProps {
  onMenuToggle: () => void
  itemTypes: SidebarItemType[]
  collections: { id: string; name: string }[]
  onSearchClick: () => void
}

export default function TopBar({ onMenuToggle, itemTypes, collections, onSearchClick }: TopBarProps) {
  return (
    <header className="flex items-center gap-2 border-b border-border px-4 py-3">
      <Button variant="ghost" size="icon" onClick={onMenuToggle} className="shrink-0">
        <PanelLeft className="h-5 w-5" />
      </Button>
      <div className="flex flex-1 items-center">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight hover:opacity-80 transition-opacity">DevStash</Link>
      </div>
      <button
        onClick={onSearchClick}
        className="relative flex w-full max-w-sm items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        type="button"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">Search items...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <div className="flex flex-1 items-center justify-end gap-2">
        <NewCollectionDialog />
        <NewItemDialog itemTypes={itemTypes} collections={collections} />
      </div>
    </header>
  )
}
