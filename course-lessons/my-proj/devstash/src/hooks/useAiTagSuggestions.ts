'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { generateAutoTags } from '@/actions/ai'

interface Options {
  title: string
  content: string
  itemType: string
  tags: string
  enabled: boolean
  onTagsChange: (tags: string) => void
}

export function useAiTagSuggestions({ title, content, itemType, tags, enabled, onTagsChange }: Options) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggesting, setSuggesting] = useState(false)

  async function handleSuggest() {
    if (!enabled) return
    setSuggesting(true)
    const result = await generateAutoTags({
      title: title || 'Untitled',
      content: content.slice(0, 2000),
      itemType,
    })
    setSuggesting(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    const existing = tags.split(',').map(t => t.trim()).filter(Boolean)
    const fresh = result.data.tags.filter(t => !existing.includes(t))
    setSuggestions(fresh)
  }

  function handleAccept(tag: string) {
    setSuggestions(prev => prev.filter(t => t !== tag))
    const existing = tags.split(',').map(t => t.trim()).filter(Boolean)
    if (!existing.includes(tag)) {
      onTagsChange([...existing, tag].join(', '))
    }
  }

  function handleDismiss(tag: string) {
    setSuggestions(prev => prev.filter(t => t !== tag))
  }

  function clearSuggestions() {
    setSuggestions([])
  }

  return { suggestions, suggesting, handleSuggest, handleAccept, handleDismiss, clearSuggestions }
}
