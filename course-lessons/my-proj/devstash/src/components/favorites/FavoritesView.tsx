'use client'

import { useState, useMemo } from 'react'
import { useSortState } from '@/hooks/useSortState'
import Link from 'next/link'
import { Folder, ChevronUp, ChevronDown } from 'lucide-react'
import ItemDrawer from '@/components/items/ItemDrawer'
import { ICON_MAP } from '@/lib/icon-map'
import type { FavoriteItem, FavoriteCollection } from '@/lib/db/favorites'

interface Props {
  items: FavoriteItem[]
  collections: FavoriteCollection[]
  collectionList: { id: string; name: string }[]
  isPro?: boolean
}

type ItemSortKey = 'name' | 'type' | 'date'
type CollectionSortKey = 'name' | 'date'
type SortDir = 'asc' | 'desc'

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

interface SortHeaderProps {
  label: string
  sortKey: string
  activeKey: string
  dir: SortDir
  onClick: (key: string) => void
  className?: string
}

function SortHeader({ label, sortKey, activeKey, dir, onClick, className = '' }: SortHeaderProps) {
  const isActive = sortKey === activeKey
  return (
    <button
      type="button"
      onClick={() => onClick(sortKey)}
      className={`flex items-center gap-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest transition-colors ${
        isActive
          ? 'rounded bg-accent px-1.5 py-0.5 text-foreground'
          : 'px-1.5 py-0.5 text-muted-foreground hover:text-foreground'
      } ${className}`}
    >
      {label}
      {isActive ? (
        dir === 'asc' ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )
      ) : null}
    </button>
  )
}

export default function FavoritesView({ items, collections, collectionList, isPro }: Props) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const { key: itemSortKey, dir: itemSortDir, toggle: handleItemSort } = useSortState<ItemSortKey>('date', 'desc')
  const { key: colSortKey, dir: colSortDir, toggle: handleColSort } = useSortState<CollectionSortKey>('date', 'desc')

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      let cmp = 0
      if (itemSortKey === 'name') {
        cmp = a.title.localeCompare(b.title)
      } else if (itemSortKey === 'type') {
        cmp = a.itemType.name.localeCompare(b.itemType.name)
      } else {
        cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      }
      return itemSortDir === 'asc' ? cmp : -cmp
    })
  }, [items, itemSortKey, itemSortDir])

  const sortedCollections = useMemo(() => {
    return [...collections].sort((a, b) => {
      let cmp = 0
      if (colSortKey === 'name') {
        cmp = a.name.localeCompare(b.name)
      } else {
        cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      }
      return colSortDir === 'asc' ? cmp : -cmp
    })
  }, [collections, colSortKey, colSortDir])

  function openItem(id: string) {
    setSelectedItemId(id)
    setDrawerOpen(true)
  }

  return (
    <>
      <div className="space-y-8">
        {/* Items section */}
        <section>
          <div className="mb-2 flex items-center gap-2 border-b border-border pb-2">
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Items
            </span>
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
              {items.length}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <SortHeader
                label="Name"
                sortKey="name"
                activeKey={itemSortKey}
                dir={itemSortDir}
                onClick={handleItemSort}
              />
              <SortHeader
                label="Type"
                sortKey="type"
                activeKey={itemSortKey}
                dir={itemSortDir}
                onClick={handleItemSort}
              />
              <SortHeader
                label="Date"
                sortKey="date"
                activeKey={itemSortKey}
                dir={itemSortDir}
                onClick={handleItemSort}
              />
            </div>
          </div>

          {sortedItems.length === 0 ? (
            <p className="py-4 font-mono text-xs text-muted-foreground">No favorite items yet.</p>
          ) : (
            <ul>
              {sortedItems.map(item => {
                const Icon = ICON_MAP[item.itemType.icon] ?? null
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => openItem(item.id)}
                      className="flex w-full items-center gap-3 rounded px-2 py-1.5 text-left transition-colors hover:bg-accent"
                    >
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
                        style={{ backgroundColor: `${item.itemType.color}20` }}
                      >
                        {Icon && (
                          <Icon className="h-3 w-3" style={{ color: item.itemType.color }} />
                        )}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-mono text-sm">
                        {item.title}
                      </span>
                      <span
                        className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-medium"
                        style={{
                          backgroundColor: `${item.itemType.color}20`,
                          color: item.itemType.color,
                        }}
                      >
                        {item.itemType.name}
                      </span>
                      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                        {formatDate(item.updatedAt)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Collections section */}
        <section>
          <div className="mb-2 flex items-center gap-2 border-b border-border pb-2">
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Collections
            </span>
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
              {collections.length}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <SortHeader
                label="Name"
                sortKey="name"
                activeKey={colSortKey}
                dir={colSortDir}
                onClick={handleColSort}
              />
              <SortHeader
                label="Date"
                sortKey="date"
                activeKey={colSortKey}
                dir={colSortDir}
                onClick={handleColSort}
              />
            </div>
          </div>

          {sortedCollections.length === 0 ? (
            <p className="py-4 font-mono text-xs text-muted-foreground">No favorite collections yet.</p>
          ) : (
            <ul>
              {sortedCollections.map(col => (
                <li key={col.id}>
                  <Link
                    href={`/collections/${col.id}`}
                    className="flex w-full items-center gap-3 rounded px-2 py-1.5 transition-colors hover:bg-accent"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted">
                      <Folder className="h-3 w-3 text-muted-foreground" />
                    </span>
                    <span className="min-w-0 flex-1 truncate font-mono text-sm">{col.name}</span>
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {col.itemCount} item{col.itemCount !== 1 ? 's' : ''}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                      {formatDate(col.updatedAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <ItemDrawer
        itemId={selectedItemId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        collections={collectionList}
        isPro={isPro}
      />
    </>
  )
}
