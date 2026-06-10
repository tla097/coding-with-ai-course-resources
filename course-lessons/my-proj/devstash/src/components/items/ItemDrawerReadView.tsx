'use client'

import { FolderOpen, Calendar, CalendarCheck, FileText } from 'lucide-react'
import CodeEditor from '@/components/ui/CodeEditor'
import MarkdownEditor from '@/components/ui/MarkdownEditor'
import { formatBytes } from '@/lib/utils'
import type { ItemDetailResponse } from '@/hooks/useItemDrawer'

interface Props {
  item: ItemDetailResponse
  isPro?: boolean
  typeName: string
  showCodeEditor: boolean
  showMarkdownEditor: boolean
  showFile: boolean
  onUseOptimized: (text: string) => void
}

export default function ItemDrawerReadView({
  item,
  isPro,
  typeName,
  showCodeEditor,
  showMarkdownEditor,
  showFile,
  onUseOptimized,
}: Props) {
  return (
    <>
      {item.description && (
        <section>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Description
          </h3>
          <p className="text-sm">{item.description}</p>
        </section>
      )}

      {item.content && (
        <section>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Content
          </h3>
          {showCodeEditor ? (
            <CodeEditor
              value={item.content}
              language={item.language}
              readOnly
              isPro={isPro}
              itemType={typeName}
            />
          ) : showMarkdownEditor ? (
            <MarkdownEditor
              value={item.content}
              readOnly
              isPro={isPro}
              itemType={typeName}
              onUseOptimized={typeName === 'prompt' ? onUseOptimized : undefined}
            />
          ) : (
            <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto whitespace-pre-wrap break-words font-mono leading-relaxed">
              {item.content}
            </pre>
          )}
        </section>
      )}

      {item.url && (
        <section>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            URL
          </h3>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline break-all"
          >
            {item.url}
          </a>
        </section>
      )}

      {showFile && item.fileUrl && (
        <section>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {typeName === 'image' ? 'Image' : 'File'}
          </h3>
          {typeName === 'image' ? (
            <div className="rounded-lg overflow-hidden border border-border bg-muted/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/download?path=${encodeURIComponent(item.fileUrl)}&preview=true`}
                alt={item.fileName ?? item.title}
                className="max-w-full h-auto"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3">
              <FileText className="h-8 w-8 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.fileName ?? 'File'}</p>
                {item.fileSize !== null && item.fileSize !== undefined && (
                  <p className="text-xs text-muted-foreground">{formatBytes(item.fileSize)}</p>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {item.tags.length > 0 && (
        <section>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Tags
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map(tag => (
              <span
                key={tag.id}
                className="rounded-full bg-accent px-2.5 py-0.5 text-xs text-muted-foreground"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {item.collections.length > 0 && (
        <section>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Collections
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {item.collections.map(({ collection }) => (
              <span
                key={collection.id}
                className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs text-muted-foreground"
              >
                <FolderOpen className="h-3 w-3" />
                {collection.name}
              </span>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Details
        </h3>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>
              Created{' '}
              {new Date(item.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-3.5 w-3.5 shrink-0" />
            <span>
              Updated{' '}
              {new Date(item.updatedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </section>
    </>
  )
}
