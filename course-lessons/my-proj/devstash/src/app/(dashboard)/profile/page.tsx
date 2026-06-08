import type { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getProfileData } from '@/lib/db/profile'
import UserAvatar from '@/components/ui/user-avatar'
import EditNameForm from '@/components/profile/EditNameForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Profile | DevStash',
}

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')

  const profile = await getProfileData(session.user.id)

  const joinedDate = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(profile.createdAt))

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account</p>
      </div>

      {/* User info */}
      <div className="rounded-lg border border-border bg-card p-6 flex items-center gap-4">
        <UserAvatar name={profile.name} image={profile.image} className="h-14 w-14 text-base" />
        <div className="min-w-0">
          <p className="font-semibold text-lg truncate">{profile.name ?? 'No name'}</p>
          <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
          <p className="text-xs text-muted-foreground mt-1">Member since {joinedDate}</p>
        </div>
      </div>

      {/* Edit name */}
      <EditNameForm currentName={profile.name ?? null} />

      {/* Usage stats */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="text-base font-semibold">Usage</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md bg-muted/40 px-4 py-3">
            <p className="text-2xl font-bold">{profile.totalItems}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Items</p>
          </div>
          <div className="rounded-md bg-muted/40 px-4 py-3">
            <p className="text-2xl font-bold">{profile.totalCollections}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Collections</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Items by type</p>
          <div className="space-y-1.5">
            {profile.itemsByType.map(stat => (
              <div key={stat.typeName} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: stat.color }}
                  />
                  <span className="capitalize text-muted-foreground">{stat.typeName}s</span>
                </div>
                <span className="tabular-nums font-medium">{stat.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
