'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getActionErrorMessage } from '@/lib/actions/action-error'
import { useAsyncAction } from '@/hooks/useAsyncAction'

type ToggleAction = (id: string) => Promise<{
  success: boolean
  error?: unknown
  data?: { isFavorite: boolean }
}>

export function useFavoriteToggle(initialValue: boolean, action: ToggleAction, id: string) {
  const router = useRouter()
  const [isFavorite, setIsFavorite] = useState(initialValue)

  const { run: toggle, inFlight: favoriting } = useAsyncAction(async () => {
    const result = await action(id)
    if (!result.success) {
      toast.error(getActionErrorMessage(result.error, 'Failed to update favorite.'))
      return
    }
    setIsFavorite(result.data!.isFavorite)
    router.refresh()
  })

  return { isFavorite, setIsFavorite, favoriting, toggle }
}
