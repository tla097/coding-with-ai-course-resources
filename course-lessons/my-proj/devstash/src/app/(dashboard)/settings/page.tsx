import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getProfileData } from '@/lib/db/profile'
import ChangePasswordForm from '@/components/profile/ChangePasswordForm'
import DeleteAccountButton from '@/components/profile/DeleteAccountButton'
import EditorPreferencesForm from '@/components/settings/EditorPreferencesForm'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/sign-in')

  const profile = await getProfileData(session.user.id)

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account settings</p>
      </div>

      <EditorPreferencesForm />

      {profile.hasPassword && <ChangePasswordForm />}

      <DeleteAccountButton />
    </div>
  )
}
