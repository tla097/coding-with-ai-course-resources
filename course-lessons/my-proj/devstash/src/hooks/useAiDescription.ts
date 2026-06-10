'use client'

import { toast } from 'sonner'
import { generateDescription } from '@/actions/ai'
import { useAsyncAction } from '@/hooks/useAsyncAction'

interface Options {
  title: string
  content: string
  url: string
  itemType: string
  enabled: boolean
  onDescription: (description: string) => void
}

export function useAiDescription({ title, content, url, itemType, enabled, onDescription }: Options) {
  const { run: handleGenerate, inFlight: generating, reset: clearGenerating } = useAsyncAction(async () => {
    if (!enabled) return
    const result = await generateDescription({
      title: title || 'Untitled',
      content: content.slice(0, 2000),
      url,
      itemType,
    })
    if (!result.success) {
      toast.error(result.error)
      return
    }
    onDescription(result.data.description)
  })

  return { generating, handleGenerate, clearGenerating }
}
