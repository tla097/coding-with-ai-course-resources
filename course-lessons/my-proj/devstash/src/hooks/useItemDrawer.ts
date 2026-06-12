'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ICON_MAP } from '@/lib/icon-map'
import { CONTENT_TYPES, LANGUAGE_TYPES, CODE_EDITOR_TYPES, MARKDOWN_EDITOR_TYPES } from '@/lib/languages'
import { updateItem, deleteItem, toggleItemFavorite, toggleItemPin } from '@/actions/items'
import { getActionErrorMessage } from '@/lib/actions/action-error'
import { useAsyncAction } from '@/hooks/useAsyncAction'
import { useFavoriteToggle } from '@/hooks/useFavoriteToggle'
import { useAiTagSuggestions } from '@/hooks/useAiTagSuggestions'
import { useAiDescription } from '@/hooks/useAiDescription'
import type { ItemDetail } from '@/lib/db/items'
import type { Dispatch, SetStateAction } from 'react'

export interface ItemDetailResponse extends Omit<ItemDetail, 'createdAt' | 'updatedAt'> {
  createdAt: string
  updatedAt: string
}

export interface EditForm {
  title: string
  description: string
  content: string
  url: string
  language: string
  tags: string
  collectionIds: string[]
}

interface Options {
  itemId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const URL_TYPES = ['link']
const FILE_TYPES = ['file', 'image']

export function useItemDrawer({ itemId, open, onOpenChange }: Options) {
  const router = useRouter()
  const [item, setItem] = useState<ItemDetailResponse | null>(null)
  const [loading, setLoading] = useState(false)
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

  const { isFavorite, setIsFavorite, favoriting, toggle: handleToggleFavorite } =
    useFavoriteToggle(false, toggleItemFavorite, itemId ?? '')

  const { run: handleSave, inFlight: saving } = useAsyncAction(async () => {
    if (!item || !itemId) return
    const tags = editForm.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    const result = await updateItem(itemId, {
      title: editForm.title,
      description: editForm.description || null,
      content: editForm.content || null,
      url: editForm.url || null,
      language: editForm.language === 'plaintext' ? null : editForm.language || null,
      tags,
      collectionIds: editForm.collectionIds,
    })

    if (!result.success) {
      toast.error(getActionErrorMessage(result.error, 'Validation failed. Please check your inputs.'))
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
  })

  const { run: handleDelete, inFlight: deleting } = useAsyncAction(async () => {
    if (!itemId) return
    const result = await deleteItem(itemId)
    if (!result.success) {
      toast.error(getActionErrorMessage(result.error, 'Failed to delete item.'))
      return
    }
    toast.success('Item deleted')
    onOpenChange(false)
    router.refresh()
  })

  const { run: handleTogglePin, inFlight: pinning } = useAsyncAction(async () => {
    if (!itemId) return
    const optimistic = !isPinned
    setIsPinned(optimistic)
    const result = await toggleItemPin(itemId)
    if (!result.success) {
      setIsPinned(!optimistic)
      toast.error(getActionErrorMessage(result.error, 'Failed to update pin.'))
      return
    }
    toast.success(optimistic ? 'Item pinned' : 'Item unpinned')
    router.refresh()
  })

  const {
    suggestions: tagSuggestions,
    suggesting: suggestingTags,
    handleSuggest: handleSuggestTags,
    handleAccept: handleAcceptTag,
    handleDismiss: handleDismissTag,
    clearSuggestions,
  } = useAiTagSuggestions({
    title: editForm.title,
    content: editForm.content,
    itemType: item?.itemType.name ?? '',
    tags: editForm.tags,
    enabled: !!item,
    onTagsChange: tags => setEditForm(f => ({ ...f, tags })),
  })

  const {
    generating: generatingDescription,
    handleGenerate: handleGenerateDescription,
    clearGenerating,
  } = useAiDescription({
    title: editForm.title || (item?.title ?? ''),
    content: editForm.content,
    url: editForm.url,
    itemType: item?.itemType.name ?? '',
    enabled: !!item,
    onDescription: description => setEditForm(f => ({ ...f, description })),
  })

  useEffect(() => {
    if (!itemId || !open) return

    setLoading(true)
    setItem(null)
    setIsEditing(false)

    fetch(`/devstash/api/items/${itemId}`)
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
  }, [itemId, open, setIsFavorite])

  function handleEditStart() {
    if (!item) return
    setEditForm({
      title: item.title,
      description: item.description ?? '',
      content: item.content ?? '',
      url: item.url ?? '',
      language: item.language || 'plaintext',
      tags: item.tags.map(t => t.name).join(', '),
      collectionIds: item.collections.map(c => c.collection.id),
    })
    clearSuggestions()
    clearGenerating()
    setIsEditing(true)
  }

  function handleUseOptimized(text: string) {
    if (!item) return
    setEditForm({
      title: item.title,
      description: item.description ?? '',
      content: text,
      url: item.url ?? '',
      language: item.language || 'plaintext',
      tags: item.tags.map(t => t.name).join(', '),
      collectionIds: item.collections.map(c => c.collection.id),
    })
    clearSuggestions()
    clearGenerating()
    setIsEditing(true)
  }

  function handleCancelEdit() {
    clearSuggestions()
    setIsEditing(false)
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
  const showFile = FILE_TYPES.some(t => t === typeName) && !!item?.fileUrl

  return {
    item,
    loading,
    isFavorite,
    isPinned,
    isEditing,
    editForm,
    setEditForm: setEditForm as Dispatch<SetStateAction<EditForm>>,
    saving,
    deleting,
    favoriting,
    pinning,
    tagSuggestions,
    suggestingTags,
    generatingDescription,
    handleEditStart,
    handleUseOptimized,
    handleCancelEdit,
    handleSave,
    handleDelete,
    handleToggleFavorite,
    handleTogglePin,
    handleCopy,
    handleSuggestTags,
    handleAcceptTag,
    handleDismissTag,
    handleGenerateDescription,
    Icon,
    typeName,
    showContent,
    showLanguage,
    showCodeEditor,
    showMarkdownEditor,
    showUrl,
    showFile,
  }
}
