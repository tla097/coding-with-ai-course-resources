'use client'

import { useState, useCallback, useRef } from 'react'

export function useAsyncAction<T>(fn: () => Promise<T>) {
  const [inFlight, setInFlight] = useState(false)
  const fnRef = useRef(fn)
  fnRef.current = fn

  const run = useCallback(async (): Promise<T | undefined> => {
    if (inFlight) return undefined
    setInFlight(true)
    try {
      return await fnRef.current()
    } finally {
      setInFlight(false)
    }
  }, [inFlight])

  const reset = useCallback(() => setInFlight(false), [])

  return { run, inFlight, reset }
}
