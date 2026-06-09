import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { createSupabaseServer, SUPABASE_BUCKET } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const storagePath = request.nextUrl.searchParams.get('path')
  const preview = request.nextUrl.searchParams.get('preview') === 'true'

  if (!storagePath) {
    return Response.json({ error: 'Missing path' }, { status: 400 })
  }

  // Verify the file belongs to this user
  const item = await prisma.item.findFirst({
    where: { userId: session.user.id, fileUrl: storagePath },
    select: { id: true, fileName: true },
  })
  if (!item) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const supabase = createSupabaseServer()
  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .download(storagePath)

  if (error || !data) {
    return Response.json({ error: 'Failed to retrieve file' }, { status: 500 })
  }

  const buffer = await data.arrayBuffer()
  const fileName = item.fileName ?? storagePath.split('/').pop() ?? 'download'
  const headers: Record<string, string> = {
    'Content-Type': data.type || 'application/octet-stream',
  }

  if (!preview) {
    headers['Content-Disposition'] = `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`
  }

  return new Response(buffer, { headers })
}
