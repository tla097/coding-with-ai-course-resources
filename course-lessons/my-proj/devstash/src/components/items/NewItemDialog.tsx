'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import CodeEditor from '@/components/ui/CodeEditor'
import MarkdownEditor from '@/components/ui/MarkdownEditor'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ICON_MAP } from '@/lib/icon-map'
import { LANGUAGES, CONTENT_TYPES, LANGUAGE_TYPES, CODE_EDITOR_TYPES, MARKDOWN_EDITOR_TYPES } from '@/lib/languages'
import { createItem } from '@/actions/items'
import CollectionPicker from '@/components/items/CollectionPicker'
import TagsField from '@/components/items/TagsField'
import FileUpload, { type UploadResult } from '@/components/items/FileUpload'
import { useAiTagSuggestions } from '@/hooks/useAiTagSuggestions'
import { useAiDescription } from '@/hooks/useAiDescription'
import type { SidebarItemType } from '@/lib/db/sidebar'

const CREATABLE_TYPES = ['snippet', 'prompt', 'command', 'note', 'link', 'file', 'image']
const FILE_UPLOAD_TYPES = ['file', 'image']

interface Props {
  itemTypes: SidebarItemType[]
  collections: { id: string; name: string }[]
  isPro?: boolean
}

interface FormState {
  title: string
  description: string
  content: string
  url: string
  language: string
  tags: string
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  content: '',
  url: '',
  language: 'plaintext',
  tags: '',
}

