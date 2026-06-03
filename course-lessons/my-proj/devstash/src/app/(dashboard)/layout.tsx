import { auth } from '@/auth'
import DashboardShell from '@/components/layout/DashboardShell'
import { getSidebarData } from '@/lib/db/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const session = await auth()
    const sidebarData = await getSidebarData(session?.user?.id ?? '')
    return (
      <DashboardShell sidebarData={sidebarData} user={session?.user ?? null}>
        {children}
      </DashboardShell>
    )
  } catch {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Failed to load dashboard. Check your database connection.
        </p>
      </div>
    )
  }
}