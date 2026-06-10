'use client'

import { useState, useCallback, type DragEvent } from 'react'
import { Upload, X, File, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatBytes } from '@/lib/utils'

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
const ALLOWED_FILE_TYPES = [
  'application/pdf', 'text/plain', 'text/markdown', 'application/json',
  'application/x-yaml', 'text/yaml', 'application/xml', 'text/xml',
  'text/csv', 'application/toml',
]

const IMAGE_ACCEPT = '.png,.jpg,.jpeg,.gif,.webp,.svg'
const FILE_ACCEPT = '.pdf,.txt,.md,.json,.yaml,.yml,.xml,.csv,.toml,.ini'
const IMAGE_MAX_BYTES = 5 * 1024 * 1024
const FILE_MAX_BYTES = 10 * 1024 * 1024

export interface UploadResult {
  path: string
  fileName: string
  fileSize: number
}

interface Props {
  itemType: 'file' | 'image'
  uploaded: UploadResult | null
  onUploadComplete: (result: UploadResult) => void
  onClear: () => void
}

export default function FileUpload({ itemType, uploaded, onUploadComplete, onClear }: Props) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const accept = itemType === 'image' ? IMAGE_ACCEPT : FILE_ACCEPT
  const maxBytes = itemType === 'image' ? IMAGE_MAX_BYTES : FILE_MAX_BYTES
  const allowedTypes = itemType === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_FILE_TYPES

  const validateFile = useCallback((file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `Invalid ${itemType} type`
    }
    if (file.size > maxBytes) {
      return `${itemType === 'image' ? 'Image' : 'File'} exceeds ${formatBytes(maxBytes)} limit`
    }
    return null
  }, [allowedTypes, maxBytes, itemType])

  async function uploadFile(file: File) {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setUploading(true)
    setProgress(0)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
          itemType,
        }),
      })

      if (!res.ok) {
        const { error: errMsg } = await res.json()
        throw new Error(errMsg || 'Failed to get upload URL')
      }

      const { signedUrl, path } = await res.json()

      // Upload directly to Supabase via XHR for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100))
          }
        })
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`Upload failed (${xhr.status})`))
          }
        })
        xhr.addEventListener('error', () => reject(new Error('Upload failed')))
        xhr.open('PUT', signedUrl)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.send(file)
      })

      onUploadComplete({ path, fileName: file.name, fileSize: file.size })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    e.target.value = ''
  }

  function handleDrop(e: DragEvent<HTMLElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  function handleDragOver(e: DragEvent<HTMLElement>) {
    e.preventDefault()
    setDragging(true)
  }

  if (uploaded) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{uploaded.fileName}</p>
          <p className="text-xs text-muted-foreground">{formatBytes(uploaded.fileSize)}</p>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onClear}>
          <X className="h-4 w-4" />
          <span className="sr-only">Remove file</span>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragging(false)}
        className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors ${
          uploading
            ? 'pointer-events-none opacity-60 border-border'
            : dragging
              ? 'border-primary bg-primary/5 cursor-copy'
              : 'border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer'
        }`}
      >
        {uploading ? (
          <div className="pointer-events-none flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground">Uploading…</p>
            <div className="w-full max-w-48 space-y-1">
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-xs text-muted-foreground">{progress}%</p>
            </div>
          </div>
        ) : (
          <>
            {/* Transparent overlay — user clicks directly on this input */}
            <input
              type="file"
              accept={accept}
              className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
              onChange={handleInputChange}
            />
            {/* Visual content — pointer-events-none so clicks pass through to input */}
            <div className="pointer-events-none flex flex-col items-center gap-2">
              <div className="rounded-full bg-muted p-3">
                {itemType === 'image'
                  ? <Upload className="h-5 w-5 text-muted-foreground" />
                  : <File className="h-5 w-5 text-muted-foreground" />
                }
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">
                  Drop {itemType === 'image' ? 'an image' : 'a file'} or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {itemType === 'image'
                    ? 'PNG, JPG, GIF, WebP, SVG — max 5 MB'
                    : 'PDF, TXT, MD, JSON, YAML, XML, CSV, TOML — max 10 MB'}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
