'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Pin, Copy, Pencil, Trash2, FolderOpen, Calendar, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import CodeEditor from '@/components/ui/CodeEditor'
import MarkdownEditor from '@/components/ui/MarkdownEditor'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ICON_MAP } from '@/lib/icon-map'
import CollectionPicker from '@/components/items/CollectionPicker'
import type { ItemDetail } from '@/lib/db/items'
import { updateItem, deleteItem, toggleItemFavorite } from '@/actions/items'

interface ItemDetailResponse extends Omit<ItemDetail, 'createdAt' | 'updatedAt'> {
  createdAt: string
  updatedAt: string
}

interface EditForm {
  title: string
  description: string
  content: string
  url: string
  language: string
  tags: string
  collectionIds: string[]
}

interface Props {
  itemId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  collections: { id: string; name: string }[]
}

const CONTENT_TYPES = ['snippet', 'prompt', 'command', 'note']
const LANGUAGE_TYPES = ['snippet', 'command']
const CODE_EDITOR_TYPES = ['snippet', 'command']
const MARKDOWN_EDITOR_TYPES = ['note', 'prompt']
const URL_TYPES = ['link']

export default function ItemDrawer({ itemId, open, onOpenChange, collections }: Props) {
  const router = useRouter()
  const [item, setItem] = useState<ItemDetailResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<EditForm>({
    title: '',
    description: '',
    content: '',
    url: '',
    language: '',
    tags: '',
    collectionIds: [],
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [favoriting, setFavoriting] = useState(false)

  useEffect(() => {
    if (!itemId || !open) return

    setLoading(true)
    setItem(null)
    setIsEditing(false)

    fetch(`/api/items/${itemId}`)
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch')
        return r.json()
      })
      .then((data: ItemDetailResponse) => {
        setItem(data)
        setIsFavorite(data.isFavorite)
        setIsPinned(data.isPinned)
      })
      .catch(() => toast.error('Failed to load item'))
      .finally(() => setLoading(false))
  }, [itemId, open])

  function handleEditStart() {
    if (!item) return
    setEditForm({
      title: item.title,
      description: item.description ?? '',
      content: item.content ?? '',
      url: item.url ?? '',
      language: item.language ?? '',
      tags: item.tags.map(t => t.name).join(', '),
      collectionIds: item.collections.map(c => c.collection.id),
    })
    setIsEditing(true)
  }

  function handleCancelEdit() {
    setIsEditing(false)
  }

  async function handleSave() {
    if (!item || !itemId) return
    setSaving(true)
    try {
      const tags = editForm.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)

      const result = await updateItem(itemId, {
        title: editForm.title,
        description: editForm.description || null,
        content: editForm.content || null,
        url: editForm.url || null,
        language: editForm.language || null,
        tags,
        collectionIds: editForm.collectionIds,
      })

      if (!result.success) {
        const errorMsg =
          typeof result.error === 'string'
            ? result.error
            : 'Validation failed. Please check your inputs.'
        toast.error(errorMsg)
        return
      }

      const updated = result.data
      setItem({
        ...updated,
        createdAt: new Date(updated.createdAt).toISOString(),
        updatedAt: new Date(updated.updatedAt).toISOString(),
      })
      setIsEditing(false)
      toast.success('Item updated')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!itemId) return
    setDeleting(true)
    try {
      const result = await deleteItem(itemId)
      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : 'Failed to delete item.')
        return
      }
      toast.success('Item deleted')
      onOpenChange(false)
      router.refresh()
    } finally {
      setDeleting(false)
    }
  }

  async function handleToggleFavorite() {
    if (!itemId) return
    const optimistic = !isFavorite
    setIsFavorite(optimistic)
    setFavoriting(true)
    try {
      const result = await toggleItemFavorite(itemId)
      if (!result.success) {
        setIsFavorite(!optimistic)
        toast.error(typeof result.error === 'string' ? result.error : 'Failed to update favorite.')
        return
      }
      router.refresh()
    } finally {
      setFavoriting(false)
    }
  }

  function handleCopy() {
    if (!item) return
    const text = item.content ?? item.url ?? item.title
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard')
    })
  }

  const Icon = item ? (ICON_MAP[item.itemType.icon] ?? null) : null
  const typeName = item?.itemType.name ?? ''
  const showContent = CONTENT_TYPES.includes(typeName)
  const showLanguage = LANGUAGE_TYPES.includes(typeName)
  const showCodeEditor = CODE_EDITOR_TYPES.includes(typeName)
  const showMarkdownEditor = MARKDOWN_EDITOR_TYPES.includes(typeName)
  const showUrl = URL_TYPES.includes(typeName)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 p-0 sm:max-w-lg"
      >
        {loading && <DrawerSkeleton />}

        {!loading && item && (
          <>
            <SheetHeader className="px-5 pt-5 pb-4 border-b border-border gap-2">
              <div className="flex items-center gap-2 pr-8">
                {Icon && (
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${item.itemType.color}20` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: item.itemType.color }} />
                  </div>
                )}
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
                  style={{ backgroundColor: `${item.itemType.color}20`, color: item.itemType.color }}
                >
                  {item.itemType.name}
                </span>
                {!isEditing && item.language && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {item.language}
                  </span>
                )}
              </div>
              <SheetTitle className="text-lg pr-8 leading-snug">
                {isEditing ? (editForm.title || 'Editing…') : item.title}
              </SheetTitle>
            </SheetHeader>

            {/* Action bar */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-border">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving || !editForm.title.trim()}
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleCancelEdit} disabled={saving}>
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleFavorite}
                    disabled={favoriting}
                    className={isFavorite ? 'text-yellow-500 hover:text-yellow-600' : ''}
                  >
                    <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-500' : ''}`} />
                    {isFavorite ? 'Unfavorite' : 'Favorite'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPinned(p => !p)}
                  >
                    <Pin className={`h-4 w-4 ${isPinned ? 'fill-foreground' : ''}`} />
                    Pin
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                  <div className="ml-auto flex items-center gap-0.5">
                    <Button variant="ghost" size="icon-sm" onClick={handleEditStart}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            disabled={deleting}
                          />
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete item?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. The item will be permanently deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              {isEditing ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-title">
                      Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="edit-title"
                      value={editForm.title}
                      onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Title"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={editForm.description}
                      onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Description (optional)"
                      rows={3}
                    />
                  </div>

                  {showContent && (
                    <div className="space-y-1.5">
                      <Label>Content</Label>
                      {showCodeEditor ? (
                        <CodeEditor
                          value={editForm.content}
                          onChange={v => setEditForm(f => ({ ...f, content: v }))}
                          language={editForm.language || null}
                        />
                      ) : showMarkdownEditor ? (
                        <MarkdownEditor
                          value={editForm.content}
                          onChange={v => setEditForm(f => ({ ...f, content: v }))}
                        />
                      ) : (
                        <Textarea
                          id="edit-content"
                          value={editForm.content}
                          onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))}
                          placeholder="Content"
                          rows={8}
                        />
                      )}
                    </div>
                  )}

                  {showLanguage && (
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-language">Language</Label>
                      <Input
                        id="edit-language"
                        value={editForm.language}
                        onChange={e => setEditForm(f => ({ ...f, language: e.target.value }))}
                        placeholder="e.g. typescript, python"
                      />
                    </div>
                  )}

                  {showUrl && (
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-url">URL</Label>
                      <Input
                        id="edit-url"
                        type="url"
                        value={editForm.url}
                        onChange={e => setEditForm(f => ({ ...f, url: e.target.value }))}
                        placeholder="https://…"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-tags">Tags</Label>
                    <Input
                      id="edit-tags"
                      value={editForm.tags}
                      onChange={e => setEditForm(f => ({ ...f, tags: e.target.value }))}
                      placeholder="react, typescript, hooks"
                    />
                    <p className="text-xs text-muted-foreground">Comma-separated</p>
                  </div>

                  {collections.length > 0 && (
                    <div className="space-y-1.5">
                      <Label>Collections</Label>
                      <CollectionPicker
                        collections={collections}
                        selected={editForm.collectionIds}
                        onChange={ids => setEditForm(f => ({ ...f, collectionIds: ids }))}
                      />
                    </div>
                  )}
                </>
              ) : (
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
                        />
                      ) : showMarkdownEditor ? (
                        <MarkdownEditor
                          value={item.content}
                          readOnly
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
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
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
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function DrawerSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="px-5 pt-5 pb-4 border-b border-border space-y-3">
        <div className="flex gap-2 pr-8">
          <div className="h-5 w-16 bg-muted rounded-full" />
          <div className="h-5 w-20 bg-muted rounded-full" />
        </div>
        <div className="h-6 w-3/4 bg-muted rounded" />
      </div>
      <div className="flex gap-2 px-4 py-3 border-b border-border">
        <div className="h-7 w-20 bg-muted rounded" />
        <div className="h-7 w-12 bg-muted rounded" />
        <div className="h-7 w-14 bg-muted rounded" />
      </div>
      <div className="px-5 py-5 space-y-5">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-muted rounded" />
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-4/5 bg-muted rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-16 bg-muted rounded" />
          <div className="h-28 w-full bg-muted rounded-md" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-10 bg-muted rounded" />
          <div className="flex gap-1.5">
            <div className="h-5 w-14 bg-muted rounded-full" />
            <div className="h-5 w-10 bg-muted rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
