'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Star, ChevronUp } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { type SidebarData } from '@/lib/db/sidebar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import UserAvatar from '@/components/ui/user-avatar'
import { ICON_MAP } from '@/lib/icon-map'

type User = {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  sidebarData: SidebarData
  user: User | null
}

export default function Sidebar({ isOpen, onClose, sidebarData, user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { favoriteCollections, recentCollections } = sidebarData
  const PRO_TYPES = new Set(['file', 'image'])
  const itemTypes = [...sidebarData.itemTypes].sort((a, b) => {
    const aIsPro = PRO_TYPES.has(a.name) ? 1 : 0
    const bIsPro = PRO_TYPES.has(b.name) ? 1 : 0
    return aIsPro - bIsPro
  })

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        aria-hidden={!isOpen || undefined}
        {...(!isOpen && { inert: '' } as object)}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-background transition-all duration-300 overflow-hidden',
          'md:relative md:inset-auto md:z-auto',
          isOpen ? 'w-64' : 'w-0'
        )}
      >
        <div className="flex h-full w-64 flex-col">
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto py-3">
            {/* Item types */}
            <div className="px-3 mb-4">
              <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Types
              </p>
              <nav className="space-y-0.5">
                {itemTypes.map(type => {
                  const Icon = ICON_MAP[type.icon]
                  const href = `/items/${encodeURIComponent(type.name)}s`
                  const isActive = pathname === href

                  return (
                    <Link
                      key={type.id}
                      href={href}
                      className={cn(
                        'flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors',
                        isActive
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4 shrink-0" style={{ color: type.color }} />}
                        <span className="capitalize">{type.name}s</span>
                        {(type.name === 'file' || type.name === 'image') && (
                          <Badge variant="secondary" className="h-4 px-1 text-xs font-semibold tracking-wider">PRO</Badge>
                        )}
                      </span>
                      <span className="text-xs tabular-nums">{type.count}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Collections */}
            <div className="px-3">
              <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Collections
              </p>

              {/* Favorites */}
              {favoriteCollections.length > 0 && (
                <div className="mb-3">
                  <p className="px-2 pb-1 text-xs uppercase tracking-wider text-muted-foreground/60">
                    Favorites
                  </p>
                  <nav className="space-y-0.5">
                    {favoriteCollections.map(col => (
                      <Link
                        key={col.id}
                        href={`/collections/${col.id}`}
                        className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <span className="truncate">{col.name}</span>
                        <Star className="h-3 w-3 shrink-0 fill-yellow-500 text-yellow-500" />
                      </Link>
                    ))}
                  </nav>
                </div>
              )}

              {/* Recent collections */}
              {recentCollections.length > 0 && (
                <div>
                  <p className="px-2 pb-1 text-xs uppercase tracking-wider text-muted-foreground/60">
                    Recent
                  </p>
                  <nav className="space-y-0.5">
                    {recentCollections.map(col => (
                      <Link
                        key={col.id}
                        href={`/collections/${col.id}`}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: col.dominantColor ?? '#6b7280' }}
                        />
                        <span className="truncate">{col.name}</span>
                      </Link>
                    ))}
                  </nav>
                </div>
              )}

              {/* View all collections link */}
              <Link
                href="/collections"
                className="mt-2 flex items-center rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                View all collections
              </Link>
            </div>
          </div>

          {/* User avatar area */}
          <div className="shrink-0 border-t border-border p-3">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left outline-none hover:bg-accent transition-colors cursor-pointer">
                <UserAvatar name={user?.name} image={user?.image} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user?.name ?? 'User'}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email ?? ''}</p>
                </div>
                <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start">
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => signOut({ callbackUrl: '/sign-in' })}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>
    </>
  )
}