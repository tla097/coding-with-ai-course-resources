'use client'

import { useRouter } from 'next/navigation'
import { FolderOpen } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import { ICON_MAP } from '@/lib/icon-map'
import type { SearchData } from '@/lib/db/search'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  searchData: SearchData
  onSelectItem: (itemId: string) => void
}

export default function CommandPalette({ open, onOpenChange, searchData, onSelectItem }: Props) {
  const router = useRouter()

  function handleSelectItem(itemId: string) {
    onOpenChange(false)
    onSelectItem(itemId)
  }

  function handleSelectCollection(collectionId: string) {
    onOpenChange(false)
    router.push(`/collections/${collectionId}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="p-0 overflow-hidden max-w-lg">
        <Command className="rounded-xl">
          <CommandInput placeholder="Search items and collections..." autoFocus />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            {searchData.items.length > 0 && (
              <CommandGroup heading="Items">
                {searchData.items.map(item => {
                  const Icon = ICON_MAP[item.itemType.icon] ?? null
                  return (
                    <CommandItem
                      key={item.id}
                      value={`${item.title} ${item.itemType.name}`}
                      keywords={item.contentPreview ? [item.contentPreview] : undefined}
                      onSelect={() => handleSelectItem(item.id)}
                    >
                      {Icon && (
                        <div
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded"
                          style={{ backgroundColor: `${item.itemType.color}20` }}
                        >
                          <Icon className="h-3.5 w-3.5" style={{ color: item.itemType.color }} />
                        </div>
                      )}
                      <span className="flex-1 truncate">{item.title}</span>
                      <span
                        className="shrink-0 text-xs px-1.5 py-0.5 rounded-full capitalize"
                        style={{
                          backgroundColor: `${item.itemType.color}20`,
                          color: item.itemType.color,
                        }}
                      >
                        {item.itemType.name}
                      </span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {searchData.items.length > 0 && searchData.collections.length > 0 && (
              <CommandSeparator />
            )}

            {searchData.collections.length > 0 && (
              <CommandGroup heading="Collections">
                {searchData.collections.map(col => (
                  <CommandItem
                    key={col.id}
                    value={col.name}
                    onSelect={() => handleSelectCollection(col.id)}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-accent">
                      <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <span className="flex-1 truncate">{col.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {col.itemCount} {col.itemCount === 1 ? 'item' : 'items'}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
