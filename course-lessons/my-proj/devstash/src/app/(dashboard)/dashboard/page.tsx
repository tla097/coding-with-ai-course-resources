export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Package, FolderOpen, Star, Bookmark, Pin } from 'lucide-react'
import CollectionCard from '@/components/dashboard/CollectionCard'
import ItemCard from '@/components/dashboard/ItemCard'
import { getRecentCollections } from '@/lib/db/collections'
import { getPinnedItems, getRecentItems, getItemStats } from '@/lib/db/items'

export default async function DashboardPage() {
  const [collections, pinnedItems, recentItems, itemStats] = await Promise.all([
    getRecentCollections(),
    getPinnedItems(),
    getRecentItems(),
    getItemStats(),
  ])

  const stats = [
    {
      label: 'Items',
      value: itemStats.total,
      icon: Package,
      color: '#3b82f6',
    },
    {
      label: 'Collections',
      value: collections.length,
      icon: FolderOpen,
      color: '#8b5cf6',
    },
    {
      label: 'Favorite Items',
      value: itemStats.favorites,
      icon: Star,
      color: '#f97316',
    },
    {
      label: 'Favorite Collections',
      value: collections.filter(c => c.isFavorite).length,
      icon: Bookmark,
      color: '#10b981',
    },
  ]

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Your developer knowledge hub</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: `${stat.color}20` }}
              >
                <Icon className="h-5 w-5" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Collections */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Collections</h2>
          <Link
            href="/collections"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map(col => (
            <CollectionCard key={col.id} collection={col} />
          ))}
        </div>
      </section>

      {/* Pinned Items */}
      {pinnedItems.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Pin className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Pinned</h2>
          </div>
          <div className="space-y-2">
            {pinnedItems.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Items */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Recent Items</h2>
        </div>
        <div className="space-y-2">
          {recentItems.map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  )
}
