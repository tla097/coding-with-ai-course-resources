'use client'

import { Check, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  suggestions: string[]
  onAccept: (tag: string) => void
  onDismiss: (tag: string) => void
}

export default function AiTagSuggestions({ suggestions, onAccept, onDismiss }: Props) {
  if (suggestions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {suggestions.map(tag => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded-full border border-dashed border-primary/40 bg-primary/5 px-2 py-0.5 text-xs text-primary"
        >
          <Sparkles className="h-3 w-3 shrink-0" />
          <span>{tag}</span>
          <button
            type="button"
            aria-label={`Accept tag ${tag}`}
            onClick={() => onAccept(tag)}
            className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
          >
            <Check className="h-3 w-3" />
          </button>
          <button
            type="button"
            aria-label={`Dismiss tag ${tag}`}
            onClick={() => onDismiss(tag)}
            className="rounded-full p-0.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-auto py-0.5 px-2 text-xs text-muted-foreground"
        onClick={() => suggestions.forEach(t => onDismiss(t))}
      >
        Dismiss all
      </Button>
    </div>
  )
}
