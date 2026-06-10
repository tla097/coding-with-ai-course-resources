'use client'

import { useState } from 'react'

export function useDialogSubmit() {
  const [inProgress, setInProgress] = useState(false)

  function guardedOpenChange(value: boolean, onChange: (v: boolean) => void) {
    if (!inProgress) onChange(value)
  }

  return { inProgress, setInProgress, guardedOpenChange }
}