export default function NewItemDialog({ itemTypes, collections, isPro }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([])
  const [uploadedFile, setUploadedFile] = useState<UploadResult | null>(null)

  const creatableTypes = itemTypes.filter(t => CREATABLE_TYPES.includes(t.name))
  const selectedType = creatableTypes.find(t => t.id === selectedTypeId) ?? null

  const { suggestions: tagSuggestions, suggesting: suggestingTags, handleSuggest: handleSuggestTags, handleAccept: handleAcceptTag, handleDismiss: handleDismissTag, clearSuggestions } = useAiTagSuggestions({
    title: form.title,
    content: form.content,
    itemType: selectedType?.name ?? '',
    tags: form.tags,
    enabled: !!selectedType,
    onTagsChange: tags => setForm(f => ({ ...f, tags })),
  })

  const { generating: generatingDescription, handleGenerate: handleGenerateDescription, clearGenerating } = useAiDescription({
    title: form.title,
    content: form.content,
    url: form.url,
    itemType: selectedType?.name ?? '',
    enabled: !!selectedType,
    onDescription: description => setForm(f => ({ ...f, description })),
  })

  function handleOpen() {
    const defaultType = creatableTypes[0] ?? null
    setSelectedTypeId(defaultType?.id ?? null)
    setForm(EMPTY_FORM)
    setSelectedCollectionIds([])
    clearSuggestions()
    clearGenerating()
    setSaving(false)
    setUploadedFile(null)
    setOpen(true)
  }

  function handleClose(value: boolean) {
    if (!saving) setOpen(value)
  }

  const showContent = selectedType ? CONTENT_TYPES.includes(selectedType.name) : false
  const showLanguage = selectedType ? LANGUAGE_TYPES.includes(selectedType.name) : false
  const showCodeEditor = selectedType ? CODE_EDITOR_TYPES.includes(selectedType.name) : false
  const showMarkdownEditor = selectedType ? MARKDOWN_EDITOR_TYPES.includes(selectedType.name) : false
  const showUrl = selectedType?.name === 'link'
  const showFileUpload = selectedType ? FILE_UPLOAD_TYPES.includes(selectedType.name) : false

  const canSubmit =
    !!selectedType &&
    form.title.trim().length > 0 &&
    (!showUrl || form.url.trim().length > 0) &&
    (!showFileUpload || uploadedFile !== null)

  async function handleSubmit() {
    if (!selectedType || !canSubmit) return
    setSaving(true)

    const tags = form.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    const result = await createItem({
      title: form.title,
      description: form.description || null,
      content: form.content || null,
      url: form.url || null,
      language: form.language === 'plaintext' ? null : form.language || null,
      tags,
      collectionIds: selectedCollectionIds,
      itemTypeId: selectedType.id,
      itemTypeName: selectedType.name as 'snippet' | 'prompt' | 'command' | 'note' | 'link' | 'file' | 'image',
      fileUrl: uploadedFile?.path ?? null,
      fileName: uploadedFile?.fileName ?? null,
      fileSize: uploadedFile?.fileSize ?? null,
    })

    setSaving(false)

    if (!result.success) {
      const msg =
        typeof result.error === 'string'
          ? result.error
          : 'Validation failed. Please check your inputs.'
      toast.error(msg)
      return
    }

    toast.success('Item created')
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button size="sm" onClick={handleOpen}>
        <Plus className="h-4 w-4" />
        New Item
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent showCloseButton={!saving} className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Item</DialogTitle>
          </DialogHeader>

          {/* Type selector */}
          <div className="space-y-1.5 mb-4">
            <Label>Type</Label>
            <div className="flex flex-wrap gap-2">
              {creatableTypes.map(type => {
                const Icon = ICON_MAP[type.icon] ?? null
                const isSelected = type.id === selectedTypeId
                return (
                  <button
                    key={type.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => { setSelectedTypeId(type.id); setUploadedFile(null) }}
                    className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors"
                    style={
                      isSelected
                        ? {
                            borderColor: type.color,
                            backgroundColor: `${type.color}15`,
                            color: type.color,
                          }
                        : undefined
                    }
                  >
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    <span className="capitalize">{type.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new-title"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Title"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="new-description">Description</Label>
                {isPro && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto py-0.5 px-2 text-xs text-muted-foreground gap-1"
                    onClick={handleGenerateDescription}
                    disabled={generatingDescription}
                  >
                    <Sparkles className="h-3 w-3" />
                    {generatingDescription ? 'Generating…' : 'Generate'}
                  </Button>
                )}
              </div>
              <Textarea
                id="new-description"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Description (optional)"
                rows={2}
              />
            </div>

            {showLanguage && (
              <div className="space-y-1.5">
                <Label htmlFor="new-language">Language</Label>
                <Select
                  value={form.language}
                  onValueChange={v => setForm(f => ({ ...f, language: v ?? 'plaintext' }))}
                >
                  <SelectTrigger id="new-language" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(lang => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {showContent && (
              <div className="space-y-1.5">
                <Label>Content</Label>
                {showCodeEditor ? (
                  <CodeEditor
                    value={form.content}
                    onChange={v => setForm(f => ({ ...f, content: v }))}
                    language={form.language === 'plaintext' ? null : form.language || null}
                  />
                ) : showMarkdownEditor ? (
                  <MarkdownEditor
                    value={form.content}
                    onChange={v => setForm(f => ({ ...f, content: v }))}
                  />
                ) : (
                  <Textarea
                    id="new-content"
                    value={form.content}
                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    placeholder="Content"
                    rows={6}
                  />
                )}
              </div>
            )}

            {showUrl && (
              <div className="space-y-1.5">
                <Label htmlFor="new-url">
                  URL <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="new-url"
                  type="url"
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://…"
                />
              </div>
            )}

            {showFileUpload && selectedType && (
              <div className="space-y-1.5">
                <Label>
                  {selectedType.name === 'image' ? 'Image' : 'File'}{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <FileUpload
                  itemType={selectedType.name as 'file' | 'image'}
                  uploaded={uploadedFile}
                  onUploadComplete={setUploadedFile}
                  onClear={() => setUploadedFile(null)}
                />
              </div>
            )}

            <TagsField
              id="new-tags"
              value={form.tags}
              onChange={v => setForm(f => ({ ...f, tags: v }))}
              isPro={isPro}
              suggestions={tagSuggestions}
              suggesting={suggestingTags}
              onSuggest={handleSuggestTags}
              onAccept={handleAcceptTag}
              onDismiss={handleDismissTag}
            />

            {collections.length > 0 && (
              <div className="space-y-1.5">
                <Label>Collections</Label>
                <CollectionPicker
                  collections={collections}
                  selected={selectedCollectionIds}
                  onChange={setSelectedCollectionIds}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={!canSubmit || saving}>
              {saving ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
