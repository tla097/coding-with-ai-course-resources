import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DashboardShell from '@/components/layout/DashboardShell'
import { getSidebarData } from '@/lib/db/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { emailVerified: true },
    })
    if (!user?.emailVerified) {
      redirect('/verify-email')
    }
  }

  try {
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
