'use client'

import {
  File,
  FileText,
  FileCode,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  Download,
} from 'lucide-react'
import type { ItemWithType } from '@/lib/db/items'
import { formatBytes } from '@/lib/utils'
import { useKeyboardClick } from '@/hooks/useKeyboardClick'

const TEXT_EXTS = new Set(['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages'])
const CODE_EXTS = new Set(['js', 'ts', 'tsx', 'jsx', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'cs', 'php', 'html', 'css', 'json', 'xml', 'yaml', 'yml', 'sh', 'md'])
const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'])
const VIDEO_EXTS = new Set(['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'])
const AUDIO_EXTS = new Set(['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'])
const ARCHIVE_EXTS = new Set(['zip', 'rar', '7z', 'tar', 'gz', 'bz2'])

function getFileIcon(fileName: string | null) {
  if (!fileName) return File
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  if (TEXT_EXTS.has(ext)) return FileText
  if (CODE_EXTS.has(ext)) return FileCode
  if (IMAGE_EXTS.has(ext)) return FileImage
  if (VIDEO_EXTS.has(ext)) return FileVideo
  if (AUDIO_EXTS.has(ext)) return FileAudio
  if (ARCHIVE_EXTS.has(ext)) return FileArchive
  return File
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date))
}

interface Props {
  item: ItemWithType
  onClick?: () => void
}

export default function FileListRow({ item, onClick }: Props) {
  const Icon = getFileIcon(item.fileName)
  const handleKeyDown = useKeyboardClick(onClick)

  function handleDownload(e: React.MouseEvent) {
    e.stopPropagation()
    if (!item.fileUrl) return
    const a = document.createElement('a')
    a.href = `/api/download?path=${encodeURIComponent(item.fileUrl)}`
    a.download = item.fileName ?? item.title
    a.click()
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className="group flex cursor-pointer items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      {/* File icon */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Name + meta */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.title}</p>
        <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground sm:flex-nowrap">
          {item.fileName && (
            <span className="truncate">{item.fileName}</span>
          )}
          <span className="shrink-0">{formatBytes(item.fileSize)}</span>
          <span className="shrink-0">{formatDate(item.createdAt)}</span>
        </div>
      </div>

      {/* Download button */}
      {item.fileUrl && (
        <button
          type="button"
          onClick={handleDownload}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Download ${item.title}`}
        >
          <Download className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
