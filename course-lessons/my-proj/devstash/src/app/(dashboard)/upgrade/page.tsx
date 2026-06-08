import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import UpgradePage from '@/components/upgrade/UpgradePage'

export default async function Page() {
  const session = await auth()
  if (!session?.user) redirect('/sign-in')
  if (session.user.isPro) redirect('/dashboard')
  return <UpgradePage />
}
