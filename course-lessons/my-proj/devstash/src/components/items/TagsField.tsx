'use client'

import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AiTagSuggestions from '@/components/items/AiTagSuggestions'

interface Props {
  id: string
  value: string
  onChange: (value: string) => void
  isPro?: boolean
  suggestions: string[]
  suggesting: boolean
  onSuggest: () => void
  onAccept: (tag: string) => void
  onDismiss: (tag: string) => void
}

export default function TagsField({ id, value, onChange, isPro, suggestions, suggesting, onSuggest, onAccept, onDismiss }: Props) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>Tags</Label>
        {isPro && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto py-0.5 px-2 text-xs text-muted-foreground gap-1"
            onClick={onSuggest}
            disabled={suggesting}
          >
            <Sparkles className="h-3 w-3" />
            {suggesting ? 'Suggesting…' : 'Suggest Tags'}
          </Button>
        )}
      </div>
      <Input
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="react, typescript, hooks"
      />
      <p className="text-xs text-muted-foreground">Comma-separated</p>
      <AiTagSuggestions suggestions={suggestions} onAccept={onAccept} onDismiss={onDismiss} />
    </div>
  )
}
