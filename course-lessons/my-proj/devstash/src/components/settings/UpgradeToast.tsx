'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

export default function UpgradeToast() {
  useEffect(() => {
    toast.success('Welcome to Pro! All features are now unlocked.')
  }, [])

  return null
}
