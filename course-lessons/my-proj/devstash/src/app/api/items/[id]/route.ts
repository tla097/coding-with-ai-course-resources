import { NextRequest } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { getItemById } from '@/lib/db/items'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  const { id } = await params
  const item = await getItemById(id, session.user.id)

  if (!item) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  return Response.json(item)
}
