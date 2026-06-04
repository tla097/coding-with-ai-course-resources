import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { getItemById } from '@/lib/db/items'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const item = await getItemById(id, session.user.id)

  if (!item) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  return Response.json(item)
}
