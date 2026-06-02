import DashboardShell from '@/components/layout/DashboardShell'
import { getSidebarData } from '@/lib/db/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const sidebarData = await getSidebarData()
  return <DashboardShell sidebarData={sidebarData}>{children}</DashboardShell>
}
