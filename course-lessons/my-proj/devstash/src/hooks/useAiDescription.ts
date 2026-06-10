'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { generateDescription } from '@/actions/ai'

interface Options {
  title: string
  content: string
  url: string
  itemType: string
  enabled: boolean
  onDescription: (description: string) => void
}

export function useAiDescription({ title, content, url, itemType, enabled, onDescription }: Options) {
  const [generating, setGenerating] = useState(false)

  async function handleGenerate() {
    if (!enabled) return
    setGenerating(true)
    const result = await generateDescription({
      title: title || 'Untitled',
      content: content.slice(0, 2000),
      url,
      itemType,
    })
    setGenerating(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    onDescription(result.data.description)
  }

  function clearGenerating() {
    setGenerating(false)
  }

  return { generating, handleGenerate, clearGenerating }
}
