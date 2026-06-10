'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Sparkles } from 'lucide-react'
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
import { LANGUAGES } from '@/lib/languages'
import CollectionPicker from '@/components/items/CollectionPicker'
import TagsField from '@/components/items/TagsField'
import type { EditForm } from '@/hooks/useItemDrawer'

interface Props {
  editForm: EditForm
  setEditForm: Dispatch<SetStateAction<EditForm>>
  isPro?: boolean
  showLanguage: boolean
  showContent: boolean
  showCodeEditor: boolean
  showMarkdownEditor: boolean
  showUrl: boolean
  collections: { id: string; name: string }[]
  tagSuggestions: string[]
  suggestingTags: boolean
  generatingDescription: boolean
  onSuggestTags: () => void
  onAcceptTag: (tag: string) => void
  onDismissTag: (tag: string) => void
  onGenerateDescription: () => void
}

export default function ItemDrawerEditForm({
  editForm,
  setEditForm,
  isPro,
  showLanguage,
  showContent,
  showCodeEditor,
  showMarkdownEditor,
  showUrl,
  collections,
  tagSuggestions,
  suggestingTags,
  generatingDescription,
  onSuggestTags,
  onAcceptTag,
  onDismissTag,
  onGenerateDescription,
}: Props) {
  return (
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
        <div className="flex items-center justify-between">
          <Label htmlFor="edit-description">Description</Label>
          {isPro && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto py-0.5 px-2 text-xs text-muted-foreground gap-1"
              onClick={onGenerateDescription}
              disabled={generatingDescription}
            >
              <Sparkles className="h-3 w-3" />
              {generatingDescription ? 'Generating…' : 'Generate'}
            </Button>
          )}
        </div>
        <Textarea
          id="edit-description"
          value={editForm.description}
          onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Description (optional)"
          rows={3}
        />
      </div>

      {showLanguage && (
        <div className="space-y-1.5">
          <Label htmlFor="edit-language">Language</Label>
          <Select
            value={editForm.language}
            onValueChange={v => setEditForm(f => ({ ...f, language: v ?? 'plaintext' }))}
          >
            <SelectTrigger id="edit-language" className="w-full">
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
              value={editForm.content}
              onChange={v => setEditForm(f => ({ ...f, content: v }))}
              language={editForm.language === 'plaintext' ? null : editForm.language || null}
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

      <TagsField
        id="edit-tags"
        value={editForm.tags}
        onChange={v => setEditForm(f => ({ ...f, tags: v }))}
        isPro={isPro}
        suggestions={tagSuggestions}
        suggesting={suggestingTags}
        onSuggest={onSuggestTags}
        onAccept={onAcceptTag}
        onDismiss={onDismissTag}
      />

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
  )
}
