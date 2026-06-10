import { auth } from '@/auth'

type AuthResult = { ok: true; userId: string; isPro: boolean } | { ok: false; error: string }

export async function requireAuth(): Promise<AuthResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Not authenticated.' }
  return { ok: true, userId: session.user.id, isPro: session.user.isPro ?? false }
}
