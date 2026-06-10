import { auth } from '@/auth'
import type { Session } from 'next-auth'

type AuthedSession = Session & { user: { id: string } }

type AuthResult =
  | { session: AuthedSession; error: null }
  | { session: null; error: Response }

export async function requireApiAuth(): Promise<AuthResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { session: null, error: Response.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { session: session as AuthedSession, error: null }
}
