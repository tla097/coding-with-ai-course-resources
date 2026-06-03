import { prisma } from '@/lib/prisma'
import DashboardShell from '@/components/layout/DashboardShell'
import { getSidebarData } from '@/lib/db/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    // TODO: replace with session.user.id when NextAuth is wired
    const devUser = await prisma.user.findFirst({ select: { id: true } })
    const sidebarData = await getSidebarData(devUser?.id ?? '')
    return <DashboardShell sidebarData={sidebarData}>{children}</DashboardShell>
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
