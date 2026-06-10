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
import FileUpload, { type UploadResult } from '@/components/items/FileUpload'

export interface FormState {
  title: string
  description: string
  content: string
  url: string
  language: string
  tags: string
}

interface Props {
  form: FormState
  setForm: Dispatch<SetStateAction<FormState>>
  isPro?: boolean
  showLanguage: boolean
  showContent: boolean
  showCodeEditor: boolean
  showMarkdownEditor: boolean
  showUrl: boolean
  showFileUpload: boolean
  selectedTypeName?: string
  collections: { id: string; name: string }[]
  selectedCollectionIds: string[]
  onCollectionChange: (ids: string[]) => void
  uploadedFile: UploadResult | null
  onUploadComplete: (result: UploadResult) => void
  onClearUpload: () => void
  tagSuggestions: string[]
  suggestingTags: boolean
  generatingDescription: boolean
  onSuggestTags: () => void
  onAcceptTag: (tag: string) => void
  onDismissTag: (tag: string) => void
  onGenerateDescription: () => void
}

export default function ItemFormFields({
  form,
  setForm,
  isPro,
  showLanguage,
  showContent,
  showCodeEditor,
  showMarkdownEditor,
  showUrl,
  showFileUpload,
  selectedTypeName,
  collections,
  selectedCollectionIds,
  onCollectionChange,
  uploadedFile,
  onUploadComplete,
  onClearUpload,
  tagSuggestions,
  suggestingTags,
  generatingDescription,
  onSuggestTags,
  onAcceptTag,
  onDismissTag,
  onGenerateDescription,
}: Props) {
  return (
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
              onClick={onGenerateDescription}
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

      {showFileUpload && selectedTypeName && (
        <div className="space-y-1.5">
          <Label>
            {selectedTypeName === 'image' ? 'Image' : 'File'}{' '}
            <span className="text-destructive">*</span>
          </Label>
          <FileUpload
            itemType={selectedTypeName as 'file' | 'image'}
            uploaded={uploadedFile}
            onUploadComplete={onUploadComplete}
            onClear={onClearUpload}
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
        onSuggest={onSuggestTags}
        onAccept={onAcceptTag}
        onDismiss={onDismissTag}
      />

      {collections.length > 0 && (
        <div className="space-y-1.5">
          <Label>Collections</Label>
          <CollectionPicker
            collections={collections}
            selected={selectedCollectionIds}
            onChange={onCollectionChange}
          />
        </div>
      )}
    </div>
  )
}
