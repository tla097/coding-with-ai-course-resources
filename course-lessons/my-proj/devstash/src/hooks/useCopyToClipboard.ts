'use client'

import { useState } from 'react'
import { toast } from 'sonner'

export function useCopyToClipboard(options?: { resetMs?: number; message?: string }) {
  const resetMs = options?.resetMs ?? 2000
  const message = options?.message ?? 'Copied to clipboard'
  const [copied, setCopied] = useState(false)

  async function copy(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success(message)
    setTimeout(() => setCopied(false), resetMs)
  }

  return { copied, copy }
}
