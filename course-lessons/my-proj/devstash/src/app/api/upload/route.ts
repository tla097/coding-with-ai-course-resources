import { NextRequest } from 'next/server'
import { requireApiAuth } from '@/lib/api-auth'
import { createSupabaseServer, SUPABASE_BUCKET } from '@/lib/supabase/server'

const ALLOWED_IMAGE_MIME = new Set([
  'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml',
])
const ALLOWED_FILE_MIME = new Set([
  'application/pdf', 'text/plain', 'text/markdown', 'application/json',
  'application/x-yaml', 'text/yaml', 'application/xml', 'text/xml',
  'text/csv', 'application/toml',
])
const IMAGE_MAX_BYTES = 5 * 1024 * 1024
const FILE_MAX_BYTES = 10 * 1024 * 1024

export async function POST(request: NextRequest) {
  const { session, error } = await requireApiAuth()
  if (error) return error

  let body: { fileName?: string; contentType?: string; fileSize?: number; itemType?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { fileName, contentType, fileSize, itemType } = body

  if (!fileName || !contentType || typeof fileSize !== 'number' || !itemType) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (itemType === 'image') {
    if (!ALLOWED_IMAGE_MIME.has(contentType)) {
      return Response.json({ error: 'Invalid image type. Allowed: PNG, JPG, GIF, WebP, SVG' }, { status: 400 })
    }
    if (fileSize > IMAGE_MAX_BYTES) {
      return Response.json({ error: 'Image exceeds 5 MB limit' }, { status: 400 })
    }
  } else if (itemType === 'file') {
    if (!ALLOWED_FILE_MIME.has(contentType)) {
      return Response.json({ error: 'Invalid file type. Allowed: PDF, TXT, MD, JSON, YAML, XML, CSV, TOML, INI' }, { status: 400 })
    }
    if (fileSize > FILE_MAX_BYTES) {
      return Response.json({ error: 'File exceeds 10 MB limit' }, { status: 400 })
    }
  } else {
    return Response.json({ error: 'Invalid item type' }, { status: 400 })
  }

  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${session.user.id}/${Date.now()}-${sanitized}`

  const supabase = createSupabaseServer()
  const { data, error: uploadError } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .createSignedUploadUrl(storagePath)

  if (uploadError) {
    return Response.json({ error: uploadError.message }, { status: 500 })
  }

  return Response.json({ signedUrl: data.signedUrl, token: data.token, path: data.path })
}
