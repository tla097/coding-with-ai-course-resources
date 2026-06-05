import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import DashboardShell from '@/components/layout/DashboardShell'
import { getSidebarData } from '@/lib/db/sidebar'
import { getSearchData } from '@/lib/db/search'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (session?.user?.id && process.env.DISABLE_EMAIL_VERIFICATION !== "true") {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { emailVerified: true },
    })
    if (!user?.emailVerified) {
      redirect('/verify-email')
    }
  }

  try {
    const userId = session?.user?.id ?? ''
    const [sidebarData, searchData] = await Promise.all([
      getSidebarData(userId),
      getSearchData(userId),
    ])
    return (
      <DashboardShell sidebarData={sidebarData} searchData={searchData} user={session?.user ?? null}>
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
