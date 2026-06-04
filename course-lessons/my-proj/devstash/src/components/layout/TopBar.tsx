'use client'

import { PanelLeft, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import NewItemDialog from '@/components/items/NewItemDialog'
import type { SidebarItemType } from '@/lib/db/sidebar'

interface TopBarProps {
  onMenuToggle: () => void
  itemTypes: SidebarItemType[]
}

export default function TopBar({ onMenuToggle, itemTypes }: TopBarProps) {
  return (
    <header className="flex items-center gap-2 border-b border-border px-4 py-3">
      <Button variant="ghost" size="icon" onClick={onMenuToggle} className="shrink-0">
        <PanelLeft className="h-5 w-5" />
      </Button>
      <div className="flex flex-1 items-center">
        <span className="text-lg font-bold tracking-tight">DevStash</span>
      </div>
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search items..." className="pl-9" />
      </div>
      <div className="flex flex-1 items-center justify-end gap-2">
        <Button variant="outline" size="sm">
          New Collection
        </Button>
        <NewItemDialog itemTypes={itemTypes} />
      </div>
    </header>
  )
}
